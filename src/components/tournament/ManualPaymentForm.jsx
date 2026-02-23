import { useState } from "react";
import { toast } from "sonner";

const ManualPaymentForm = ({
  tournament,
  defaultName = "",
  defaultPhone = "",
  defaultAmount = 0,
  expanded = false,
  onSuccess,
}) => {
  const [open, setOpen] = useState(expanded);
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : "");
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);

  const submit = () => {
    if (!name.trim() || !phone.trim() || !amount.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      return;
    }
    if (Number(amount) <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    onSuccess?.({
      name: name.trim(),
      phone: phone.trim(),
      amount: Number(amount),
      note: note.trim(),
    });
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="font-bold text-amber-300">💵 MANUAL PAYMENT</span>
        <span className="text-white/60">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-white/70">Send payment directly to the tournament organiser:</p>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm space-y-1">
            <p>👤 {tournament.payment_recipient_name}</p>
            <p>📱 {tournament.payment_recipient_number}</p>
            <p>💰 {Number(tournament.entry_fee_amount || 0).toLocaleString()} {tournament.entry_fee_currency || "RWF"}</p>
            <p>🏦 MTN MoMo Rwanda</p>
          </div>

          <p className="text-xs text-white/50 uppercase tracking-widest">After sending, fill in your details below</p>

          <div className={shake && !name ? "animate-field-shake" : ""}>
            <label className="text-xs text-white/50">Your Full Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full h-11 rounded-lg bg-black/20 border border-white/15 px-3 text-white" />
          </div>
          <div className={shake && !phone ? "animate-field-shake" : ""}>
            <label className="text-xs text-white/50">Your Phone Number *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full h-11 rounded-lg bg-black/20 border border-white/15 px-3 text-white" />
          </div>
          <div className={shake && !amount ? "animate-field-shake" : ""}>
            <label className="text-xs text-white/50">Amount You Sent *</label>
            <div className="mt-1 flex items-center gap-2">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full h-11 rounded-lg bg-black/20 border border-white/15 px-3 text-white" />
              <span className="text-white/60 text-sm">{tournament.entry_fee_currency || "RWF"}</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50">Additional Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full min-h-20 rounded-lg bg-black/20 border border-white/15 px-3 py-2 text-white" />
          </div>

          <button
            onClick={submit}
            className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            I HAVE SENT THE MONEY - CONFIRM
          </button>
          <p className="text-xs text-amber-200/70">Do not click confirm unless you have already sent the money.</p>
        </div>
      )}
    </div>
  );
};

export default ManualPaymentForm;

