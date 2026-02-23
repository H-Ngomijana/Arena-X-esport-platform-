const AdminManualPaymentAlert = ({ count = 0 }) => {
  if (count <= 0) return null;
  return (
    <div className="sticky top-0 z-10 rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
      <p className="font-mono font-semibold">
        {count} manual payment{count > 1 ? "s are" : " is"} waiting for your verification.
      </p>
      <p className="text-amber-200/80 text-xs mt-1">
        Check your MTN MoMo account (0794417555) before approving. Review sender details on each card.
      </p>
    </div>
  );
};

export default AdminManualPaymentAlert;

