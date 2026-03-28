const DEFAULT_BASE_URL = "https://sandbox.momodeveloper.mtn.com";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function sendMethodNotAllowed(req, res) {
  res.setHeader("Allow", "POST, OPTIONS");
  return json(res, 405, { success: false, error: "method_not_allowed" });
}

function sendOptions(res) {
  res.setHeader("Allow", "POST, OPTIONS");
  res.status(204).end();
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function getRequiredConfig() {
  const config = {
    baseUrl: (
      process.env.MTN_MOMO_BASE_URL ||
      process.env.VITE_MOMO_BASE_URL ||
      DEFAULT_BASE_URL
    ).replace(/\/$/, ""),
    subscriptionKey:
      process.env.MTN_MOMO_COLLECTION_PRIMARY_KEY ||
      process.env.VITE_MOMO_SUBSCRIPTION_KEY ||
      "",
    apiUser:
      process.env.MTN_MOMO_API_USER ||
      process.env.VITE_MOMO_API_USER_ID ||
      "",
    apiKey:
      process.env.MTN_MOMO_API_KEY ||
      process.env.VITE_MOMO_API_KEY ||
      "",
    targetEnvironment:
      process.env.MTN_MOMO_TARGET_ENVIRONMENT ||
      process.env.VITE_MOMO_ENVIRONMENT ||
      "sandbox",
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing MTN MoMo config: ${missing.join(", ")}`);
  }

  return config;
}

function normalizeMsisdn(rawValue = "") {
  const digits = String(rawValue).replace(/\D/g, "");
  if (digits.startsWith("250") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `25${digits}`;
  if (digits.length === 9 && digits.startsWith("7")) return `250${digits}`;
  throw new Error("invalid_mtn_rwanda_number");
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getAccessToken(config) {
  const credentials = Buffer.from(`${config.apiUser}:${config.apiKey}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
  });

  const data = await safeJson(response);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.message || `token_request_failed_${response.status}`);
  }
  return data.access_token;
}

export async function createRequestToPay({
  phoneNumber,
  amount,
  currency,
  externalId,
  payerMessage,
  payeeNote,
}) {
  const config = getRequiredConfig();
  const normalizedCurrency = String(currency || "RWF").toUpperCase();
  if (config.targetEnvironment === "sandbox" && normalizedCurrency !== "EUR") {
    throw new Error("MTN sandbox only supports EUR. Use EUR in sandbox or switch to production credentials for RWF.");
  }
  const token = await getAccessToken(config);
  const referenceId = crypto.randomUUID();
  const body = {
    amount: Number(amount).toFixed(0),
    currency: normalizedCurrency,
    externalId,
    payer: {
      partyIdType: "MSISDN",
      partyId: normalizeMsisdn(phoneNumber),
    },
    payerMessage,
    payeeNote,
  };

  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok && response.status !== 202) {
    const data = await safeJson(response);
    throw new Error(data?.message || `request_to_pay_failed_${response.status}`);
  }

  return {
    referenceId,
    externalId,
    status: response.status === 202 ? "pending" : "accepted",
  };
}

export async function getRequestToPayStatus(referenceId) {
  const config = getRequiredConfig();
  const token = await getAccessToken(config);
  const response = await fetch(`${config.baseUrl}/collection/v1_0/requesttopay/${referenceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": config.targetEnvironment,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
  });

  const data = await safeJson(response);
  if (!response.ok) {
    throw new Error(data?.message || `request_status_failed_${response.status}`);
  }

  return data;
}

export { json, parseBody, sendMethodNotAllowed, sendOptions };
