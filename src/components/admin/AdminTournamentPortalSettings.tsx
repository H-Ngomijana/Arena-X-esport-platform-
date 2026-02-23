import { useEffect, useMemo, useState } from "react";
import { getTournaments, saveTournaments } from "@/lib/storage";
import { toast } from "sonner";

type NextMatchDraft = {
  label: string;
  participant_a: string;
  participant_b: string;
  scheduled_time: string;
  court: string;
};

const defaultNextMatch: NextMatchDraft = {
  label: "",
  participant_a: "",
  participant_b: "",
  scheduled_time: "",
  court: "Court 1",
};

const defaultResult = {
  round: 1,
  match_label: "",
  winner_name: "",
  loser_name: "",
  score: "",
};

const defaultBracketDraft = {
  round_number: 1,
  round_label: "Round 1",
  match_label: "",
  participant_a: "",
  participant_b: "",
  status: "scheduled",
  winner_name: "",
};

const AdminTournamentPortalSettings = ({ tournamentId, onDone }: { tournamentId: string; onDone?: () => void }) => {
  const tournament = useMemo(() => getTournaments().find((item) => item.id === tournamentId), [tournamentId]);
  const [matchStartTime, setMatchStartTime] = useState("");
  const [countdownMinutes, setCountdownMinutes] = useState(20);
  const [nextMatchDraft, setNextMatchDraft] = useState<NextMatchDraft>(defaultNextMatch);
  const [resultDraft, setResultDraft] = useState(defaultResult);
  const [bracketDraft, setBracketDraft] = useState(defaultBracketDraft);

  useEffect(() => {
    if (!tournament) return;
    if (tournament.match_start_time) {
      const date = new Date(tournament.match_start_time);
      const isoLocal = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setMatchStartTime(isoLocal);
    } else {
      setMatchStartTime("");
    }
  }, [tournamentId, tournament?.match_start_time, tournament]);

  const updateTournament = (updater: (item: any) => any) => {
    const all = getTournaments();
    saveTournaments(all.map((item) => (item.id === tournamentId ? updater(item) : item)));
    onDone?.();
  };

  const saveCountdown = () => {
    if (!matchStartTime) {
      toast.error("Select match start time");
      return;
    }
    updateTournament((item) => ({ ...item, match_start_time: new Date(matchStartTime).toISOString() }));
    toast.success("Countdown time updated");
  };

  const saveCountdownFromNow = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      toast.error("Enter valid countdown minutes");
      return;
    }
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const isoLocal = new Date(target.getTime() - target.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setMatchStartTime(isoLocal);
    updateTournament((item) => ({ ...item, match_start_time: target.toISOString() }));
    toast.success(`Countdown set to ${minutes} minute(s) from now`);
  };

  const addNextMatch = () => {
    if (!nextMatchDraft.label || !nextMatchDraft.participant_a || !nextMatchDraft.participant_b || !nextMatchDraft.scheduled_time) {
      toast.error("Fill all next match fields");
      return;
    }
    const entry = {
      id: Date.now().toString(),
      label: nextMatchDraft.label.trim(),
      participant_a: nextMatchDraft.participant_a.trim(),
      participant_b: nextMatchDraft.participant_b.trim(),
      scheduled_time: new Date(nextMatchDraft.scheduled_time).toISOString(),
      court: nextMatchDraft.court.trim() || "Court 1",
    };
    updateTournament((item) => ({
      ...item,
      next_matches_override: [entry, ...(item.next_matches_override || [])],
    }));
    setNextMatchDraft(defaultNextMatch);
    toast.success("Next match added");
  };

  const removeNextMatch = (id: string) => {
    updateTournament((item) => ({
      ...item,
      next_matches_override: (item.next_matches_override || []).filter((match: any) => match.id !== id),
    }));
    toast.success("Next match removed");
  };

  const addResult = () => {
    if (!resultDraft.match_label || !resultDraft.winner_name || !resultDraft.loser_name || !resultDraft.score) {
      toast.error("Fill result fields");
      return;
    }
    const entry = {
      round: Number(resultDraft.round || 1),
      match_label: resultDraft.match_label.trim(),
      winner_name: resultDraft.winner_name.trim(),
      loser_name: resultDraft.loser_name.trim(),
      score: resultDraft.score.trim(),
      screenshot_urls: [],
      declared_at: new Date().toISOString(),
    };
    updateTournament((item) => ({
      ...item,
      results_log: [entry, ...(item.results_log || [])],
    }));
    setResultDraft(defaultResult);
    toast.success("Result published");
  };

  const addBracketEntry = () => {
    if (!bracketDraft.match_label || !bracketDraft.participant_a || !bracketDraft.participant_b) {
      toast.error("Fill bracket match label and participants");
      return;
    }
    const entry = {
      id: Date.now().toString(),
      round_number: Number(bracketDraft.round_number || 1),
      round_label: bracketDraft.round_label.trim() || `Round ${bracketDraft.round_number || 1}`,
      match_label: bracketDraft.match_label.trim(),
      participant_a: bracketDraft.participant_a.trim(),
      participant_b: bracketDraft.participant_b.trim(),
      status: bracketDraft.status || "scheduled",
      winner_name: bracketDraft.winner_name.trim(),
    };
    updateTournament((item) => ({
      ...item,
      public_bracket: [entry, ...(item.public_bracket || [])],
    }));
    setBracketDraft(defaultBracketDraft);
    toast.success("Bracket entry added");
  };

  const removeBracketEntry = (id: string) => {
    updateTournament((item) => ({
      ...item,
      public_bracket: (item.public_bracket || []).filter((entry: any) => entry.id !== id),
    }));
    toast.success("Bracket entry removed");
  };

  if (!tournament) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-[#0a0a12] p-4 space-y-4">
      <p className="font-mono text-xs text-emerald-300 uppercase">Tournament Portal Settings</p>

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Countdown / Match Start Time</p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 20, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => saveCountdownFromNow(mins)}
              className="h-9 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-mono"
              type="button"
            >
              {mins} MIN
            </button>
          ))}
          <button
            onClick={() => saveCountdownFromNow(countdownMinutes)}
            className="h-9 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono"
            type="button"
          >
            APPLY CUSTOM
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            min={1}
            value={countdownMinutes}
            onChange={(e) => setCountdownMinutes(Number(e.target.value || 0))}
            className="col-span-2 h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
            placeholder="Custom minutes"
          />
          <button
            onClick={() => saveCountdownFromNow(countdownMinutes)}
            className="col-span-2 h-10 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono"
            type="button"
          >
            SET COUNTDOWN FROM NOW
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="datetime-local"
            value={matchStartTime}
            onChange={(e) => setMatchStartTime(e.target.value)}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
          <button onClick={saveCountdown} className="h-10 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono">
            SAVE COUNTDOWN
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Suggest Next Matches</p>
        <input
          value={nextMatchDraft.label}
          onChange={(e) => setNextMatchDraft((prev) => ({ ...prev, label: e.target.value }))}
          placeholder="Match label (e.g. Semifinal A)"
          className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={nextMatchDraft.participant_a}
            onChange={(e) => setNextMatchDraft((prev) => ({ ...prev, participant_a: e.target.value }))}
            placeholder="Participant A"
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
          <input
            value={nextMatchDraft.participant_b}
            onChange={(e) => setNextMatchDraft((prev) => ({ ...prev, participant_b: e.target.value }))}
            placeholder="Participant B"
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="datetime-local"
            value={nextMatchDraft.scheduled_time}
            onChange={(e) => setNextMatchDraft((prev) => ({ ...prev, scheduled_time: e.target.value }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
          <input
            value={nextMatchDraft.court}
            onChange={(e) => setNextMatchDraft((prev) => ({ ...prev, court: e.target.value }))}
            placeholder="Court"
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
        </div>
        <button onClick={addNextMatch} className="h-10 w-full rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono">
          ADD NEXT MATCH
        </button>

        <div className="space-y-2 max-h-44 overflow-auto">
          {(tournament.next_matches_override || []).map((item: any) => (
            <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 p-2">
              <div className="min-w-0">
                <p className="text-xs text-white truncate">{item.label}: {item.participant_a} vs {item.participant_b}</p>
                <p className="text-[10px] text-white/50">{new Date(item.scheduled_time).toLocaleString()} - {item.court || "Court 1"}</p>
              </div>
              <button onClick={() => removeNextMatch(item.id)} className="h-8 px-2 rounded bg-rose-600/80 hover:bg-rose-600 text-[10px] text-white font-mono">
                REMOVE
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Suggest / Publish Results</p>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            value={resultDraft.round}
            onChange={(e) => setResultDraft((prev) => ({ ...prev, round: Number(e.target.value || 1) }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-2 text-sm font-mono"
          />
          <input
            value={resultDraft.match_label}
            onChange={(e) => setResultDraft((prev) => ({ ...prev, match_label: e.target.value }))}
            placeholder="Match label"
            className="col-span-3 h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={resultDraft.winner_name}
            onChange={(e) => setResultDraft((prev) => ({ ...prev, winner_name: e.target.value }))}
            placeholder="Winner"
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
          <input
            value={resultDraft.loser_name}
            onChange={(e) => setResultDraft((prev) => ({ ...prev, loser_name: e.target.value }))}
            placeholder="Loser"
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          />
        </div>
        <input
          value={resultDraft.score}
          onChange={(e) => setResultDraft((prev) => ({ ...prev, score: e.target.value }))}
          placeholder="Score (e.g. 3 - 1)"
          className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
        />
        <button onClick={addResult} className="h-10 w-full rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono">
          PUBLISH RESULT
        </button>
      </div>

      <div className="space-y-2 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Public Rounds & Bracket</p>
        <div className="grid grid-cols-4 gap-2">
          <input
            type="number"
            value={bracketDraft.round_number}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, round_number: Number(e.target.value || 1) }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-2 text-sm font-mono"
            placeholder="Round #"
          />
          <input
            value={bracketDraft.round_label}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, round_label: e.target.value }))}
            className="col-span-3 h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
            placeholder="Round Label"
          />
        </div>
        <input
          value={bracketDraft.match_label}
          onChange={(e) => setBracketDraft((prev) => ({ ...prev, match_label: e.target.value }))}
          className="w-full h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          placeholder="Match Label (e.g. Quarterfinal A)"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={bracketDraft.participant_a}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, participant_a: e.target.value }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
            placeholder="Participant A"
          />
          <input
            value={bracketDraft.participant_b}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, participant_b: e.target.value }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
            placeholder="Participant B"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={bracketDraft.status}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, status: e.target.value }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
          >
            <option value="scheduled">Scheduled</option>
            <option value="live">Live</option>
            <option value="completed">Completed</option>
          </select>
          <input
            value={bracketDraft.winner_name}
            onChange={(e) => setBracketDraft((prev) => ({ ...prev, winner_name: e.target.value }))}
            className="h-10 rounded bg-white/5 border border-white/10 text-white px-3 text-sm font-mono"
            placeholder="Winner (optional)"
          />
        </div>
        <button onClick={addBracketEntry} className="h-10 w-full rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono">
          ADD BRACKET ENTRY
        </button>
        <div className="space-y-2 max-h-44 overflow-auto">
          {(tournament.public_bracket || [])
            .slice()
            .sort((a: any, b: any) => Number(a.round_number || 1) - Number(b.round_number || 1))
            .map((item: any) => (
              <div key={item.id} className="flex items-center justify-between gap-2 rounded border border-white/10 bg-black/20 p-2">
                <div className="min-w-0">
                  <p className="text-xs text-white truncate">R{item.round_number} {item.round_label} - {item.match_label}</p>
                  <p className="text-[10px] text-white/50">
                    {item.participant_a} vs {item.participant_b} ({item.status}) {item.winner_name ? `| Winner: ${item.winner_name}` : ""}
                  </p>
                </div>
                <button onClick={() => removeBracketEntry(item.id)} className="h-8 px-2 rounded bg-rose-600/80 hover:bg-rose-600 text-[10px] text-white font-mono">
                  REMOVE
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTournamentPortalSettings;
