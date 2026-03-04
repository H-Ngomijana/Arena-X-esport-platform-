import { apiPost } from "@/lib/api";

export async function requestPasswordResetEmail(email: string) {
  return apiPost<{ ok: boolean; message: string }>("/auth/forgot-password", { email });
}

export async function submitPasswordReset(payload: {
  token: string;
  userId: string;
  password: string;
}) {
  return apiPost<{ ok: boolean; message: string; error?: string }>("/auth/reset-password", payload);
}

