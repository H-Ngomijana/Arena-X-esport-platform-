import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import TournamentCard from "@/components/TournamentCard";
import { cn } from "@/lib/utils";
import { getPageBackgrounds, getTournaments } from "@/lib/storage";

const filters = ["All", "Registration Open", "Live", "Completed", "Coming Soon"];
const statusMap: Record<string, string> = {
  "Registration Open": "registration_open",
  "Live": "in_progress",
  "Completed": "completed",
  "Coming Soon": "draft",
};

const Tournaments = () => {
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
          {filtered.map((t) => (
            <TournamentCard key={t.id} {...t} />
          ))}
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
