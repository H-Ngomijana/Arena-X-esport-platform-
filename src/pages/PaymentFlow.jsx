import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PaymentSuccess from "@/components/tournament/PaymentSuccess";
import DeviceWarning from "@/components/tournament/DeviceWarning";
import PaymentForm from "@/components/tournament/PaymentForm";
import MtnWaiting from "@/components/tournament/MtnWaiting";
import PaymentTimeout from "@/components/tournament/PaymentTimeout";
import {
  getCurrentUser,
  getMyTournamentJoinRequest,
  getSoloProfiles,
  getTeams,
  getTournaments,
  upsertMyTournamentJoinRequest,
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
  const [redirectCountdown, setRedirectCountdown] = useState(0);
  const [redirectTarget, setRedirectTarget] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const timeoutRef = useRef(null);

  if (!tournament) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/70">Tournament not found.</div>;
  }
  if (currentUser.is_guest) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a12] p-6 text-center space-y-3">
          <p className="text-lg font-bold text-white">Login Required</p>
          <p className="text-sm text-white/70">You must login before payment and tournament join.</p>
          <button
            onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
            className="h-11 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold"
          >
            LOGIN / SIGN UP
          </button>
        </div>
      </div>
    );
  }

  const amount = Number(tournament.entry_fee_amount ?? tournament.entry_fee ?? 0);
  const currency = tournament.entry_fee_currency || "RWF";
  const myJoinRequest = useMemo(
    () => getMyTournamentJoinRequest(tournament.id, currentUser.email),
    [tournament.id, currentUser.email, refreshTick]
  );
  const mtnRegex = /^07[89]\d{7}$/;
  const numberError = senderNumber && !mtnRegex.test(senderNumber) ? "Please enter a valid MTN Rwanda number (078/079 XXXXXXX)" : "";
  const canProceed = senderName.trim() && mtnRegex.test(senderNumber);
  const isMobile = isMobileDevice();

  useEffect(() => {
    const onChange = () => setRefreshTick((n) => n + 1);
    window.addEventListener("arenax:data-changed", onChange);
    return () => window.removeEventListener("arenax:data-changed", onChange);
  }, []);

  const createPaidRequest = async (reference, flwTransactionId) => {
    upsertMyTournamentJoinRequest(tournament.id, currentUser.email, {
      tournament_name: tournament.name,
      user_name: currentUser.name,
      profile_type: profileType === "solo" ? "solo" : "team",
      team_id: profileType === "team" ? team?.id : undefined,
      team_name: profileType === "team" ? team?.name : undefined,
      solo_profile_id: profileType === "solo" ? soloProfile?.id : undefined,
      payment_status: "paid",
      payment_method: "mtn_momo",
      payment_reference: reference,
      flw_transaction_id: flwTransactionId || undefined,
      sender_name: senderName.trim(),
      sender_number: senderNumber.trim(),
      amount_paid: amount,
      approval_status: "awaiting_approval",
    });
  };

  const handleFreeJoin = () => {
    const reference = `ARX-FREE-${Date.now()}`;
    upsertMyTournamentJoinRequest(tournament.id, currentUser.email, {
      tournament_name: tournament.name,
      user_name: currentUser.name,
      profile_type: profileType === "solo" ? "solo" : "team",
      team_id: profileType === "team" ? team?.id : undefined,
      team_name: profileType === "team" ? team?.name : undefined,
      solo_profile_id: profileType === "solo" ? soloProfile?.id : undefined,
      payment_status: "free",
      payment_method: "free",
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
    if (myJoinRequest?.approval_status === "approved") {
      navigate(`/TournamentLive?id=${tournament.id}`);
      return;
    }
    if (myJoinRequest?.approval_status === "awaiting_approval") {
      toast.info("Your request is already awaiting admin approval.");
      return;
    }
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
      const result = await verifyMomoPayment({ tx_ref: txRef, transaction_id: transactionId || txRef });

      if (result?.success && !stop) {
        stop = true;
        clearInterval(poll);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        await createPaidRequest(txRef, result?.flw_transaction_id);
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
      const request = getMyTournamentJoinRequest(tournament.id, currentUser.email);
      if (request?.approval_status === "approved") {
        setAutoRedirected(true);
        sessionStorage.setItem("arenax_auto_join_redirect_ref", request.payment_reference || txRef);
        setRedirectTarget(`/TournamentLive?id=${request.tournament_id}`);
        setRedirectCountdown(3);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [paymentSuccess, txRef, currentUser.email, autoRedirected, navigate, tournament.id]);

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

        {myJoinRequest?.approval_status === "approved" ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center space-y-3">
            <p className="text-emerald-300 font-bold">Already Approved</p>
            <p className="text-white/70">You have already joined this tournament with this account.</p>
            <button
              onClick={() => navigate(`/TournamentLive?id=${tournament.id}`)}
              className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              ENTER TOURNAMENT
            </button>
          </div>
        ) : myJoinRequest?.approval_status === "awaiting_approval" ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center space-y-3">
            <p className="text-amber-300 font-bold">Awaiting Admin Approval</p>
            <p className="text-white/70">Payment already submitted. No need to pay again.</p>
            <button
              onClick={() => navigate(`/Tournament?id=${tournament.id}`)}
              className="h-11 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold"
            >
              BACK TO TOURNAMENT
            </button>
          </div>
        ) : (
          <>
        {!isMobile ? (
          <DeviceWarning onBack={() => navigate(-1)} />
        ) : paymentSuccess ? (
          <PaymentSuccess amount={amount} currency={currency} reference={txRef} tournamentId={tournament.id} />
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
