import { useEffect, useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { adminPlayerRatings, teamMembers, computeTier, tierColors } from "@/lib/admin-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTeams, saveTeams } from "@/lib/storage";
import { toast } from "sonner";

const AdminTeamsPlayers = ({ logAction }: { logAction: (a: string) => void }) => {
  const [teamsList, setTeamsList] = useState(() => getTeams());
  const [playerRatings, setPlayerRatings] = useState(adminPlayerRatings);
  const [teamSearch, setTeamSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [rosterTeamId, setRosterTeamId] = useState<string | null>(null);
  const [editingRating, setEditingRating] = useState<Record<string, number>>({});

  const filteredTeams = teamsList.filter((t) =>
    String(t.name || "")
      .toLowerCase()
      .includes(teamSearch.toLowerCase())
  );
  const filteredPlayers = playerRatings.filter((p) =>
    `${p.user_name} ${p.user_email} ${p.game_name}`.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const rosterMembers = rosterTeamId ? teamMembers[rosterTeamId] || [] : [];

  useEffect(() => {
    const refreshTeams = () => setTeamsList(getTeams());
    refreshTeams();

    const onDataChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail;
      if (!detail?.key || detail.key === "teams" || detail.key === "remote_sync") {
        refreshTeams();
      }
    };

    const onStorageChanged = (event: StorageEvent) => {
      if (event.key === "teams" || event.key === null) {
        refreshTeams();
      }
    };

    window.addEventListener("arenax:data-changed", onDataChanged as EventListener);
    window.addEventListener("storage", onStorageChanged);

    return () => {
      window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
      window.removeEventListener("storage", onStorageChanged);
    };
  }, []);

  const handleRatingBlur = (id: string) => {
    const newRating = editingRating[id];
    if (newRating === undefined) return;
    const newTier = computeTier(newRating);
    setPlayerRatings((prev) => prev.map((p) => (p.id === id ? { ...p, rating: newRating, rank_tier: newTier as any } : p)));
    logAction(`Updated rating: ${id} -> ${newRating} (${newTier})`);
    setEditingRating((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
  };

  const resetPlayer = (id: string) => {
    setPlayerRatings((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              rating: 1000,
              rank_tier: "Bronze" as any,
              stats: {
                ...p.stats,
                wins: 0,
                losses: 0,
                draws: 0,
                matches_played: 0,
                win_rate: 0,
                current_streak: 0,
                best_streak: 0,
              },
            }
          : p
      )
    );
    logAction(`Reset player: ${id}`);
    toast.success("Player reset to 1000 Bronze");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Teams & Players</h2>

      <Tabs defaultValue="teams" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger
            value="teams"
            className="font-mono text-xs data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300"
          >
            TEAMS
          </TabsTrigger>
          <TabsTrigger
            value="players"
            className="font-mono text-xs data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300"
          >
            PLAYER RATINGS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-4 mt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search teams..."
              className="bg-white/5 border-white/10 text-white font-mono pl-9"
            />
          </div>
          <div className="space-y-2">
            {filteredTeams.map((t: any) => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-mono text-xs text-white/60 font-bold flex-shrink-0">
                  {t.tag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-white">
                    {t.name} <span className="text-white/30">[{t.tag}]</span>
                  </div>
                  <div className="font-mono text-[10px] text-white/30">
                    {Array.isArray(t.members) ? t.members.length : Number(t.members || 0)} members - {t.rating} MMR - {t.rank_tier || t.tier || "Unranked"}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">{t.wins}W</span>
                <span className="font-mono text-[10px] text-rose-400">{t.losses}L</span>
                <button
                  onClick={() => setRosterTeamId(t.id)}
                  className="font-mono text-[10px] px-3 py-1.5 rounded border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  ROSTER
                </button>
                <button
                  onClick={() => {
                    setTeamsList((prev) => {
                      const next = prev.filter((x: any) => x.id !== t.id);
                      saveTeams(next);
                      return next;
                    });
                    logAction(`Deleted team: ${t.name}`);
                    toast.success("Team deleted");
                  }}
                  className="font-mono text-[10px] px-3 py-1.5 rounded border border-rose-500/20 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="players" className="space-y-4 mt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Input
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              placeholder="Search players..."
              className="bg-white/5 border-white/10 text-white font-mono pl-9"
            />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {["PLAYER", "GAME", "TIER", "RATING", "W/L", "ACTIONS"].map((h) => (
                    <th key={h} className="font-mono text-[10px] text-white/30 uppercase px-4 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm text-white">{p.user_name}</div>
                      <div className="font-mono text-[10px] text-white/30">{p.user_email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/60">{p.game_name}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs font-bold ${tierColors[p.rank_tier] || "text-white/50"}`}>{p.rank_tier}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-white">{p.rating}</span>
                        <input
                          type="number"
                          className="w-20 h-7 rounded bg-white/5 border border-white/10 text-white font-mono text-xs px-2"
                          value={editingRating[p.id] ?? p.rating}
                          onChange={(e) => setEditingRating((prev) => ({ ...prev, [p.id]: +e.target.value }))}
                          onBlur={() => handleRatingBlur(p.id)}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <span className="text-emerald-400">{p.stats.wins}W</span>
                      <span className="text-white/20 mx-1">/</span>
                      <span className="text-rose-400">{p.stats.losses}L</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => resetPlayer(p.id)}
                        className="p-1.5 text-white/30 hover:text-rose-400 transition-colors"
                        title="Reset"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rosterTeamId} onOpenChange={() => setRosterTeamId(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Team Roster</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {rosterMembers.length === 0 && (
              <div className="font-mono text-xs text-white/30 text-center py-4">No roster data</div>
            )}
            {rosterMembers.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className="flex-1">
                  <div className="font-mono text-sm text-white">{m.email}</div>
                  <div className="font-mono text-[10px] text-white/30">{m.role} - Joined {m.joined_date}</div>
                </div>
                {m.role !== "Captain" && (
                  <button className="font-mono text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors">REMOVE</button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTeamsPlayers;
