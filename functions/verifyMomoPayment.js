import Flutterwave from "flutterwave-node-v3";

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

export default async function verifyMomoPayment({ tx_ref }) {
  if (!tx_ref) {
    return { success: false, status: "missing_tx_ref" };
  }

  const response = await flw.Transaction.verify_by_reference({ tx_ref });
  const data = response?.data;
  return {
    success: data?.status === "successful",
    status: data?.status,
    amount: data?.amount,
    currency: data?.currency,
    tx_ref: data?.tx_ref,
    flw_transaction_id: data?.id,
  };
}
