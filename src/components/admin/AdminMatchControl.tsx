import { useState } from "react";
import { Search, Zap, Eye } from "lucide-react";
import { adminMatches, matchStatusColors, matchStatusOptions } from "@/lib/admin-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AdminMatchControl = ({ logAction }: { logAction: (a: string) => void }) => {
  const [matches, setMatches] = useState(adminMatches);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [overrideMatch, setOverrideMatch] = useState<typeof adminMatches[0] | null>(null);
  const [forceWinner, setForceWinner] = useState("");

  const filtered = matches.filter(m => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (search && !`${m.team_a.name} ${m.team_b.name} ${m.tournament_name}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const changeStatus = (id: string, status: string) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status } : m));
    logAction(`Match ${id} status → ${status}`);
    toast.success(`Status → ${status}`);
  };

  const forceResult = () => {
    if (!overrideMatch || !forceWinner) return;
    setMatches(prev => prev.map(m => m.id === overrideMatch.id ? { ...m, status: "completed", winner_team_id: forceWinner, admin_override: true } : m));
    logAction(`Force result: Match ${overrideMatch.id} → winner ${forceWinner}`);
    toast.success("Result forced");
    setOverrideMatch(null);
    setForceWinner("");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Match Control</h2>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search matches..." className="bg-white/5 border-white/10 text-white font-mono pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-xs px-3">
          <option value="all">All Status</option>
          {matchStatusOptions.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((m) => {
          const sc = matchStatusColors[m.status] || matchStatusColors.scheduled;
          const winnerIsA = m.winner_team_id === m.team_a.team_id;
          const winnerIsB = m.winner_team_id === m.team_b.team_id;
          return (
            <div key={m.id} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="font-mono text-[10px] bg-white/5 px-2 py-1 rounded text-white/40 flex-shrink-0">R{m.round}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-white flex items-center gap-2">
                  <span className={winnerIsA ? "text-emerald-400" : ""}>{m.team_a.name}</span>
                  <span className="text-white/20">{m.team_a.score}</span>
                  <span className="text-white/20">vs</span>
                  <span className="text-white/20">{m.team_b.score}</span>
                  <span className={winnerIsB ? "text-emerald-400" : ""}>{m.team_b.name}</span>
                </div>
                <div className="font-mono text-[10px] text-white/30 mt-0.5">{m.tournament_name}</div>
              </div>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} flex items-center gap-1`}>
                {sc.dot && <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />}
                {m.status.replace("_", " ")}
              </span>
              <select value={m.status} onChange={e => changeStatus(m.id, e.target.value)} className="h-8 rounded bg-white/5 border border-white/10 text-white font-mono text-[10px] px-2">
                {matchStatusOptions.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
              <button onClick={() => { setOverrideMatch(m); setForceWinner(""); }} className="p-2 text-white/30 hover:text-white transition-colors"><Eye size={14} /></button>
            </div>
          );
        })}
      </div>

      <Dialog open={!!overrideMatch} onOpenChange={() => setOverrideMatch(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-lg font-mono">
          <DialogHeader><DialogTitle className="font-mono text-white">Match Override</DialogTitle></DialogHeader>
          {overrideMatch && (
            <div className="space-y-4">
              <div className="rounded-lg bg-white/5 p-3 font-mono text-xs text-white/60">
                <div>{overrideMatch.team_a.name} vs {overrideMatch.team_b.name}</div>
                <div className="text-white/30 mt-1">{overrideMatch.tournament_name} · Round {overrideMatch.round}</div>
              </div>

              {overrideMatch.screenshots.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {overrideMatch.screenshots.map((s, i) => (
                    <a key={i} href={s} target="_blank" rel="noreferrer">
                      <img src={s} className="w-24 h-16 object-cover rounded" alt="screenshot" />
                    </a>
                  ))}
                </div>
              )}

              <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-4 space-y-3">
                <span className="font-mono text-xs text-rose-400 uppercase">Force Result</span>
                <select value={forceWinner} onChange={e => setForceWinner(e.target.value)} className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3">
                  <option value="">Select winner</option>
                  <option value={overrideMatch.team_a.team_id}>{overrideMatch.team_a.name}</option>
                  <option value={overrideMatch.team_b.team_id}>{overrideMatch.team_b.name}</option>
                </select>
                <button onClick={forceResult} disabled={!forceWinner} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-mono text-xs rounded-lg transition-colors">
                  FORCE RESULT & COMPLETE MATCH
                </button>
              </div>

              <div>
                <span className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Change Status</span>
                <div className="grid grid-cols-4 gap-2">
                  {matchStatusOptions.map(s => (
                    <button key={s} onClick={() => { changeStatus(overrideMatch.id, s); setOverrideMatch(null); }} className="font-mono text-[9px] px-2 py-2 rounded border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-colors capitalize">
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMatchControl;
