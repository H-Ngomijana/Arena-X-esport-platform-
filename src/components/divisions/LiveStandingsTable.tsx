import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { DivisionSummary, StandingRow } from "@/lib/divisions-api";
import SafeImage from "@/components/SafeImage";

interface LiveStandingsTableProps {
  division: DivisionSummary;
  rows: StandingRow[];
  leaderboard?: boolean;
}

function Delta({ value = 0 }: { value?: number }) {
  if (value > 0) return <span className="inline-flex items-center gap-1 text-emerald-300"><ArrowUp size={12} />{value}</span>;
  if (value < 0) return <span className="inline-flex items-center gap-1 text-rose-300"><ArrowDown size={12} />{Math.abs(value)}</span>;
  return <span className="inline-flex items-center gap-1 text-white/40"><Minus size={12} /></span>;
}

export function LiveStandingsTable({ division, rows, leaderboard = false }: LiveStandingsTableProps) {
  const promotionLine = division.promotionSlots;
  const relegationStart = rows.length - division.relegationSlots + 1;

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#090b12]/90">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.03]">
              {["Rank", "Player", "P", "W", "D", "L", "GF", "GA", "GD", "Pts", leaderboard ? "Trend" : "Form"].map((head) => (
                <th key={head} className="px-4 py-3 text-left text-[11px] font-mono uppercase tracking-widest text-white/45">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isPromotion = promotionLine > 0 && row.rank <= promotionLine;
              const isRelegation = division.relegationSlots > 0 && row.rank >= relegationStart;
              return (
                <tr
                  key={row.playerId}
                  className={cn(
                    "border-b border-white/[0.04]",
                    isPromotion && "bg-emerald-500/[0.06]",
                    isRelegation && "bg-rose-500/[0.06]"
                  )}
                >
                  <td className="px-4 py-3 font-display text-lg font-bold">#{row.rank}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-semibold">
                      {row.player?.avatarUrl ? (
                        <SafeImage src={row.player.avatarUrl} alt={row.player.username} className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-white/10 inline-flex items-center justify-center text-[10px]">
                          {(row.player?.username || row.playerId || "P")[0]}
                        </span>
                      )}
                      {row.player?.inGameName || row.player?.username || row.playerId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{row.played}</td>
                  <td className="px-4 py-3 font-mono text-emerald-300">{row.wins}</td>
                  <td className="px-4 py-3 font-mono text-amber-300">{row.draws}</td>
                  <td className="px-4 py-3 font-mono text-rose-300">{row.losses}</td>
                  <td className="px-4 py-3 font-mono">{row.goalsFor}</td>
                  <td className="px-4 py-3 font-mono">{row.goalsAgainst}</td>
                  <td className="px-4 py-3 font-mono">{row.goalDifference}</td>
                  <td className="px-4 py-3 font-mono font-bold text-cyan-200">{row.points}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {leaderboard ? <Delta value={row.rankDelta} /> : row.form?.join(" ") || "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-white/50">No standings yet for this division.</div>
      )}
    </div>
  );
}
