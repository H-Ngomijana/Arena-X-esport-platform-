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
  provider: "flutterwave";
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

const SIM_KEY = "flw_simulated_payments";

function readSimPayments(): Record<string, { successAt: number; amount: number; currency: string }> {
  try {
    const raw = localStorage.getItem(SIM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeSimPayments(data: Record<string, { successAt: number; amount: number; currency: string }>) {
  localStorage.setItem(SIM_KEY, JSON.stringify(data));
  markKeyDirty(SIM_KEY);
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
  // Simulated Flutterwave MTN MoMo checkout + callback.
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
    provider: "flutterwave",
    channel: "mtn_momo",
    created_at: new Date().toISOString(),
    reference: `FW_${Date.now()}`,
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
  try {
    const response = await fetch("/functions/initiateMomoPayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    const sim = readSimPayments();
    sim[payload.tx_ref] = {
      successAt: Date.now() + 12000,
      amount: payload.amount,
      currency: payload.currency,
    };
    writeSimPayments(sim);
    return {
      status: "success",
      data: {
        tx_ref: payload.tx_ref,
        id: payload.tx_ref,
      },
      simulated: true,
    };
  }
}

export async function verifyMomoPayment(payload: { transaction_id: string; tx_ref?: string }) {
  try {
    const response = await fetch("/functions/verifyPayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch {
    const ref = payload.tx_ref || payload.transaction_id;
    const sim = readSimPayments();
    const row = sim[ref];
    if (!row) {
      return { success: false };
    }
    if (Date.now() >= row.successAt) {
      return {
        success: true,
        amount: row.amount,
        currency: row.currency,
        tx_ref: ref,
        flw_ref: `SIM-${ref}`,
      };
    }
    return { success: false };
  }
}
