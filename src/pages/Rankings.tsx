import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { topPlayers, users } from "@/lib/mock-data";
import RankBadge from "@/components/RankBadge";
import type { RankTier } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Rankings = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("type") === "solo" ? "solo" : "team";

  // Team Rankings
  const teamRankings = topPlayers;

  // Solo Rankings - filter users with solo_rating > 0 and sort
  const soloRankings = users
    .filter((u) => u.solo_rating && u.solo_rating > 0)
    .map((u, index) => ({
      rank: index + 1,
      name: u.name,
      game: "All Games",
      rating: u.solo_rating || 0,
      tier: u.solo_tier || "Bronze",
      wins: Math.floor((u.solo_rating || 0) / 100),
      losses: Math.floor((u.solo_rating || 0) / 150),
      streak: Math.floor(Math.random() * 15) + 1,
    }))
    .sort((a, b) => b.rating - a.rating);

  return (
    <div className="container py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-display font-bold mb-2">Global Rankings</h1>
        <p className="text-muted-foreground mb-8">Compete in team or solo rankings</p>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="team" className="font-display">Team Rankings</TabsTrigger>
            <TabsTrigger value="solo" className="font-display">Solo Rankings</TabsTrigger>
          </TabsList>

          {/* Team Rankings Tab */}
          <TabsContent value="team">
            <Card className="glass-card overflow-hidden border-white/10">
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
                    {teamRankings.map((p, i) => (
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
            </Card>
          </TabsContent>

          {/* Solo Rankings Tab */}
          <TabsContent value="solo">
            <Card className="glass-card overflow-hidden border-white/10">
              {soloRankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Rank", "Player", "Solo Rating", "Tier", "W/L", "Streak"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {soloRankings.map((p, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors",
                            p.rank <= 3 && "bg-purple/[0.03]"
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className={cn(
                              "font-display font-bold text-lg",
                              p.rank === 1 && "text-purple-400",
                              p.rank === 2 && "text-blue-300",
                              p.rank === 3 && "text-pink-600"
                            )}>
                              #{p.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold">{p.name}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-purple-400">{p.rating}</td>
                          <td className="px-4 py-3"><RankBadge tier={p.tier as RankTier} size="sm" /></td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="text-success">{p.wins}W</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-destructive">{p.losses}L</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-purple-400">⭐ {p.streak}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No solo rankings yet. Submit game proofs to climb the solo leaderboard!</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Rankings;
