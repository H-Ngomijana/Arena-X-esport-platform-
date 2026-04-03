import { getApiBaseUrl } from "@/lib/api";

export function getSyncMediaBaseUrl(): string {
  const configured = getApiBaseUrl();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return "";
}

export function resolveMediaUrl(input?: string | null): string {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("blob:") ||
    raw.startsWith("data:")
  ) {
    return raw;
  }
  if (raw.startsWith("//")) return `https:${raw}`;

  const base = getSyncMediaBaseUrl();
  if (!base) return raw;

  // Most uploaded files are stored as relative '/media/files/...'
  if (raw.startsWith("/")) return `${base}${raw}`;
  return `${base}/${raw}`;
}
