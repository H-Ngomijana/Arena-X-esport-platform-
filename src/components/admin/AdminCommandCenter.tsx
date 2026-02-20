import { Gamepad2, Trophy, Activity, Users, Swords, AlertTriangle, CheckCircle } from "lucide-react";
import { games, tournaments, teams } from "@/lib/mock-data";
import { adminMatches, adminDisputes, matchStatusColors } from "@/lib/admin-mock-data";

const metrics = [
  { label: "Total Games", value: games.length, icon: Gamepad2, color: "indigo", pulse: false },
  { label: "Tournaments", value: tournaments.length, icon: Trophy, color: "amber", pulse: false },
  { label: "Active Tournaments", value: tournaments.filter(t => t.status === "in_progress" || t.status === "registration_open").length, icon: Activity, color: "emerald", pulse: true },
  { label: "Total Teams", value: teams.length, icon: Users, color: "purple", pulse: false },
  { label: "Live Matches", value: adminMatches.filter(m => m.status === "live").length, icon: Swords, color: "cyan", pulse: true },
  { label: "Open Disputes", value: adminDisputes.filter(d => d.status === "open").length, icon: AlertTriangle, color: "rose", pulse: false },
];

const colorMap: Record<string, { border: string; bg: string; text: string; icon: string }> = {
  indigo: { border: "border-indigo-500/30", bg: "bg-indigo-500/5", text: "text-indigo-400", icon: "text-indigo-400" },
  amber: { border: "border-amber-500/30", bg: "bg-amber-500/5", text: "text-amber-400", icon: "text-amber-400" },
  emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-400", icon: "text-emerald-400" },
  purple: { border: "border-purple-500/30", bg: "bg-purple-500/5", text: "text-purple-400", icon: "text-purple-400" },
  cyan: { border: "border-cyan-500/30", bg: "bg-cyan-500/5", text: "text-cyan-400", icon: "text-cyan-400" },
  rose: { border: "border-rose-500/30", bg: "bg-rose-500/5", text: "text-rose-400", icon: "text-rose-400" },
};

const AdminCommandCenter = () => {
  const recentMatches = adminMatches.slice(0, 8);
  const statusBreakdown = tournaments.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="font-mono text-sm text-emerald-300">
            ✓ ALL SYSTEMS OPERATIONAL — ArenaX Control Room v1.0
          </span>
        </div>
        <span className="font-mono text-xs text-emerald-400/60 hidden sm:block">
          {new Date().toLocaleString()}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((m) => {
          const c = colorMap[m.color];
          return (
            <div key={m.label} className={`rounded-xl border ${c.border} ${c.bg} p-4`}>
              <div className="flex items-center justify-between mb-3">
                <m.icon size={16} className={c.icon} />
                {m.pulse && <span className={`w-2 h-2 rounded-full ${c.icon.replace("text-", "bg-")} animate-pulse`} />}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-white/40 mb-1">{m.label}</div>
              <div className={`font-mono text-2xl font-bold ${c.text}`}>{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Two-panel grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Matches */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Swords size={16} className="text-white/50" />
            <span className="font-mono text-sm text-white/70">Recent Match Activity</span>
            <span className="font-mono text-xs text-white/30 ml-auto">{recentMatches.length}</span>
          </div>
          <div className="space-y-2">
            {recentMatches.map((m) => {
              const sc = matchStatusColors[m.status] || matchStatusColors.scheduled;
              return (
                <div key={m.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded text-white/40">
                    R{m.round}
                  </span>
                  <span className="font-mono text-xs text-white/70 flex-1 truncate">
                    {m.team_a.name} vs {m.team_b.name}
                  </span>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} flex items-center gap-1`}>
                    {sc.dot && <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />}
                    {m.status.replace("_", " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tournament Status Overview */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={16} className="text-white/50" />
            <span className="font-mono text-sm text-white/70">Tournament Status Overview</span>
          </div>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const total = tournaments.length;
              const pct = (count / total) * 100;
              const dotColor = status === "in_progress" ? "bg-cyan-400" : status === "registration_open" ? "bg-emerald-400" : status === "completed" ? "bg-purple-400" : status === "draft" ? "bg-slate-400" : "bg-amber-400";
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="font-mono text-xs text-white/60 capitalize">{status.replace("_", " ")}</span>
                    </div>
                    <span className="font-mono text-xs text-white/40">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${dotColor}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <span className="font-mono text-[10px] text-white/30">
              Open Registrations: {tournaments.filter(t => t.status === "registration_open").length}
            </span>
            <span className="font-mono text-[10px] text-white/30">
              Ranked Players: {10}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandCenter;
