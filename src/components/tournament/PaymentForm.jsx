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
  onProceed,
}) => {
  return (
    <>
      <PaymentCard
        senderName={senderName}
        senderNumber={senderNumber}
        onSenderNameChange={setSenderName}
        onSenderNumberChange={setSenderNumber}
        tournament={tournament}
        shake={shake}
      />
      {numberError && <p className="text-sm text-rose-400">{numberError}</p>}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/Tournament?id=${tournament.id}`}
          className="h-12 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
        >
          BACK
        </Link>
        <button
          onClick={onProceed}
          className="h-12 rounded-xl font-bold bg-[#FFCC00] hover:bg-[#ffd633] text-black disabled:opacity-50"
          disabled={!canProceed}
        >
          PROCEED PAYMENT
        </button>
      </div>
    </>
  );
};

export default PaymentForm;

