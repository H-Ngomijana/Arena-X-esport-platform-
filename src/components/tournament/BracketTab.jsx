const BracketTab = ({ matches = [], publicBracket = [] }) => {
  const source =
    publicBracket.length > 0
      ? publicBracket.map((item) => ({
          id: item.id,
          round: item.round_number || 1,
          round_label: item.round_label || `Round ${item.round_number || 1}`,
          status: item.status || "scheduled",
          participants: [{ name: item.participant_a }, { name: item.participant_b }],
          admin_result: item.winner_name ? { winner_name: item.winner_name } : null,
          custom_match_label: item.match_label,
        }))
      : matches;

  const grouped = source.reduce((acc, match) => {
    const key = match.round_label || `Round ${match.round || 1}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(match);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max">
        {Object.entries(grouped).map(([round, roundMatches]) => (
          <div key={round} className="w-72 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-widest text-white/40">{round}</h3>
            {roundMatches.map((match) => (
              <div
                key={match.id}
                className={`rounded-xl bg-[#0a0a12] p-3 border ${
                  match.status === "live"
                    ? "border-cyan-500/80 animate-pulse"
                    : match.status === "completed"
                    ? "border-white/10 opacity-70"
                    : "border-white/10"
                }`}
              >
                <div className="text-white font-bold text-sm">{match.custom_match_label || match.round_label || `Match ${match.id}`}</div>
                <div className="text-white/80 text-sm mt-1">
                  {(match.participants?.[0]?.name || "TBD")} vs {(match.participants?.[1]?.name || "TBD")}
                </div>
                {match.admin_result?.winner_name && (
                  <div className="mt-2 text-emerald-300 text-xs border border-emerald-500/50 bg-emerald-500/10 rounded px-2 py-1">
                    Winner: {match.admin_result.winner_name}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BracketTab;
