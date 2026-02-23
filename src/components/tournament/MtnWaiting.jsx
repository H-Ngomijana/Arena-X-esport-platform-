const MtnWaiting = ({
  senderNumber,
  amount,
  currency,
  receiverName,
  txRef,
  onResend,
  onCancel,
}) => {
  return (
    <div className="rounded-2xl bg-[#FFCC00]/10 border border-[#FFCC00]/40 p-8 space-y-4 text-center">
      <div className="w-20 h-20 rounded-full bg-[#FFCC00] text-black flex items-center justify-center text-3xl font-black mx-auto">
        M
      </div>
      <h2 className="text-2xl font-black">CHECK YOUR PHONE</h2>
      <p className="text-white/80">A payment request has been sent to: {senderNumber}</p>
      <div className="rounded-xl border border-white/20 bg-black/20 p-4 text-left text-sm space-y-1">
        <p>Amount: {Number(amount).toLocaleString()} {currency}</p>
        <p>To: {receiverName}</p>
        <p>Ref: {txRef}</p>
      </div>
      <div className="text-sm text-white/70">
        <p>1. A popup will appear from MTN</p>
        <p>2. Enter your MTN MoMo PIN</p>
        <p>3. Confirm the payment</p>
        <p>4. Return here - we detect it automatically</p>
      </div>
      <div className="flex items-center justify-center gap-2 text-white/80">
        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
        Waiting for confirmation...
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onResend} className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold">
          RESEND REQUEST
        </button>
        <button onClick={onCancel} className="h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default MtnWaiting;

