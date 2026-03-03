import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAccountByEmail, getAnnouncements } from "@/lib/storage";

const badgeStyles = {
  info: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  error: "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const Announcements = () => {
  const announcements = getAnnouncements();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20 pb-12">
      <div className="container max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-2">Announcements</h1>
          <p className="text-muted-foreground">Official platform updates from ArenaX admin.</p>
        </motion.div>

        <div className="space-y-4">
          {announcements.length === 0 && (
            <Card className="p-12 border-white/10 text-center">
              <Megaphone className="mx-auto text-muted-foreground mb-3" size={24} />
              <p className="text-muted-foreground">No announcements published yet.</p>
            </Card>
          )}

          {announcements.map((item, index) => {
            const account = getAccountByEmail(item.created_by);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-lg font-semibold">{item.title}</h2>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] uppercase border ${
                      badgeStyles[item.type] || badgeStyles.info
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{item.message}</p>
                {item.image_url ? (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
                    <img src={item.image_url} alt={item.title} className="w-full h-52 object-cover" />
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {account?.avatar_url ? (
                    <img src={account.avatar_url} alt={account.full_name} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px]">
                      {(item.created_by || "A")[0]?.toUpperCase()}
                    </span>
                  )}
                  <span>
                    {new Date(item.created_at).toLocaleString()} · {item.created_by}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
