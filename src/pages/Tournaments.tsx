import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Users, Trophy, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getPageBackgrounds, getTournaments } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const filters = ["All", "Registration Open", "Live", "Completed", "Coming Soon"];
const statusMap: Record<string, string> = {
  "Registration Open": "registration_open",
  "Live": "in_progress",
  "Completed": "completed",
  "Coming Soon": "draft",
};

const Tournaments = () => {
  useRealtimeRefresh({
    keys: ["tournaments", "page_backgrounds"],
    intervalMs: 10000,
  });
  const [active, setActive] = useState("All");
  const [search, setSearch] = useState("");
  const tournaments = getTournaments();
  const backgrounds = getPageBackgrounds();
  const pageBg = backgrounds.tournaments_page;

  const filtered = tournaments.filter((t) => {
    if (active !== "All" && t.status !== statusMap[active]) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="relative min-h-screen">
      {pageBg && (
        <img
          src={pageBg}
          alt="Tournaments background"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/75 to-slate-950/95" />
      <div className="container py-12 relative">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-display font-bold mb-2">Tournaments</h1>
        <p className="text-muted-foreground mb-8">Find and join competitive tournaments</p>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-white/[0.08] text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  active === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t, index) => {
            const entryAmount = Number(t.entry_fee_amount ?? t.entry_fee ?? 0);
            const entryCurrency = t.entry_fee_currency || "RWF";
            const badge =
              t.status === "in_progress"
                ? "LIVE"
                : t.status === "registration_open"
                ? "REGISTRATION OPEN"
                : t.status === "completed"
                ? "COMPLETED"
                : "COMING SOON";
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="md:col-span-2 lg:col-span-3"
              >
                <Link to={`/tournament?id=${t.id}`} className="block group">
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/95 backdrop-blur-sm"
                  >
                    <div className="grid md:grid-cols-[1.15fr_1fr]">
                      <div className="p-5 md:p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase tracking-widest text-cyan-300/80 font-mono">
                              {t.game_name || "Tournament"}
                            </span>
                            <span className="text-white/20">|</span>
                            <span
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-mono tracking-wider",
                                t.status === "in_progress"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : t.status === "registration_open"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-white/10 text-white/65"
                              )}
                            >
                              {badge}
                            </span>
                          </div>
                          <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-300 transition-colors">
                            {t.name}
                          </h3>
                          <p className="text-sm text-white/65 mt-2">
                            {String(t.format || "").replace(/_/g, " ")} • {t.region || "Global"}
                          </p>
                        </div>
                        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono text-white/70">
                          <span className="inline-flex items-center gap-1.5">
                            <Users size={12} />
                            {t.registered_teams?.length || t.registered_count || 0}/{t.max_teams || 0}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Trophy size={12} />
                            {t.prize_pool || "-"}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar size={12} />
                            {t.start_date ? new Date(t.start_date).toLocaleDateString() : "-"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-amber-300">
                            {entryAmount > 0 ? `${entryAmount.toLocaleString()} ${entryCurrency}` : "FREE"}
                          </span>
                        </div>
                        <div className="mt-4 text-cyan-300 text-xs font-mono inline-flex items-center gap-1.5">
                          View Tournament
                          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                      <div className="relative min-h-[190px] md:min-h-full">
                        {t.banner_url ? (
                          <motion.img
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.4 }}
                            src={t.banner_url}
                            alt={t.name}
                            className="absolute inset-0 h-full w-full object-cover brightness-110 saturate-110"
                          />
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0 bg-gradient-to-br from-cyan-900/60 via-slate-900 to-fuchsia-900/50"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-l from-black/5 via-black/12 to-black/35 md:to-transparent" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground font-mono text-sm">No tournaments found</div>
        )}
      </motion.div>
      </div>
    </div>
  );
};

export default Tournaments;
