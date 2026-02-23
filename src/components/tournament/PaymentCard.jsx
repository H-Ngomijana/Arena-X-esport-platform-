import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PaymentCard = ({
  senderName,
  senderNumber,
  onSenderNameChange,
  onSenderNumberChange,
  tournament,
  shake,
}) => {
  const amount = Number(tournament?.entry_fee_amount ?? tournament?.entry_fee ?? 0);
  const currency = tournament?.entry_fee_currency || "RWF";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20">
          <p className="text-xs font-mono text-white/60 mb-3">SENDER DETAILS</p>
          <div className="space-y-3">
            <div className={shake && !senderName ? "animate-field-shake" : ""}>
              <Label className="mb-1 block">Your Name *</Label>
              <Input
                value={senderName}
                onChange={(e) => onSenderNameChange(e.target.value)}
                className="bg-slate-950 border-white/10"
                placeholder="John Doe"
              />
            </div>
            <div className={shake && !senderNumber ? "animate-field-shake" : ""}>
              <Label className="mb-1 block">MTN Number *</Label>
              <Input
                value={senderNumber}
                onChange={(e) => onSenderNumberChange(e.target.value)}
                className="bg-slate-950 border-white/10"
                placeholder="07X XXX XXXX"
              />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-lg shadow-black/20">
          <p className="text-xs font-mono text-white/70 mb-3">PAYMENT RECEIVER</p>
          <div className="space-y-2 text-sm">
            <p>Name: {tournament?.payment_recipient_name || "Uwase Kevine"}</p>
            <p>Number: {tournament?.payment_recipient_number || "0794417555"}</p>
            <p>Platform: MTN MoMo</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-900 p-4 shadow-lg shadow-black/20">
        <p className="text-xs font-mono text-white/60">AMOUNT TO PAY</p>
        <p className="mt-2 text-4xl font-black text-white">
          {amount.toLocaleString()} {currency}
        </p>
        <p className="text-sm text-white/70 mt-1">Tournament Entry Fee</p>
        <p className="text-sm text-white/50">{tournament?.name}</p>
      </div>
    </div>
  );
};

export default PaymentCard;
