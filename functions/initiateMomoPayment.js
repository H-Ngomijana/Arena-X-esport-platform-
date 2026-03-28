import { createRequestToPay, json, parseBody, sendMethodNotAllowed, sendOptions } from "./mtnMomo.js";

export default async function initiateMomoPayment(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method !== "POST") return sendMethodNotAllowed(req, res);

  try {
    const { phone_number, amount, currency, name, tournament_name, tx_ref } = parseBody(req);
    const payment = await createRequestToPay({
      phoneNumber: phone_number,
      amount,
      currency: currency || "RWF",
      externalId: tx_ref,
      payerMessage: `ArenaX ${tournament_name || "Tournament"} entry`,
      payeeNote: `Paid by ${name || "Player"}`,
    });

    return json(res, 200, {
      success: true,
      status: payment.status,
      tx_ref,
      momo_request_id: payment.referenceId,
      data: {
        id: payment.referenceId,
        tx_ref,
      },
    });
  } catch (error) {
    return json(res, 500, {
      success: false,
      error: error instanceof Error ? error.message : "mtn_momo_request_failed",
    });
  }
}
