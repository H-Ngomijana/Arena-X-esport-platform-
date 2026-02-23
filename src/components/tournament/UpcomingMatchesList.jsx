const formatTime = (dateLike) => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const UpcomingMatchesList = ({ matches = [], teamsById = {} }) => {
  const resolveA = (match) =>
    match.participant_a ||
    match.participants?.[0]?.name ||
    teamsById[match.team_a_id]?.name ||
    "Team A";

  const resolveB = (match) =>
    match.participant_b ||
    match.participants?.[1]?.name ||
    teamsById[match.team_b_id]?.name ||
    "Team B";

  return (
    <div className="font-mono rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4">
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Next Matches</h3>
      <div className="space-y-2">
        {matches.length > 0 ? (
          matches.map((match) => (
            <div key={match.id} className="flex items-center justify-between text-sm rounded-lg bg-white/5 px-3 py-2">
              <span className="text-white/70">Time {formatTime(match.scheduled_time || match.scheduled_at)}</span>
              <span>
                {resolveA(match)} vs {resolveB(match)}
              </span>
              <span className="text-white/60">{match.court || "Court 1"}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/60">No upcoming matches.</p>
        )}
      </div>
    </div>
  );
};

export default UpcomingMatchesList;
