const LiveStandings = ({ topPlayers = [], topTeams = [] }) => {
  return (
    <div className="font-mono rounded-xl border border-cyan-500/20 bg-[#0a0a12] p-4 space-y-4">
      <div>
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Players</h3>
        <div className="space-y-2">
          {topPlayers.map((player, index) => (
            <div key={player.id || `${player.name}_${index}`} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.name} className="w-6 h-6 rounded-full object-cover border border-white/20" />
                ) : (
                  <span className="w-6 h-6 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px]">
                    {(player.name || "U")[0]}
                  </span>
                )}
                #{index + 1} {player.name}
              </span>
              <span className="text-white/60">{player.rating} MMR</span>
            </div>
          ))}
          {topPlayers.length === 0 && <p className="text-sm text-white/60">No data yet.</p>}
        </div>
      </div>
      <div>
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">Top Teams</h3>
        <div className="space-y-2">
          {topTeams.map((team, index) => (
            <div key={team.id || `${team.name}_${index}`} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2">
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-6 h-6 rounded object-cover border border-white/20" />
                ) : (
                  <span className="w-6 h-6 rounded bg-white/10 inline-flex items-center justify-center text-[10px]">
                    {(team.name || "T")[0]}
                  </span>
                )}
                #{index + 1} {team.name}
              </span>
              <span className="text-white/60">
                W:{team.wins ?? 0} L:{team.losses ?? 0}
              </span>
            </div>
          ))}
          {topTeams.length === 0 && <p className="text-sm text-white/60">No team standings yet.</p>}
        </div>
      </div>
    </div>
  );
};

export default LiveStandings;
