import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addUserNotification, getJoinRequests, getTournaments, updateJoinRequest, saveTournaments } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AdminManualPaymentAlert from "@/components/admin/AdminManualPaymentAlert";

const filters = [
  { label: "Awaiting Approval", value: "awaiting_approval" },
  { label: "Manual Pending", value: "manual_pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

interface AdminJoinRequestsProps {
  logAction: (action: string) => void;
  onAwaitingCountChange?: (count: number) => void;
}

const relativeTime = (iso: string) => {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hours ago`;
};

const AdminJoinRequests = ({ logAction, onAwaitingCountChange }: AdminJoinRequestsProps) => {
  const [active, setActive] = useState("awaiting_approval");
  const [requests, setRequests] = useState(getJoinRequests());
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getJoinRequests();
      setRequests(next);
      onAwaitingCountChange?.(next.filter((item) => item.approval_status === "awaiting_approval").length);
    }, 2000);
    return () => clearInterval(timer);
  }, [onAwaitingCountChange]);

  const filtered = useMemo(() => {
    if (active === "all") return requests;
    if (active === "manual_pending") {
      return requests.filter(
        (item) =>
          item.approval_status === "awaiting_approval" &&
          (item.payment_status === "manual_pending" || item.payment_method === "manual")
      );
    }
    return requests.filter((item) => item.approval_status === active);
  }, [active, requests]);

  const manualPendingCount = useMemo(
    () =>
      requests.filter(
        (item) =>
          item.approval_status === "awaiting_approval" &&
          (item.payment_status === "manual_pending" || item.payment_method === "manual")
      ).length,
    [requests]
  );

  const approve = (request: any) => {
    const manual = request.payment_status === "manual_pending" || request.payment_method === "manual";
    updateJoinRequest(request.id, {
      approval_status: "approved",
      payment_status: manual ? "paid" : request.payment_status,
      approved_by: "admin@arenax.gg",
      approved_at: new Date().toISOString(),
    });

    const tournaments = getTournaments();
    const nextTournaments = tournaments.map((item: any) => {
      if (item.id !== request.tournament_id) return item;
      if (request.profile_type === "team" && request.team_id) {
        const existing = Array.isArray(item.registered_teams) ? item.registered_teams : [];
        const updatedTeams = Array.from(new Set([...existing, request.team_id]));
        return { ...item, registered_teams: updatedTeams, registered_count: updatedTeams.length };
      }
      const solos = Array.isArray(item.registered_solos) ? item.registered_solos : [];
      const updatedSolos = Array.from(new Set([...solos, request.solo_profile_id]));
      return { ...item, registered_solos: updatedSolos };
    });
    saveTournaments(nextTournaments);

    addUserNotification({
      user_email: request.user_email,
      type: "tournament_update",
      title: manual ? "Payment Verified - You're In!" : "You're In!",
      message: manual
        ? `Admin confirmed your payment for ${request.tournament_name}. Welcome to the tournament!`
        : `Your request to join ${request.tournament_name} has been approved!`,
      link: `/TournamentLive?id=${request.tournament_id}`,
    });

    logAction(`Approved join request #${request.payment_reference}`);
    toast.success("Join request approved");
    setRequests(getJoinRequests());
  };

  const reject = () => {
    if (!rejecting) return;
    const manual = rejecting.payment_status === "manual_pending" || rejecting.payment_method === "manual";
    updateJoinRequest(rejecting.id, {
      approval_status: "rejected",
      payment_status: manual ? "failed" : rejecting.payment_status,
      rejection_reason: reason || "Rejected by admin",
    });
    addUserNotification({
      user_email: rejecting.user_email,
      type: "tournament_update",
      title: manual ? "Payment Not Confirmed" : "Join Request Update",
      message: manual
        ? `We could not verify your payment for ${rejecting.tournament_name}. Reason: ${reason || "Not received"}.`
        : `Your request to join ${rejecting.tournament_name} was rejected.`,
      link: `/Tournament?id=${rejecting.tournament_id}`,
    });
    logAction(`Rejected join request #${rejecting.payment_reference}`);
    toast.success("Join request rejected");
    setRejecting(null);
    setReason("");
    setRequests(getJoinRequests());
  };

  return (
    <div className="space-y-4">
      <AdminManualPaymentAlert count={manualPendingCount} />
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setActive(item.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border ${
              active === item.value
                ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                : "bg-white/5 border-white/10 text-white/60"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((request: any) => (
          <div
            key={request.id}
            className={`rounded-xl border p-4 space-y-3 ${
              request.payment_status === "manual_pending" || request.payment_method === "manual"
                ? "border-amber-500/30 bg-amber-500/10"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(request.payment_status === "manual_pending" || request.payment_method === "manual") && (
                  <span className="font-mono text-[10px] px-2 py-1 rounded-full bg-amber-500/25 text-amber-200">
                    MANUAL PAYMENT
                  </span>
                )}
                <span className="font-mono text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
                  {request.approval_status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-white/40">Submitted: {relativeTime(request.created_at)}</span>
            </div>
            <div className="text-sm space-y-1 text-white/80">
              <p>Tournament: {request.tournament_name}</p>
              <p>
                User: {request.user_email} | Profile: {request.profile_type.toUpperCase()}
                {request.team_name ? ` / ${request.team_name}` : ""}
              </p>
              <p>
                Paid: {Number(request.amount_paid).toLocaleString()} RWF | Ref: #{request.payment_reference}
              </p>
              <p>
                Sender: {request.sender_name} | Number: {request.sender_number}
              </p>
              {request.manual_note && <p>Note: {request.manual_note}</p>}
              {(request.payment_status === "manual_pending" || request.payment_method === "manual") && (
                <p className="text-amber-200/80 text-xs">
                  Verify on MTN MoMo receiver account ({request.payment_recipient_number || "0794417555"}) before approving.
                </p>
              )}
            </div>
            {request.approval_status === "awaiting_approval" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRejecting(request)}
                  className="h-10 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30"
                >
                  REJECT
                </button>
                <button
                  onClick={() => approve(request)}
                  className="h-10 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                >
                  APPROVE
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="text-sm text-white/50">No requests in this filter.</div>}
      </div>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent className="bg-[#0a0a0f] border-rose-500/20">
          <DialogHeader>
            <DialogTitle className="font-mono text-white">Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-24"
              placeholder="Provide rejection reason"
            />
            <button onClick={reject} className="w-full h-10 rounded-lg bg-rose-600 text-white font-mono text-xs">
              CONFIRM REJECTION
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJoinRequests;
