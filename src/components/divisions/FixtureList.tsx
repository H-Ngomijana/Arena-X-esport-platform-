import { Camera, Clock, ShieldAlert } from "lucide-react";
import { DivisionFixture } from "@/lib/divisions-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface FixtureListProps {
  fixtures: DivisionFixture[];
  onSubmitResult?: (fixture: DivisionFixture) => void;
}

const statusTone: Record<string, string> = {
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  PLAYED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  DISPUTED: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  FORFEIT: "border-slate-400/20 bg-slate-400/10 text-slate-200",
};

export function FixtureList({ fixtures, onSubmitResult }: FixtureListProps) {
  return (
    <div className="space-y-3">
      {fixtures.map((fixture) => (
        <div key={fixture.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/45">
                <span>Round {fixture.round}</span>
                <span>Match {fixture.position}</span>
                {fixture.scheduledAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(fixture.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="font-display text-xl font-bold">
                {fixture.home?.username || fixture.homeId || "TBD"}
                <span className="mx-3 text-white/30">vs</span>
                {fixture.away?.username || fixture.awayId || "TBD"}
              </div>
              {fixture.result && (
                <div className="mt-1 text-sm font-mono text-cyan-200">
                  Final: {fixture.result.homeScore} - {fixture.result.awayScore}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={statusTone[fixture.status] || statusTone.PENDING}>
                {fixture.status}
              </Badge>
              {fixture.status === "DISPUTED" && <ShieldAlert size={16} className="text-rose-300" />}
              {fixture.status === "PENDING" && (
                <Button size="sm" variant="secondary" onClick={() => onSubmitResult?.(fixture)}>
                  <Camera size={14} />
                  Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
      {fixtures.length === 0 && (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
          No fixtures generated for this division yet.
        </div>
      )}
    </div>
  );
}
