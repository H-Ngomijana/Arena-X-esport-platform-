import { motion } from "framer-motion";
import { topPlayers } from "@/lib/mock-data";
import RankBadge from "@/components/RankBadge";
import type { RankTier } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const Rankings = () => (
  <div className="container py-12">
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-4xl font-display font-bold mb-2">Global Rankings</h1>
      <p className="text-muted-foreground mb-8">Top players across all games</p>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Rank", "Player", "Game", "Rating", "Tier", "W/L", "Streak"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topPlayers.map((p, i) => (
                <motion.tr
                  key={p.rank}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors",
                    p.rank <= 3 && "bg-primary/[0.03]"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className={cn(
                      "font-display font-bold text-lg",
                      p.rank === 1 && "text-yellow-400",
                      p.rank === 2 && "text-slate-300",
                      p.rank === 3 && "text-amber-600"
                    )}>
                      #{p.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.game}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{p.rating}</td>
                  <td className="px-4 py-3"><RankBadge tier={p.tier as RankTier} size="sm" /></td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="text-success">{p.wins}W</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-destructive">{p.losses}L</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-success">🔥 {p.streak}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  </div>
);

export default Rankings;
