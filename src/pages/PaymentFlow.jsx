import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PaymentSuccess from "@/components/tournament/PaymentSuccess";
import DeviceWarning from "@/components/tournament/DeviceWarning";
import PaymentForm from "@/components/tournament/PaymentForm";
import MtnWaiting from "@/components/tournament/MtnWaiting";
import PaymentTimeout from "@/components/tournament/PaymentTimeout";
import ManualPaymentForm from "@/components/tournament/ManualPaymentForm";
import ManualPaymentSuccess from "@/components/tournament/ManualPaymentSuccess";
import {
  createJoinRequest,
  getCurrentUser,
  getJoinRequests,
  getSoloProfiles,
  getTeams,
  getTournaments,
} from "@/lib/storage";
import { initiateMomoPayment, verifyMomoPayment } from "@/lib/payment";

const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

const PaymentFlow = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournament") || "";
  const profileType = searchParams.get("profile_type") || "team";
  const profileId = searchParams.get("profile_id") || "";

  const tournament = useMemo(() => getTournaments().find((item) => item.id === tournamentId), [tournamentId]);
  const currentUser = useMemo(() => getCurrentUser(), []);
  const team = useMemo(() => getTeams().find((item) => item.id === profileId), [profileId]);
  const soloProfile = useMemo(() => getSoloProfiles().find((item) => item.id === profileId), [profileId]);

  const [senderName, setSenderName] = useState(currentUser.name || "");
  const [senderNumber, setSenderNumber] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [autoRedirected, setAutoRedirected] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualDetails, setManualDetails] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [redirectTarget, setRedirectTarget] = useState("");
  const timeoutRef = useRef(null);

  if (!tournament) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/70">Tournament not found.</div>;
  }

  const amount = Number(tournament.entry_fee_amount ?? tournament.entry_fee ?? 0);
  const currency = tournament.entry_fee_currency || "RWF";
  const mtnRegex = /^07[89]\d{7}$/;
  const numberError = senderNumber && !mtnRegex.test(senderNumber) ? "Please enter a valid MTN Rwanda number (078/079 XXXXXXX)" : "";
  const canProceed = senderName.trim() && mtnRegex.test(senderNumber);
  const isMobile = isMobileDevice();

  const createPaidRequest = async (reference) => {
    createJoinRequest({
      tournament_id: tournament.id,
      tournament_name: tournament.name,
      user_email: currentUser.email,
      user_name: currentUser.name,
      profile_type: profileType === "solo" ? "solo" : "team",
      team_id: profileType === "team" ? team?.id : undefined,
      team_name: profileType === "team" ? team?.name : undefined,
      solo_profile_id: profileType === "solo" ? soloProfile?.id : undefined,
      payment_status: "paid",
      payment_method: "mtn_momo",
      payment_reference: reference,
      sender_name: senderName.trim(),
      sender_number: senderNumber.trim(),
      amount_paid: amount,
      approval_status: "awaiting_approval",
    });
  };

  const submitManualPayment = ({ name, phone, amount: sentAmount, note }) => {
    const manualRef = `MANUAL-${Date.now()}`;
    createJoinRequest({
      tournament_id: tournament.id,
      tournament_name: tournament.name,
      user_email: currentUser.email,
      user_name: name,
      profile_type: profileType === "solo" ? "solo" : "team",
      team_id: profileType === "team" ? team?.id : undefined,
      team_name: profileType === "team" ? team?.name : undefined,
      solo_profile_id: profileType === "solo" ? soloProfile?.id : undefined,
      payment_status: "manual_pending",
      payment_method: "manual",
      payment_reference: manualRef,
      sender_name: name,
      sender_number: phone,
      amount_paid: Number(sentAmount),
      manual_note: note || "",
      approval_status: "awaiting_approval",
    });
    setManualDetails({
      name,
      phone,
      amount: Number(sentAmount),
      tournamentName: tournament.name,
      currency,
    });
    setManualSuccess(true);
  };

  const handleFreeJoin = () => {
    const reference = `ARX-FREE-${Date.now()}`;
    createJoinRequest({
      tournament_id: tournament.id,
      tournament_name: tournament.name,
      user_email: currentUser.email,
      user_name: currentUser.name,
      profile_type: profileType === "solo" ? "solo" : "team",
      team_id: profileType === "team" ? team?.id : undefined,
      team_name: profileType === "team" ? team?.name : undefined,
      solo_profile_id: profileType === "solo" ? soloProfile?.id : undefined,
      payment_status: "free",
      payment_reference: reference,
      sender_name: currentUser.name,
      sender_number: "N/A",
      amount_paid: 0,
      approval_status: "awaiting_approval",
    });
    toast.success("Free tournament joined. Waiting admin approval.");
    navigate(`/Tournament?id=${tournament.id}`);
  };

  useEffect(() => {
    if (amount === 0) {
      handleFreeJoin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const startPayment = async () => {
    if (!canProceed) {
      setShake(true);
      toast.error("Please fill valid name and MTN number");
      setTimeout(() => setShake(false), 700);
      return;
    }

    const ref = `ARX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    setLoading(true);
    try {
      const result = await initiateMomoPayment({
        phone_number: senderNumber,
        amount,
        currency,
        email: currentUser.email,
        name: senderName,
        tournament_name: tournament.name,
        tx_ref: ref,
      });
      setTxRef(ref);
      setTransactionId(result?.data?.id?.toString?.() || ref);
      setPaymentInitiated(true);
    } catch {
      toast.error("Failed to initiate payment request");
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setPaymentInitiated(false);
    setPaymentTimeout(false);
    setPaymentSuccess(false);
    setTxRef("");
    setTransactionId("");
  };

  const resend = async () => {
    if (!txRef) return;
    setLoading(true);
    try {
      const result = await initiateMomoPayment({
        phone_number: senderNumber,
        amount,
        currency,
        email: currentUser.email,
        name: senderName,
        tournament_name: tournament.name,
        tx_ref: txRef,
      });
      setTransactionId(result?.data?.id?.toString?.() || txRef);
      toast.success("Payment request resent");
    } catch {
      toast.error("Could not resend request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!paymentInitiated || !txRef) return;
    let stop = false;

    const poll = setInterval(async () => {
      const result = await verifyMomoPayment({
        transaction_id: transactionId || txRef,
        tx_ref: txRef,
      });

      if (result?.success && !stop) {
        stop = true;
        clearInterval(poll);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        await createPaidRequest(txRef);
        setPaymentSuccess(true);
        setPaymentInitiated(false);
      }
    }, 5000);

    timeoutRef.current = setTimeout(() => {
      if (!stop) {
        stop = true;
        clearInterval(poll);
        setPaymentInitiated(false);
        setPaymentTimeout(true);
      }
    }, 120000);

    return () => {
      clearInterval(poll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentInitiated, txRef, transactionId]);

  useEffect(() => {
    if (!paymentSuccess || autoRedirected) return;
    const timer = setInterval(() => {
      const request = getJoinRequests().find(
        (item) =>
          item.payment_reference === txRef &&
          item.user_email === currentUser.email
      );
      if (request?.approval_status === "approved") {
        setAutoRedirected(true);
        sessionStorage.setItem("arenax_auto_join_redirect_ref", request.payment_reference);
        setRedirectTarget(`/TournamentLive?id=${request.tournament_id}`);
        setRedirectCountdown(3);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [paymentSuccess, txRef, currentUser.email, autoRedirected, navigate]);

  useEffect(() => {
    if (redirectCountdown <= 0 || !redirectTarget) return;
    if (redirectCountdown === 3) {
      toast.success("Approved! Entering tournament panel in 3 seconds.");
    }
    const timer = setTimeout(() => {
      if (redirectCountdown === 1) {
        navigate(redirectTarget);
      } else {
        setRedirectCountdown((n) => n - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, redirectTarget, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between text-sm">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white">
            Back to Tournament
          </button>
          <span className="text-white/70">{tournament.name}</span>
        </div>
        <h1 className="text-center text-3xl font-display font-black">PAY TO JOIN TOURNAMENT</h1>

        {!isMobile ? (
          <>
            <DeviceWarning onBack={() => navigate(-1)} />
            <div className="text-center text-white/40 text-sm">OR</div>
            {!manualSuccess ? (
              <ManualPaymentForm
                tournament={tournament}
                defaultName={currentUser.name}
                defaultAmount={amount}
                expanded
                onSuccess={submitManualPayment}
              />
            ) : (
              <ManualPaymentSuccess details={manualDetails} tournamentId={tournament.id} />
            )}
          </>
        ) : paymentSuccess ? (
          <PaymentSuccess amount={amount} currency={currency} reference={txRef} tournamentId={tournament.id} />
        ) : manualSuccess ? (
          <ManualPaymentSuccess details={manualDetails} tournamentId={tournament.id} />
        ) : paymentTimeout ? (
          <PaymentTimeout onRetry={resetState} tournamentId={tournament.id} />
        ) : paymentInitiated ? (
          <MtnWaiting
            senderNumber={senderNumber}
            amount={amount}
            currency={currency}
            receiverName={tournament.payment_recipient_name}
            txRef={txRef}
            onResend={resend}
            onCancel={resetState}
          />
        ) : (
          <PaymentForm
            tournament={tournament}
            senderName={senderName}
            senderNumber={senderNumber}
            setSenderName={setSenderName}
            setSenderNumber={setSenderNumber}
            shake={shake}
            canProceed={canProceed && !loading}
            numberError={numberError}
            onProceed={startPayment}
          />
        )}

        {isMobile && !paymentInitiated && !paymentSuccess && !manualSuccess && (
          <>
            <div className="text-center text-white/40 text-sm">OR</div>
            <ManualPaymentForm
              tournament={tournament}
              defaultName={senderName || currentUser.name}
              defaultPhone={senderNumber}
              defaultAmount={amount}
              onSuccess={submitManualPayment}
            />
          </>
        )}
      </div>
      {redirectCountdown > 0 && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-[#0a0a12] p-6 text-center">
            <p className="text-emerald-300 font-mono text-xs uppercase tracking-widest">Approved</p>
            <h3 className="text-2xl font-black mt-2">Entering Tournament Panel</h3>
            <p className="text-white/70 mt-1">Redirecting in {redirectCountdown}s</p>
            <div className="mt-4 h-2 rounded bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000"
                style={{ width: `${((4 - redirectCountdown) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFlow;
