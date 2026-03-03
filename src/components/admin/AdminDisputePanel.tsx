import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getDisputeReports, updateDisputeReport } from "@/lib/storage";
import { useRealtimeRefresh } from "@/components/hooks/useRealtimeRefresh";

const tabs = ["open", "reviewing", "resolved", "dismissed", "all"] as const;

const statusStyles: Record<string, string> = {
  open: "bg-rose-500/20 text-rose-300",
  reviewing: "bg-amber-500/20 text-amber-300",
  resolved: "bg-emerald-500/20 text-emerald-300",
  dismissed: "bg-slate-500/20 text-slate-300",
};

const AdminDisputePanel = ({ logAction }: { logAction: (a: string) => void }) => {
  useRealtimeRefresh({ keys: ["dispute_reports"], intervalMs: 1000 });
  const [activeTab, setActiveTab] = useState<string>("all");
  const [resolveDisputeId, setResolveDisputeId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  const disputes = getDisputeReports().sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const filtered =
    activeTab === "all" ? disputes : disputes.filter((d) => d.status === activeTab);
  const resolveDispute = disputes.find((d) => d.id === resolveDisputeId) || null;

  const openCount = useMemo(
    () => disputes.filter((d) => d.status === "open" || d.status === "reviewing").length,
    [disputes]
  );

  const setStatus = (id: string, status: "reviewing" | "resolved" | "dismissed") => {
    updateDisputeReport(id, {
      status,
      admin_response: resolution.trim() || undefined,
      resolved_by: "admin@arenax.gg",
      resolved_at: new Date().toISOString(),
    });
    logAction(`Dispute ${id} -> ${status}`);
    toast.success(`Dispute marked as ${status}`);
    setResolveDisputeId(null);
    setResolution("");
  };

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg text-white/80">Dispute Panel</h2>
      <p className="font-mono text-xs text-white/50">Open reports: {openCount}</p>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-[10px] px-3 py-1.5 rounded-lg border transition-colors capitalize ${
              activeTab === tab
                ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                : "border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((d) => (
          <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <AlertTriangle size={14} className="text-rose-400 flex-shrink-0" />
              <span className="font-mono text-xs text-white/40">Match: {d.match_id || "-"}</span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${statusStyles[d.status] || statusStyles.open}`}>
                {d.status}
              </span>
              <span className="ml-auto font-mono text-[10px] text-white/20">#{d.id.slice(-8)}</span>
            </div>
            <p className="font-mono text-xs text-white/90">{d.reason}</p>
            <p className="font-mono text-xs text-white/60">{d.description}</p>
            {Array.isArray(d.evidence_urls) && d.evidence_urls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {d.evidence_urls.map((url, idx) => (
                  <a
                    key={`${url}_${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded overflow-hidden border border-white/10 bg-black/30 block"
                  >
                    <img src={url} alt={`Evidence ${idx + 1}`} className="w-full h-20 object-cover" />
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] text-cyan-300 font-mono">
                      Open <ExternalLink size={10} />
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No evidence attached.</p>
            )}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/30">{d.reported_by_email}</span>
              <button
                onClick={() => {
                  setResolveDisputeId(d.id);
                  setResolution(d.admin_response || "");
                }}
                className="font-mono text-[10px] px-3 py-1 rounded border border-white/10 text-white/60 hover:text-white"
              >
                REVIEW
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="font-mono text-xs text-white/30 text-center py-8">No disputes found</div>
        )}
      </div>

      <Dialog open={!!resolveDispute} onOpenChange={() => setResolveDisputeId(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-lg font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Resolve Dispute</DialogTitle>
          </DialogHeader>
          {resolveDispute && (
            <div className="space-y-4">
              <div className="rounded-lg bg-rose-500/5 border border-rose-500/20 p-3">
                <span className="font-mono text-xs text-rose-300">{resolveDispute.reason}</span>
                <p className="font-mono text-xs text-white/70 mt-1">{resolveDispute.description}</p>
              </div>
              <div>
                <span className="font-mono text-[10px] text-white/40 uppercase mb-2 block">Admin Response</span>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder="Enter resolution..."
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setStatus(resolveDispute.id, "reviewing")}
                  className="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  REVIEWING
                </button>
                <button
                  onClick={() => setStatus(resolveDispute.id, "resolved")}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  RESOLVE
                </button>
                <button
                  onClick={() => setStatus(resolveDispute.id, "dismissed")}
                  className="py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDisputePanel;
