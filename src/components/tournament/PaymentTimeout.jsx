const PaymentTimeout = ({ onRetry, tournamentId }) => {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-4">
      <div className="text-4xl">⏱</div>
      <h2 className="text-2xl font-black">Payment timed out</h2>
      <div className="text-white/70 text-sm space-y-1">
        <p>We did not receive confirmation from MTN.</p>
        <p>You may have cancelled, had insufficient balance, or faced a network issue.</p>
        <p>Your money has NOT been deducted.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onRetry} className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold">
          TRY AGAIN
        </button>
        <a
          href={`/Tournament?id=${tournamentId}`}
          className="h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center justify-center"
        >
          BACK TO TOURNAMENT
        </a>
      </div>
    </div>
  );
};

export default PaymentTimeout;

