const EvidenceTab = ({ matches = [], onOpenImage }) => {
  const submissions = matches.flatMap((match) =>
    (match.evidence_submissions || []).map((submission) => ({
      ...submission,
      match_id: match.id,
      match_label: match.round_label || `Match ${match.id}`,
      round: match.round || 1,
    }))
  );

  return (
    <div className="space-y-4">
      <h3 className="font-mono text-sm uppercase tracking-widest text-white/60">Match Evidence - Public</h3>
      {submissions.length === 0 && <div className="text-white/50 text-sm">No evidence submissions yet.</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        {submissions.map((entry, idx) => (
          <div key={`${entry.submitted_at}_${idx}`} className="rounded-2xl bg-[#0a0a12] border border-white/10 p-4">
            <div className="text-sm text-white">
              Submitted by: <span className="font-bold">{entry.submitted_by_name}</span>
            </div>
            <div className="text-xs text-white/50 mt-1">
              {entry.match_label} · Round {entry.round} · Score claimed: {entry.score_claimed}
            </div>
            {entry.notes && <div className="text-sm text-white/75 mt-2">{entry.notes}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {(entry.screenshot_urls || []).map((src, i) => (
                <img
                  key={`${src}_${i}`}
                  src={src}
                  alt="submission"
                  onClick={() => onOpenImage?.(entry.screenshot_urls, i)}
                  className="w-32 h-20 rounded-lg object-cover cursor-pointer hover:opacity-80 border border-white/20"
                />
              ))}
            </div>
            <div className="text-xs text-white/40 mt-3">Submitted: {new Date(entry.submitted_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceTab;

