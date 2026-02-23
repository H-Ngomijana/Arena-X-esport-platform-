const ManualPaymentSuccess = ({ details, tournamentId }) => {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
      <div className="text-4xl animate-pulse">⏳</div>
      <h2 className="text-2xl font-black">PAYMENT SUBMITTED FOR REVIEW</h2>
      <p className="text-white/70 text-sm">Your payment details have been sent to the admin.</p>
      <div className="rounded-xl border border-white/20 bg-black/20 p-4 text-left text-sm space-y-1">
        <p>Your Name: {details.name}</p>
        <p>Your Number: {details.phone}</p>
        <p>Amount Sent: {Number(details.amount).toLocaleString()} {details.currency || "RWF"}</p>
        <p>Tournament: {details.tournamentName}</p>
        <p>Status: AWAITING ADMIN REVIEW</p>
      </div>
      <p className="text-sm text-white/60">
        The admin will verify your payment and approve your entry. You will receive a notification.
      </p>
      <a
        href={`/Tournament?id=${tournamentId}`}
        className="h-11 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center justify-center"
      >
        BACK TO TOURNAMENT
      </a>
    </div>
  );
};

export default ManualPaymentSuccess;

