import Flutterwave from "flutterwave-node-v3";

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

export default async function verifyPayment({ transaction_id }) {
  const response = await flw.Transaction.verify({ id: transaction_id });
  return {
    success: response?.data?.status === "successful",
    amount: response?.data?.amount,
    currency: response?.data?.currency,
    tx_ref: response?.data?.tx_ref,
    flw_ref: response?.data?.flw_ref,
  };
}

