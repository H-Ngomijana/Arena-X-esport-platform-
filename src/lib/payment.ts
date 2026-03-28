import { markKeyDirty } from "@/lib/remote-sync";

export type PaymentStatus = "pending" | "success" | "failed";

export interface PaymentRequest {
  amount: number;
  currency?: string;
  method?: string;
  description?: string;
  phone: string;
  team_id: string;
  tournament_id: string;
  tournament_name: string;
}

export interface PaymentTransaction extends PaymentRequest {
  id: string;
  status: PaymentStatus;
  provider: "mtn_momo";
  channel: "mtn_momo";
  created_at: string;
  paid_at?: string;
  reference: string;
}

const readTransactions = (): PaymentTransaction[] => {
  try {
    const stored = localStorage.getItem("transactions");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const writeTransactions = (transactions: PaymentTransaction[]) => {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  markKeyDirty("transactions");
};

export const getTransactions = () => readTransactions();

async function postJsonWithFallback(path: string, payload: unknown) {
  const candidates = path.startsWith("/api/")
    ? [path, path.replace(/^\/api\//, "/functions/")]
    : [path];

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("request_failed");
    }
  }

  throw lastError || new Error("request_failed");
}

export async function initiatePayment({
  amount,
  currency = "RWF",
  method = "MTN MoMo",
  description = "",
  phone,
  team_id,
  tournament_id,
  tournament_name,
}: PaymentRequest): Promise<PaymentTransaction> {
  // Simulated MTN MoMo request-to-pay flow for local fallback.
  const tx: PaymentTransaction = {
    id: Date.now().toString(),
    amount,
    currency,
    method,
    description,
    phone,
    team_id,
    tournament_id,
    tournament_name,
    status: "pending",
    provider: "mtn_momo",
    channel: "mtn_momo",
    created_at: new Date().toISOString(),
    reference: `MTN_${Date.now()}`,
  };

  writeTransactions([...readTransactions(), tx]);

  return new Promise((resolve) => {
    setTimeout(() => {
      const successTx: PaymentTransaction = {
        ...tx,
        status: "success",
        paid_at: new Date().toISOString(),
      };
      const updated = readTransactions().map((t) => (t.id === tx.id ? successTx : t));
      writeTransactions(updated);
      resolve(successTx);
    }, 1500);
  });
}

export async function initiateMomoPayment(payload: {
  phone_number: string;
  amount: number;
  currency: string;
  email: string;
  name: string;
  tournament_name: string;
  tx_ref: string;
}) {
  return postJsonWithFallback("/api/initiateMomoPayment", payload);
}

export async function verifyMomoPayment(payload: { transaction_id: string; tx_ref?: string }) {
  const body = payload.tx_ref ? { tx_ref: payload.tx_ref } : payload;
  let data;
  try {
    data = await postJsonWithFallback("/api/verifyMomoPayment", body);
  } catch {
    data = await postJsonWithFallback("/api/verifyPayment", body);
  }
  if (data?.success === false && data?.status && data.status !== "PENDING") {
    return {
      ...data,
      success: false,
      momo_transaction_id:
        data?.momo_transaction_id || data?.financial_transaction_id || data?.id || null,
    };
  }
  return {
    ...data,
    momo_transaction_id:
      data?.momo_transaction_id || data?.financial_transaction_id || data?.id || null,
    flw_transaction_id:
      data?.flw_transaction_id || data?.momo_transaction_id || data?.financial_transaction_id || data?.id || null,
  };
}
