import { getApiBaseUrl, getApiUrl } from "@/lib/api";

export async function uploadMediaFile(file: File, scope = "uploads"): Promise<string> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error("Missing API base URL. Configure VITE_API_URL for global media uploads.");
  }

  const response = await fetch(getApiUrl("/media/upload"), {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name || "upload"),
      "x-scope": scope,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const url = String(payload?.url || "");
  if (!url) {
    throw new Error("Upload failed: missing media URL");
  }

  if (url.startsWith("http")) return url;
  return `${baseUrl}${url}`;
}
