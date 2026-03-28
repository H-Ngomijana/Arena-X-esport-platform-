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
          className={`h-12 rounded-xl font-bold text-black transition-colors ${
            canProceed ? "bg-[#FFCC00] hover:bg-[#ffd633]" : "bg-[#FFCC00]/70 hover:bg-[#FFCC00]/80"
          }`}
        >
          PROCEED PAYMENT
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;

