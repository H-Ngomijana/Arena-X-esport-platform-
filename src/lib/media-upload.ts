const getBaseUrl = () => {
  const configured = (import.meta.env.VITE_SYNC_API_BASE_URL || "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

export async function uploadMediaFile(file: File, scope = "uploads"): Promise<string> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing sync API base URL. Configure VITE_SYNC_API_BASE_URL for global media uploads.");
  }

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
    // Hard-fail so admin never saves device-local-only media URLs.
    throw error instanceof Error ? error : new Error("Upload failed");
  }
}
