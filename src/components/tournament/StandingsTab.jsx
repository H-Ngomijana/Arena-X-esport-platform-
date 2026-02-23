const StandingsTab = ({ players = [], teams = [] }) => {
  return (
    <div className="space-y-5">
      <h3 className="font-mono text-sm uppercase tracking-widest text-white/60">Tournament Standings</h3>
      <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Players</p>
        <div className="space-y-2">
          {players.map((entry) => (
            <div key={`${entry.rank}_${entry.email || entry.name}`} className="grid grid-cols-5 text-sm text-white/90">
              <span>#{entry.rank}</span>
              <span className="col-span-2">{entry.name}</span>
              <span>{entry.mmr}</span>
              <span>{entry.badge || "ADVANCING"}</span>
            </div>
          ))}
          {players.length === 0 && <div className="text-white/50 text-sm">No player standings set.</div>}
        </div>
      </div>
      <div className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Teams</p>
        <div className="space-y-2">
          {teams.map((entry) => (
            <div key={`${entry.rank}_${entry.name}`} className="grid grid-cols-5 text-sm text-white/90">
              <span>#{entry.rank}</span>
              <span className="col-span-2">{entry.name}</span>
              <span>W:{entry.wins} L:{entry.losses}</span>
              <span>{entry.points ? `${entry.points} pts` : ""}</span>
            </div>
          ))}
          {teams.length === 0 && <div className="text-white/50 text-sm">No team standings set.</div>}
        </div>
      </div>
    </div>
  );
};

export default StandingsTab;

