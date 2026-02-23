import { Loader2 } from "lucide-react";

const MtnPopup = ({
  open,
  amount,
  currency,
  receiverName,
  receiverNumber,
  senderName,
  senderNumber,
  reference,
  loading,
  onCancel,
  onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#FFCC00] p-6 shadow-2xl text-black">
        <div className="w-10 h-10 rounded-full bg-black text-[#FFCC00] flex items-center justify-center font-black text-sm mb-4">
          MTN
        </div>
        <p className="font-bold text-lg">MoMo Pay Confirmation</p>
        <div className="mt-4 space-y-3 text-sm">
          <p>You are about to send</p>
          <p className="text-3xl font-black">
            {amount.toLocaleString()} {currency}
          </p>

          <div className="rounded-xl border border-black/20 bg-black/5 p-3 space-y-1">
            <p className="font-semibold">Receiver</p>
            <p>To: {receiverName}</p>
            <p>Number: {receiverNumber}</p>
            <p>Platform: MTN MoMo</p>
          </div>

          <div className="rounded-xl border border-black/20 bg-black/5 p-3 space-y-1">
            <p className="font-semibold">Sender</p>
            <p>From: {senderName}</p>
            <p>Your Number: {senderNumber}</p>
            <p className="font-bold">Reference: #{reference}</p>
          </div>

          <p className="pt-1 text-xs">You will be charged this amount from your MTN wallet.</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-lg bg-black text-white font-semibold disabled:opacity-60"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-11 rounded-lg bg-[#00A651] hover:bg-[#009548] text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Sending..." : "CONFIRM"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MtnPopup;
