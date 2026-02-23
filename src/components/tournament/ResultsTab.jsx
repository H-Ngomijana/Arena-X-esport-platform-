const ResultsTab = ({ results = [], onOpenImage }) => {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm uppercase tracking-widest text-white/60">Match Results History</h3>
      {results.length === 0 && <div className="text-white/50 text-sm">No results declared yet.</div>}
      {results.map((row, idx) => (
        <div key={`${row.declared_at}_${idx}`} className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Round {row.round} — {row.match_label}</span>
            <span>{new Date(row.declared_at).toLocaleString()}</span>
          </div>
          <div className="text-sm text-white">
            <span className="text-emerald-300 font-bold">WINNER:</span> {row.winner_name}
          </div>
          <div className="text-sm text-white/80">LOSER: {row.loser_name}</div>
          <div className="text-sm text-white/80">Score: {row.score}</div>
          {Array.isArray(row.screenshot_urls) && row.screenshot_urls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {row.screenshot_urls.map((src, i) => (
                <img
                  key={`${src}_${i}`}
                  src={src}
                  alt="Evidence"
                  onClick={() => onOpenImage?.(row.screenshot_urls, i)}
                  className="w-24 h-16 rounded object-cover cursor-pointer border border-white/20"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ResultsTab;

