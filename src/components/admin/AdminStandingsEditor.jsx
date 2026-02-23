import { useEffect, useState } from "react";
import { getSoloProfiles, getTeams, getTournaments, saveTournaments } from "@/lib/storage";
import { users } from "@/lib/mock-data";
import { toast } from "sonner";

const defaultPlayer = { rank: 1, name: "", email: "", mmr: 1000, badge: "ADVANCING" };
const defaultTeam = { rank: 1, name: "", wins: 0, losses: 0 };

const AdminStandingsEditor = ({ tournamentId, onDone }) => {
  const [players, setPlayers] = useState([defaultPlayer]);
  const [teams, setTeams] = useState([defaultTeam]);
  const [playerSuggestion, setPlayerSuggestion] = useState("");
  const [teamSuggestion, setTeamSuggestion] = useState("");

  useEffect(() => {
    const tournament = getTournaments().find((item) => item.id === tournamentId);
    if (!tournament) return;
    setPlayers(tournament.top_players_override?.length ? tournament.top_players_override : [defaultPlayer]);
    setTeams(tournament.top_teams_override?.length ? tournament.top_teams_override : [defaultTeam]);
  }, [tournamentId]);

  const save = () => {
    const tournaments = getTournaments();
    saveTournaments(
      tournaments.map((item) =>
        item.id === tournamentId
          ? {
              ...item,
              top_players_override: players.filter((p) => p.name),
              top_teams_override: teams.filter((t) => t.name),
            }
          : item
      )
    );
    toast.success("Standings updated");
    onDone?.();
  };

  const tournament = getTournaments().find((item) => item.id === tournamentId);
  const teamsPool = getTeams()
    .filter((team) => !tournament?.game_id || team.game_id === tournament.game_id)
    .sort((a, b) => (b.rating || b.wins || 0) - (a.rating || a.wins || 0));

  const soloPool = getSoloProfiles()
    .filter((profile) => !tournament?.game_id || profile.game_id === tournament.game_id)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const playerPool = [
    ...soloPool.map((item) => ({
      id: `solo_${item.id}`,
      name: item.in_game_name || item.user_name,
      email: item.user_email || "",
      mmr: item.rating || 1000,
    })),
    ...users
      .filter((user) => !tournament?.game_id || user.game_id === tournament.game_id)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .map((user) => ({
        id: `user_${user.id}`,
        name: user.name,
        email: user.email || "",
        mmr: user.rating || 1000,
      })),
  ];

  const addSuggestedPlayer = () => {
    const selected = playerPool.find((item) => item.id === playerSuggestion);
    if (!selected) {
      toast.error("Select a suggested player first");
      return;
    }
    if (players.some((item) => item.name.toLowerCase() === selected.name.toLowerCase())) {
      toast.error("Player already in standings");
      return;
    }
    setPlayers((prev) => [
      ...prev,
      {
        rank: prev.length + 1,
        name: selected.name,
        email: selected.email,
        mmr: selected.mmr,
        badge: "ADVANCING",
      },
    ]);
    setPlayerSuggestion("");
  };

  const addSuggestedTeam = () => {
    const selected = teamsPool.find((item) => item.id === teamSuggestion);
    if (!selected) {
      toast.error("Select a suggested team first");
      return;
    }
    if (teams.some((item) => item.name.toLowerCase() === selected.name.toLowerCase())) {
      toast.error("Team already in standings");
      return;
    }
    setTeams((prev) => [
      ...prev,
      {
        rank: prev.length + 1,
        name: selected.name,
        wins: Number(selected.wins || 0),
        losses: Number(selected.losses || 0),
      },
    ]);
    setTeamSuggestion("");
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4 space-y-3">
      <p className="font-mono text-xs text-cyan-300 uppercase">Update Standings</p>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Top Players</p>
        <div className="grid grid-cols-4 gap-2">
          <select
            value={playerSuggestion}
            onChange={(e) => setPlayerSuggestion(e.target.value)}
            className="col-span-3 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono"
          >
            <option value="">Suggest from highest ratings</option>
            {playerPool.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.mmr} MMR)
              </option>
            ))}
          </select>
          <button onClick={addSuggestedPlayer} className="h-9 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono">
            ADD
          </button>
        </div>
        {players.map((player, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2">
            <input value={player.rank} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, rank: Number(e.target.value) } : p)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={player.name} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)))} placeholder="name" className="col-span-2 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={player.mmr} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, mmr: Number(e.target.value) } : p)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={player.badge} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, badge: e.target.value } : p)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
          </div>
        ))}
        <button onClick={() => setPlayers((prev) => [...prev, { ...defaultPlayer, rank: prev.length + 1 }])} className="h-8 px-3 rounded bg-white/10 text-white text-xs font-mono">+ Add Player</button>
      </div>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Top Teams</p>
        <div className="grid grid-cols-4 gap-2">
          <select
            value={teamSuggestion}
            onChange={(e) => setTeamSuggestion(e.target.value)}
            className="col-span-3 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono"
          >
            <option value="">Suggest from best teams</option>
            {teamsPool.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} (W:{candidate.wins || 0} L:{candidate.losses || 0})
              </option>
            ))}
          </select>
          <button onClick={addSuggestedTeam} className="h-9 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono">
            ADD
          </button>
        </div>
        {teams.map((team, idx) => (
          <div key={idx} className="grid grid-cols-4 gap-2">
            <input value={team.rank} onChange={(e) => setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, rank: Number(e.target.value) } : t)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={team.name} onChange={(e) => setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, name: e.target.value } : t)))} placeholder="team" className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={team.wins} onChange={(e) => setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, wins: Number(e.target.value) } : t)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={team.losses} onChange={(e) => setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, losses: Number(e.target.value) } : t)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
          </div>
        ))}
        <button onClick={() => setTeams((prev) => [...prev, { ...defaultTeam, rank: prev.length + 1 }])} className="h-8 px-3 rounded bg-white/10 text-white text-xs font-mono">+ Add Team</button>
      </div>
      <button onClick={save} className="h-10 w-full rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono">
        SAVE STANDINGS
      </button>
    </div>
  );
};

export default AdminStandingsEditor;
