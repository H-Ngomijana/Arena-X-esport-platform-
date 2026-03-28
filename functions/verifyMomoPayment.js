import { getRequestToPayStatus, json, parseBody, sendMethodNotAllowed, sendOptions } from "./mtnMomo.js";

export default async function verifyMomoPayment(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method !== "POST") return sendMethodNotAllowed(req, res);

  try {
    const { transaction_id, tx_ref } = parseBody(req);
    const requestId = transaction_id || tx_ref;
    if (!requestId) {
      return json(res, 400, { success: false, status: "missing_request_id" });
    }

    const data = await getRequestToPayStatus(requestId);
    const status = String(data?.status || "").toUpperCase();
    return json(res, 200, {
      success: status === "SUCCESSFUL",
      status,
      amount: data?.amount,
      currency: data?.currency,
      tx_ref: data?.externalId || tx_ref || null,
      momo_transaction_id: requestId,
      financial_transaction_id: data?.financialTransactionId || null,
      payer: data?.payer || null,
      payer_message: data?.payerMessage || null,
      payee_note: data?.payeeNote || null,
    });
  } catch (error) {
    return json(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "mtn_momo_verify_failed",
    });
  }
}
