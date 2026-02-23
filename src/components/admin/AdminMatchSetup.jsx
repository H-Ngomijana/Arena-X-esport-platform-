import { useMemo, useState } from "react";
import { createMatch, getJoinRequests, getMatches, getTournaments, saveTournaments, updateMatch } from "@/lib/storage";
import { toast } from "sonner";

const AdminMatchSetup = ({ tournamentId, onDone }) => {
  const [roundLabel, setRoundLabel] = useState("Quarterfinal A");
  const [roundNumber, setRoundNumber] = useState(1);
  const [participantA, setParticipantA] = useState("");
  const [participantB, setParticipantB] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [existingMatchId, setExistingMatchId] = useState("");

  const approved = useMemo(
    () =>
      getJoinRequests().filter(
        (item) => item.tournament_id === tournamentId && item.approval_status === "approved"
      ),
    [tournamentId]
  );

  const tournamentMatches = useMemo(
    () => getMatches().filter((item) => item.tournament_id === tournamentId),
    [tournamentId]
  );

  const resolveParticipant = (joinRequestId) => {
    const req = approved.find((item) => item.id === joinRequestId);
    if (!req) return null;
    return {
      profile_id: req.profile_type === "team" ? req.team_id : req.solo_profile_id,
      profile_type: req.profile_type,
      name: req.profile_type === "team" ? req.team_name || req.user_name : req.user_name,
      email: req.user_email,
      ready_status: false,
      ready_at: "",
    };
  };

  const setup = () => {
    if (!participantA || !participantB || participantA === participantB) {
      toast.error("Select two different participants");
      return;
    }
    const a = resolveParticipant(participantA);
    const b = resolveParticipant(participantB);
    if (!a || !b) return;

    const payload = {
      tournament_id: tournamentId,
      status: "scheduled",
      round: Number(roundNumber),
      round_label: roundLabel,
      scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : "",
      participants: [a, b],
      evidence_submissions: [],
      is_current_match: false,
    };

    let savedMatchId = existingMatchId;
    if (existingMatchId) {
      updateMatch(existingMatchId, payload);
      toast.success("Match updated");
    } else {
      const created = createMatch(payload);
      savedMatchId = created.id;
      toast.success("Match created");
    }

    if (savedMatchId) {
      const tournaments = getTournaments();
      const nextTournaments = tournaments.map((item) => {
        if (item.id !== tournamentId) return item;
        const rounds = Array.isArray(item.rounds_data) ? [...item.rounds_data] : [];
        const idx = rounds.findIndex((r) => Number(r.round_number) === Number(roundNumber));
        if (idx === -1) {
          rounds.push({
            round_number: Number(roundNumber),
            round_label: roundLabel,
            status: "pending",
            matches: [savedMatchId],
          });
        } else {
          rounds[idx] = {
            ...rounds[idx],
            round_label: rounds[idx].round_label || roundLabel,
            matches: Array.from(new Set([...(rounds[idx].matches || []), savedMatchId])),
          };
        }
        return { ...item, rounds_data: rounds };
      });
      saveTournaments(nextTournaments);
    }

    onDone?.();
  };

  const setAsCurrent = () => {
    if (!existingMatchId) {
      toast.error("Select an existing match first");
      return;
    }
    const allMatches = getMatches().map((item) =>
      item.tournament_id === tournamentId
        ? { ...item, is_current_match: item.id === existingMatchId }
        : item
    );
    const selected = allMatches.find((item) => item.id === existingMatchId);
    updateMatch(existingMatchId, { is_current_match: true });

    const tournaments = getTournaments();
    saveTournaments(
      tournaments.map((item) => {
        if (item.id !== tournamentId) return item;
        const rounds = (item.rounds_data || []).map((round) => ({
          ...round,
          status: round.matches?.includes(existingMatchId)
            ? "active"
            : round.status === "active"
            ? "completed"
            : round.status,
        }));
        return {
          ...item,
          current_match_id: existingMatchId,
          status: selected?.status === "live" ? "in_progress" : item.status,
          rounds_data: rounds,
        };
      })
    );
    toast.success("Current match set");
    onDone?.();
  };

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4 space-y-3">
      <p className="font-mono text-xs text-cyan-300 uppercase">Set Next Match</p>
      <select value={existingMatchId} onChange={(e) => setExistingMatchId(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono">
        <option value="">Create new match</option>
        {tournamentMatches.map((match) => (
          <option key={match.id} value={match.id}>
            {match.round_label || `Round ${match.round}`} ({match.status})
          </option>
        ))}
      </select>
      <input value={roundLabel} onChange={(e) => setRoundLabel(e.target.value)} placeholder="Match label" className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" />
      <input type="number" value={roundNumber} onChange={(e) => setRoundNumber(Number(e.target.value))} placeholder="Round number" className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" />
      <select value={participantA} onChange={(e) => setParticipantA(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono">
        <option value="">Participant A</option>
        {approved.map((item) => (
          <option key={item.id} value={item.id}>
            {item.profile_type.toUpperCase()} - {item.team_name || item.user_name}
          </option>
        ))}
      </select>
      <select value={participantB} onChange={(e) => setParticipantB(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono">
        <option value="">Participant B</option>
        {approved.map((item) => (
          <option key={item.id} value={item.id}>
            {item.profile_type.toUpperCase()} - {item.team_name || item.user_name}
          </option>
        ))}
      </select>
      <input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono" />
      <div className="grid grid-cols-2 gap-2">
        <button onClick={setup} className="h-10 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono">
          CONFIRM MATCH SETUP
        </button>
        <button onClick={setAsCurrent} className="h-10 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono">
          SET AS CURRENT
        </button>
      </div>
    </div>
  );
};

export default AdminMatchSetup;
