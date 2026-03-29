import PaymentCard from "@/components/tournament/PaymentCard";
import { Link } from "react-router-dom";

const PaymentForm = ({
  tournament,
  senderName,
  senderNumber,
  setSenderName,
  setSenderNumber,
  shake,
  canProceed,
  numberError,
  sandboxCurrencyNotice,
  onProceed,
}) => {
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onProceed();
      }}
    >
      <PaymentCard
        senderName={senderName}
        senderNumber={senderNumber}
        onSenderNameChange={setSenderName}
        onSenderNumberChange={setSenderNumber}
        tournament={tournament}
        shake={shake}
      />
      {numberError && <p className="text-sm text-rose-400">{numberError}</p>}
      {sandboxCurrencyNotice && <p className="text-sm text-amber-300">{sandboxCurrencyNotice}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/Tournament?id=${tournament.id}`}
          className="h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
        >
          BACK
        </Link>
        <button
          type="submit"
          aria-disabled={!canProceed}
          className={`h-12 rounded-xl border border-[#ffe680] font-extrabold tracking-wide text-black shadow-[0_0_24px_rgba(255,204,0,0.35)] transition-all ${
            canProceed
              ? "bg-[#FFCC00] hover:bg-[#ffd633] hover:shadow-[0_0_32px_rgba(255,204,0,0.5)]"
              : "bg-[#FFCC00] opacity-100"
          }`}
        >
          PROCEED PAYMENT
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;

