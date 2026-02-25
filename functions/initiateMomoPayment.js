import Flutterwave from "flutterwave-node-v3";

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

export default async function initiateMomoPayment({
  phone_number,
  amount,
  currency,
  email,
  name,
  tournament_name,
  tx_ref,
}) {
  const payload = {
    phone_number,
    amount,
    currency,
    email,
    fullname: name,
    tx_ref,
    narration: `ArenaX: ${tournament_name} Entry Fee`,
    network: "MTN",
  };

  const response = await flw.MobileMoney.rwanda(payload);
  return {
    status: response?.status,
    message: response?.message,
    tx_ref,
    flw_transaction_id: response?.data?.id || null,
    data: response?.data || null,
  };
}
