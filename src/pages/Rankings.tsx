import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import RankBadge from "@/components/RankBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSoloProfiles, getTeams } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const Rankings = () => {
  useRealtimeRefresh({
    keys: ["solo_profiles", "teams", "matches", "tournaments"],
    intervalMs: 10000,
  });
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("type") === "solo" ? "solo" : "team";

  const teamRankings = getTeams()
    .slice()
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .map((team, index) => ({
      rank: index + 1,
      name: team.name,
      game: team.game || team.game_name || "Unknown",
      rating: Number(team.rating || 0),
      tier: team.rank_tier || "Bronze",
      wins: Number(team.wins || 0),
      losses: Number(team.losses || 0),
      streak: 0,
    }));

  const soloRankings = getSoloProfiles()
    .slice()
    .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    .map((profile, index) => ({
      rank: index + 1,
      name: profile.in_game_name || profile.user_name || profile.user_email,
      rating: Number(profile.rating || 0),
      tier: profile.rank_tier || "Bronze",
      wins: Number(profile.stats?.wins || 0),
      losses: Number(profile.stats?.losses || 0),
      streak: 0,
    }));

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

          <TabsContent value="team">
            <Card className="glass-card overflow-hidden border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {["Rank", "Team", "Game", "Rating", "Tier", "W/L"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teamRankings.map((p) => (
                      <tr
                        key={`${p.rank}-${p.name}`}
                        className={cn(
                          "border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors",
                          p.rank <= 3 && "bg-primary/[0.03]"
                        )}
                      >
                        <td className="px-4 py-3 font-display font-bold text-lg">#{p.rank}</td>
                        <td className="px-4 py-3 font-semibold">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.game}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{p.rating}</td>
                        <td className="px-4 py-3"><RankBadge tier={p.tier as any} size="sm" /></td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className="text-success">{p.wins}W</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-destructive">{p.losses}L</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="solo">
            <Card className="glass-card overflow-hidden border-white/10">
              {soloRankings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        {["Rank", "Player", "Solo Rating", "Tier", "W/L"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {soloRankings.map((p) => (
                        <tr key={`${p.rank}-${p.name}`} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                          <td className="px-4 py-3 font-display font-bold text-lg">#{p.rank}</td>
                          <td className="px-4 py-3 font-semibold">{p.name}</td>
                          <td className="px-4 py-3 font-mono font-semibold text-purple-400">{p.rating}</td>
                          <td className="px-4 py-3"><RankBadge tier={p.tier as any} size="sm" /></td>
                          <td className="px-4 py-3 font-mono text-xs">
                            <span className="text-success">{p.wins}W</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-destructive">{p.losses}L</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">No solo rankings yet.</p>
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

