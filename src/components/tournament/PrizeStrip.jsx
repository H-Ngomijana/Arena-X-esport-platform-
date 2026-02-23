const PrizeStrip = ({ prizes }) => {
  const first = prizes?.first || "500,000 RWF";
  const second = prizes?.second || "200,000 RWF";
  const third = prizes?.third || "100,000 RWF";

  return (
    <div className="font-mono grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 text-center">
        <p className="text-xl">🥇 1st</p>
        <p className="text-lg font-black mt-1">{first}</p>
      </div>
      <div className="rounded-xl border border-slate-400/40 bg-gradient-to-br from-slate-400/20 to-slate-500/10 p-4 text-center">
        <p className="text-xl">🥈 2nd</p>
        <p className="text-lg font-black mt-1">{second}</p>
      </div>
      <div className="rounded-xl border border-amber-700/40 bg-gradient-to-br from-amber-700/20 to-amber-800/10 p-4 text-center">
        <p className="text-xl">🥉 3rd</p>
        <p className="text-lg font-black mt-1">{third}</p>
      </div>
    </div>
  );
};

export default PrizeStrip;
