const getBaseUrl = () => {
  const configured = (import.meta.env.VITE_SYNC_API_BASE_URL || "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function uploadMediaFile(file: File, scope = "uploads"): Promise<string> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return await toDataUrl(file);

  try {
    const response = await fetch(`${baseUrl}/media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-file-name": encodeURIComponent(file.name || "upload"),
        "x-scope": scope,
      },
      body: file,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const url = String(payload?.url || "");
    if (!url) throw new Error("Missing media url");
    if (url.startsWith("http")) return url;
    return `${baseUrl}${url}`;
  } catch (error) {
    // In synced deployments, failing over to local data URLs causes
    // non-global state and oversized sync payloads. Hard-fail instead.
    throw error instanceof Error ? error : new Error("Upload failed");
  }
}
