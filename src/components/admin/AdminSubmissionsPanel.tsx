import { useState } from "react";
import { Check, X, MessageSquare } from "lucide-react";
import { useSubmissions } from "@/context/SubmissionsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const AdminSubmissionsPanel = ({ logAction }: { logAction: (a: string) => void }) => {
  const { getPendingSubmissions, updateSubmissionStatus } = useSubmissions();
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [pointsToGrant, setPointsToGrant] = useState<string>("50");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [newRank, setNewRank] = useState<string>("");

  const pendingSubmissions = getPendingSubmissions();
  const submission = pendingSubmissions.find((s) => s.id === selectedSubmission);

  const handleApprove = () => {
    if (!selectedSubmission) return;

    const points = parseInt(pointsToGrant) || 0;
    const rank = newRank ? parseInt(newRank) : undefined;
    
    updateSubmissionStatus(
      selectedSubmission,
      "approved",
      points,
      rank,
      adminNotes || undefined
    );

    logAction(
      `Approved submission from ${submission?.player_name} for ${submission?.game_name}`
    );
    toast.success("Submission approved");
    
    setSelectedSubmission(null);
    setPointsToGrant("50");
    setAdminNotes("");
    setNewRank("");
  };

  const handleReject = () => {
    if (!selectedSubmission) return;

    updateSubmissionStatus(selectedSubmission, "rejected", 0, undefined, adminNotes || undefined);

    logAction(
      `Rejected submission from ${submission?.player_name} for ${submission?.game_name}`
    );
    toast.success("Submission rejected");
    
    setSelectedSubmission(null);
    setPointsToGrant("50");
    setAdminNotes("");
    setNewRank("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg text-white/80">Solo Submissions Review</h2>
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono">
          {pendingSubmissions.length} Pending
        </span>
      </div>

      {pendingSubmissions.length === 0 ? (
        <div className="p-8 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <MessageSquare className="mx-auto text-muted-foreground mb-3" size={24} />
          <p className="text-muted-foreground">No pending submissions to review</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {sub.player_name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sub.player_name}</p>
                      <p className="text-xs text-muted-foreground">{sub.game_name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic mb-3">"{sub.comment}"</p>
                  {sub.screenshot_url && (
                    <img
                      src={sub.screenshot_url}
                      alt="Submission screenshot"
                      className="w-24 h-20 rounded border border-white/10 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedSubmission(sub.id)}
                    />
                  )}
                </div>
                <button
                  onClick={() => setSelectedSubmission(sub.id)}
                  className="px-3 py-1 rounded text-xs font-mono bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20 max-w-2xl font-mono">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Review Submission</DialogTitle>
          </DialogHeader>

          {submission && (
            <div className="space-y-6">
              {/* Screenshot */}
              {submission.screenshot_url && (
                <div>
                  <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                    Game Screenshot
                  </label>
                  <img
                    src={submission.screenshot_url}
                    alt="Submission screenshot"
                    className="w-full max-h-80 rounded-lg border border-white/10 object-cover"
                  />
                </div>
              )}

              {/* Submission Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[10px] text-white/40 uppercase">Player</label>
                  <div className="font-mono text-sm text-white mt-1">{submission.player_name}</div>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-white/40 uppercase">Game</label>
                  <div className="font-mono text-sm text-white mt-1">{submission.game_name}</div>
                </div>
              </div>

              {/* Comment */}
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                  Player Comment
                </label>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/80">
                  {submission.comment}
                </div>
              </div>

              {/* Approval Form */}
              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                  Points to Grant
                </label>
                <Input
                  type="number"
                  value={pointsToGrant}
                  onChange={(e) => setPointsToGrant(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder="50"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                  New Rank (Rating)
                </label>
                <Input
                  type="number"
                  value={newRank}
                  onChange={(e) => setNewRank(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-mono"
                  placeholder="1850"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-white/40 uppercase mb-2 block">
                  Admin Notes
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm"
                  placeholder="Your review notes..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  <Check size={14} /> APPROVE
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs rounded-lg transition-colors"
                >
                  <X size={14} /> REJECT
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubmissionsPanel;
