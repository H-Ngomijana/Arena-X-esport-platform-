const StandingsTab = ({ players = [], teams = [] }) => {
  return (
    <div className="space-y-5">
      <h3 className="font-mono text-sm uppercase tracking-widest text-white/60">Tournament Standings</h3>
      <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Players</p>
        <div className="space-y-2">
          {players.map((entry) => (
            <div key={`${entry.rank}_${entry.email || entry.name}`} className="grid grid-cols-6 text-sm text-white/90 items-center">
              <span>#{entry.rank}</span>
              <span className="inline-flex items-center gap-2 col-span-2">
                {entry.avatar_url ? (
                  <img src={entry.avatar_url} alt={entry.name} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px]">
                    {(entry.name || "U")[0]}
                  </span>
                )}
                {entry.name}
              </span>
              <span>{entry.mmr}</span>
              <span className="col-span-2">{entry.badge || "ADVANCING"}</span>
            </div>
          ))}
          {players.length === 0 && <div className="text-white/50 text-sm">No player standings set.</div>}
        </div>
      </div>
      <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Teams</p>
        <div className="space-y-2">
          {teams.map((entry) => (
            <div key={`${entry.rank}_${entry.name}`} className="grid grid-cols-6 text-sm text-white/90 items-center">
              <span>#{entry.rank}</span>
              <span className="inline-flex items-center gap-2 col-span-2">
                {entry.logo_url ? (
                  <img src={entry.logo_url} alt={entry.name} className="w-6 h-6 rounded object-cover border border-white/20" />
                ) : (
                  <span className="w-6 h-6 rounded bg-white/10 inline-flex items-center justify-center text-[10px]">
                    {(entry.name || "T")[0]}
                  </span>
                )}
                {entry.name}
              </span>
              <span>W:{entry.wins} L:{entry.losses}</span>
              <span className="col-span-2">{entry.points ? `${entry.points} pts` : ""}</span>
            </div>
          ))}
          {teams.length === 0 && <div className="text-white/50 text-sm">No team standings set.</div>}
        </div>
      </div>
    </div>
  );
};

export default StandingsTab;
