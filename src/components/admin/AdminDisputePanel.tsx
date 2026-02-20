import { useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { adminDisputes, adminMatches, disputeStatusColors } from "@/lib/admin-mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const tabs = ["open", "under_review", "resolved", "dismissed", "all"] as const;

const AdminDisputePanel = ({ logAction }: { logAction: (a: string) => void }) => {
  const [disputes, setDisputes] = useState(adminDisputes);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [resolveDispute, setResolveDispute] = useState<typeof adminDisputes[0] | null>(null);
  const [resolution, setResolution] = useState("");
  const [winnerSelect, setWinnerSelect] = useState("");

  const filtered = activeTab === "all" ? disputes : disputes.filter(d => d.status === activeTab);
  const match = resolveDispute ? adminMatches.find(m => m.id === resolveDispute.match_id) : null;

  const handleResolve = (status: "resolved" | "dismissed") => {
    if (!resolveDispute || !resolution) return;
    setDisputes(prev => prev.map(d => d.id === resolveDispute.id ? { ...d, status, resolution, resolved_by: "admin@arenax.gg", resolved_at: new Date().toISOString() } : d));
    logAction(`Dispute ${resolveDispute.id} → ${status}`);
    toast.success(`Dispute ${status}`);
    setResolveDispute(null);
    setResolution("");
    setWinnerSelect("");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Dispute Panel</h2>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`font-mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize ${activeTab === t ? "bg-rose-500/20 border-rose-500/30 text-rose-300" : "border-white/10 text-white/40 hover:text-white/60"}`}>
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(d => {
          const sc = disputeStatusColors[d.status] || disputeStatusColors.open;
          return (
            <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
                <span className="font-mono text-xs text-white/40">...{d.match_id.slice(-6)}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{d.status.replace("_", " ")}</span>
                <span className="ml-auto font-mono text-[10px] text-white/20">#{d.id.slice(-8)}</span>
              </div>
              <p className="font-mono text-xs text-white/60 line-clamp-2">{d.reason}</p>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-white/30">{d.filed_by_email}</span>
                <div className="flex gap-2">
                  {d.status === "open" && (
                    <button onClick={() => { setDisputes(prev => prev.map(x => x.id === d.id ? { ...x, status: "under_review" as const } : x)); logAction(`Dispute ${d.id} → under review`); }} className="font-mono text-[10px] px-3 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors">UNDER REVIEW</button>
                  )}
                  <button onClick={() => { setResolveDispute(d); setResolution(""); setWinnerSelect(""); }} className="font-mono text-[10px] px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white transition-colors">OPEN</button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div className="font-mono text-xs text-white/30 text-center py-8">No disputes found</div>}
      </div>

      <Dialog open={!!resolveDispute} onOpenChange={() => setResolveDispute(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-lg font-mono">
          <DialogHeader><DialogTitle className="font-mono text-white">Resolve Dispute</DialogTitle></DialogHeader>
          {resolveDispute && (
            <div className="space-y-4">
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
                <span className="font-mono text-xs text-rose-300">{resolveDispute.reason}</span>
              </div>

              {resolveDispute.evidence_urls.length > 0 && (
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-white/40 uppercase">Evidence</span>
                  {resolveDispute.evidence_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono text-xs text-indigo-400 hover:text-indigo-300">
                      Evidence #{i + 1} <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              )}

              {match && (
                <div>
                  <span className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Declare Winner (optional)</span>
                  <select value={winnerSelect} onChange={e => setWinnerSelect(e.target.value)} className="w-full h-10 rounded-md bg-white/5 border border-white/10 text-white font-mono text-sm px-3">
                    <option value="">Skip</option>
                    <option value={match.team_a.team_id}>{match.team_a.name}</option>
                    <option value={match.team_b.team_id}>{match.team_b.name}</option>
                  </select>
                </div>
              )}

              <div>
                <span className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Resolution Notes *</span>
                <Textarea value={resolution} onChange={e => setResolution(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono" placeholder="Enter resolution..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleResolve("resolved")} disabled={!resolution} className="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono text-xs rounded-lg transition-colors">RESOLVE</button>
                <button onClick={() => handleResolve("dismissed")} disabled={!resolution} className="py-2.5 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-mono text-xs rounded-lg transition-colors">DISMISS</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputePanel;
