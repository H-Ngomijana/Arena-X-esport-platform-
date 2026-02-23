import { updateMatch } from "@/lib/storage";

const formatDateTime = (dateLike) => {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "TBD";
  return d.toLocaleString();
};

const ReadyMatchCard = ({ match, currentUser, onRefresh }) => {
  if (!match) return null;

  const myParticipant = (match.participants || []).find((p) => p.email === currentUser.email);
  const opponent = (match.participants || []).find((p) => p.email !== currentUser.email);
  const allReady = (match.participants || []).length > 1 && (match.participants || []).every((p) => p.ready_status);

  const markReady = () => {
    const participants = (match.participants || []).map((p) =>
      p.email === currentUser.email ? { ...p, ready_status: true, ready_at: new Date().toISOString() } : p
    );
    updateMatch(match.id, { participants });
    onRefresh?.();
  };

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-[#0a0a12] p-6 font-mono space-y-3">
      <p className="text-xs uppercase tracking-widest text-white/40">Your Next Match</p>
      <div className="text-white font-bold">
        {match.round_label} · Round {match.round || 1}
      </div>
      <div className="text-white/90">YOU vs {opponent?.name || "Opponent"}</div>
      <div className="text-white/60 text-sm">Scheduled: {formatDateTime(match.scheduled_time || match.scheduled_at)}</div>
      <div className="text-sm text-white/50">Status: Waiting for players to confirm...</div>

      {!myParticipant?.ready_status ? (
        <button
          onClick={markReady}
          className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg"
        >
          I AM READY
        </button>
      ) : (
        <button
          disabled
          className="w-full h-14 rounded-xl bg-emerald-900 text-emerald-400 border border-emerald-500/30 font-bold"
        >
          READY - Waiting for opponent...
        </button>
      )}

      {allReady && (
        <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 p-3 text-amber-300 text-sm animate-pulse">
          ALL PLAYERS READY - MATCH STARTING SOON
        </div>
      )}
    </div>
  );
};

export default ReadyMatchCard;

