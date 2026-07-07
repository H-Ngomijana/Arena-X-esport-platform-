export function BracketView() {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-cyan-300">Knockout Stage</p>
      <h3 className="mt-2 font-display text-2xl font-bold">Bracket View Ready</h3>
      <p className="mt-1 text-sm text-white/55">
        Bracket fixtures already carry feed pointers, so winners can auto-advance as knockout seasons are generated.
      </p>
    </div>
  );
}
