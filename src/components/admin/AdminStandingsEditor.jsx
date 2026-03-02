import { useEffect, useState } from "react";
import { getAccounts, getSoloProfiles, getTeams, getTournaments, saveTournaments } from "@/lib/storage";
import { toast } from "sonner";

const defaultPlayer = { rank: 1, name: "", email: "", mmr: 1000, badge: "ADVANCING", avatar_url: "" };
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

  const soloPoolRaw = getSoloProfiles()
    .filter((profile) => !tournament?.game_id || profile.game_id === tournament.game_id)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .reduce((acc, profile) => {
      const key = (profile.user_email || "").toLowerCase();
      if (!key) return acc;
      if (!acc[key] || (profile.rating || 0) > (acc[key].rating || 0)) {
        acc[key] = profile;
      }
      return acc;
    }, {});

  const accountsPool = getAccounts()
    .filter((account) => account.email_verified)
    .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

  const playerPool = accountsPool.map((account) => {
    const solo = soloPoolRaw[account.email.toLowerCase()];
    return {
      id: `account_${account.id}`,
      name: account.handle ? `${account.full_name} (@${account.handle})` : account.full_name,
      email: account.email,
      mmr: solo?.rating || 1000,
      avatar_url: account.avatar_url || solo?.avatar_url || "",
    };
  });

  const addSuggestedPlayer = () => {
    const selected = playerPool.find((item) => item.id === playerSuggestion);
    if (!selected) {
      toast.error("Select a suggested player first");
      return;
    }
    if (players.some((item) => (item.email || "").toLowerCase() === selected.email.toLowerCase())) {
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
        avatar_url: selected.avatar_url,
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

  const removePlayer = (idx) => {
    setPlayers((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((entry, i) => ({ ...entry, rank: i + 1 }))
    );
  };

  const removeTeam = (idx) => {
    setTeams((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((entry, i) => ({ ...entry, rank: i + 1 }))
    );
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
          <div key={idx} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-1 text-xs text-white/70 font-mono">#{player.rank}</div>
            <div className="col-span-1">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                  {(player.name || "U")[0]}
                </div>
              )}
            </div>
            <input value={player.name} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)))} placeholder="name" className="col-span-4 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={player.mmr} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, mmr: Number(e.target.value) } : p)))} className="col-span-2 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <input value={player.badge} onChange={(e) => setPlayers((prev) => prev.map((p, i) => (i === idx ? { ...p, badge: e.target.value } : p)))} className="col-span-3 h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono" />
            <button
              onClick={() => removePlayer(idx)}
              className="col-span-1 h-9 rounded bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-mono"
              type="button"
            >
              DEL
            </button>
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
            <div className="flex gap-2">
              <input value={team.losses} onChange={(e) => setTeams((prev) => prev.map((t, i) => (i === idx ? { ...t, losses: Number(e.target.value) } : t)))} className="h-9 rounded bg-white/5 border border-white/10 text-white px-2 text-xs font-mono w-full" />
              <button
                onClick={() => removeTeam(idx)}
                className="h-9 px-2 rounded bg-rose-600/20 border border-rose-500/30 text-rose-300 text-xs font-mono"
                type="button"
              >
                DEL
              </button>
            </div>
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
