import { useMemo, useState } from "react";
import { addUserNotification, getMatches, getTournaments, saveTournaments, updateMatch } from "@/lib/storage";
import { toast } from "sonner";

const AdminDeclareResult = ({ tournamentId, adminEmail = "admin@arenax.gg", onDone }) => {
  const [matchId, setMatchId] = useState("");
  const [winnerId, setWinnerId] = useState("");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  const matchOptions = useMemo(
    () =>
      getMatches().filter(
        (item) => item.tournament_id === tournamentId && item.status === "awaiting_results"
      ),
    [tournamentId]
  );
  const match = matchOptions.find((item) => item.id === matchId);

  const declare = () => {
    if (!match || !winnerId) {
      toast.error("Select a match and winner");
      return;
    }

    const winner = (match.participants || []).find((p) => p.profile_id === winnerId);
    const loser = (match.participants || []).find((p) => p.profile_id !== winnerId);
    const allScreenshots = (match.evidence_submissions || []).flatMap((s) => s.screenshot_urls || []);

    updateMatch(match.id, {
      status: "completed",
      admin_result: {
        winner_name: winner?.name || "Winner",
        winner_id: winnerId,
        score_a: Number(scoreA),
        score_b: Number(scoreB),
        declared_at: new Date().toISOString(),
        declared_by: adminEmail,
      },
    });

    const tournaments = getTournaments();
    const nextTournaments = tournaments.map((item) => {
      if (item.id !== tournamentId) return item;
      const currentPlayers = Array.isArray(item.top_players_override) ? [...item.top_players_override] : [];
      const currentTeams = Array.isArray(item.top_teams_override) ? [...item.top_teams_override] : [];

      const winnerPlayerIdx = currentPlayers.findIndex((p) => p.email === winner?.email);
      if (winnerPlayerIdx >= 0) {
        currentPlayers[winnerPlayerIdx] = { ...currentPlayers[winnerPlayerIdx], mmr: (currentPlayers[winnerPlayerIdx].mmr || 0) + 25, badge: "ADVANCING" };
      } else if (winner?.email) {
        currentPlayers.push({ rank: currentPlayers.length + 1, name: winner.name, email: winner.email, mmr: 1200, badge: "ADVANCING" });
      }

      const winnerTeamIdx = currentTeams.findIndex((t) => t.name === winner?.name);
      if (winnerTeamIdx >= 0) {
        currentTeams[winnerTeamIdx] = { ...currentTeams[winnerTeamIdx], wins: (currentTeams[winnerTeamIdx].wins || 0) + 1 };
      } else if (winner?.profile_type === "team") {
        currentTeams.push({ rank: currentTeams.length + 1, name: winner.name, wins: 1, losses: 0 });
      }

      const loserTeamIdx = currentTeams.findIndex((t) => t.name === loser?.name);
      if (loserTeamIdx >= 0) {
        currentTeams[loserTeamIdx] = { ...currentTeams[loserTeamIdx], losses: (currentTeams[loserTeamIdx].losses || 0) + 1 };
      }

      const results_log = [
        ...(item.results_log || []),
        {
          round: match.round || 1,
          match_label: match.round_label || `Round ${match.round || 1}`,
          winner_name: winner?.name || "Winner",
          loser_name: loser?.name || "Loser",
          score: `${scoreA} - ${scoreB}`,
          screenshot_urls: allScreenshots,
          declared_at: new Date().toISOString(),
        },
      ];
      return { ...item, results_log, top_players_override: currentPlayers, top_teams_override: currentTeams };
    });
    saveTournaments(nextTournaments);

    if (winner?.email) {
      addUserNotification({
        user_email: winner.email,
        type: "tournament_update",
        title: "You Won!",
        message: `You won ${match.round_label}. Score: ${scoreA}-${scoreB}.`,
        link: `/TournamentLive?id=${tournamentId}`,
      });
    }
    if (loser?.email) {
      addUserNotification({
        user_email: loser.email,
        type: "tournament_update",
        title: "Match Result",
        message: `Match completed. Final score: ${scoreA}-${scoreB}.`,
        link: `/TournamentLive?id=${tournamentId}`,
      });
    }

    toast.success("Winner declared and round advanced");
    onDone?.();
  };

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-[#0a0a12] p-4 space-y-3">
      <p className="font-mono text-xs text-emerald-300 uppercase">Declare Winner</p>
      <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono">
        <option value="">Select awaiting-results match</option>
        {matchOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.round_label} ({item.status})
          </option>
        ))}
      </select>
      <select value={winnerId} onChange={(e) => setWinnerId(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" disabled={!match}>
        <option value="">Winner</option>
        {(match?.participants || []).map((p) => (
          <option key={p.profile_id} value={p.profile_id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" placeholder="Score A" />
        <input type="number" value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" placeholder="Score B" />
      </div>
      <button onClick={declare} className="h-10 w-full rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono">
        DECLARE & ADVANCE ROUND
      </button>
    </div>
  );
};

export default AdminDeclareResult;
