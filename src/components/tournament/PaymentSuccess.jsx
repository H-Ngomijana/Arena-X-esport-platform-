import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentSuccess = ({ amount, currency, reference, tournamentId }) => {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4">
      <CheckCircle2 size={54} className="mx-auto text-emerald-400 animate-pulse" />
      <h2 className="text-3xl font-display font-black">PAYMENT SENT!</h2>
      <p className="text-white/80">
        Your payment of {amount.toLocaleString()} {currency} has been received.
      </p>
      <p className="text-white/70">Waiting for admin approval to enter the tournament.</p>
      <p className="text-sm text-white/60">Reference: #{reference}</p>
      <p className="text-sm text-white/50">You will be notified once approved.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Link
          to="/notifications"
          className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center justify-center font-bold"
        >
          VIEW MY REQUESTS
        </Link>
        <Link
          to={`/Tournament?id=${tournamentId}`}
          className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black inline-flex items-center justify-center font-bold"
        >
          BACK TO TOURNAMENT
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;

