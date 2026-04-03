const resolveBase = () => {
  const configured = (import.meta.env.VITE_API_URL || import.meta.env.VITE_SYNC_API_BASE_URL || "").trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

export const getApiBaseUrl = () => resolveBase();
export const hasRemoteApiBaseUrl = () => Boolean(resolveBase());

export const getApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  const base = resolveBase();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "string"
        ? body
        : body && typeof body === "object" && "error" in body
        ? String((body as any).error)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function apiGet<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: "GET",
    credentials: "include",
    ...init,
  });
  return parseResponse<T>(response);
}

export async function apiPost<T = any>(
  path: string,
  body?: unknown,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers || {});

  const isBinary =
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof Uint8Array ||
    body instanceof FormData;

  if (!isBinary && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const payload =
    body == null
      ? undefined
      : body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer || body instanceof Uint8Array
      ? (body as BodyInit)
      : JSON.stringify(body);

  const response = await fetch(getApiUrl(path), {
    method: "POST",
    credentials: "include",
    ...init,
    headers,
    body: payload,
  });

  return parseResponse<T>(response);
}
