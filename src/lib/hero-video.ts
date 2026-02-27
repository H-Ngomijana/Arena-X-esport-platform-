const DB_NAME = "arenax_media_db";
const DB_VERSION = 1;
const STORE_NAME = "kv";
const HERO_VIDEO_KEY = "home_hero_video_blob";
const HERO_VIDEO_META_KEY = "home_hero_video_meta";

type SaveHeroVideoOptions = {
  onProgress?: (progress: number) => void;
  timeoutMs?: number;
  maxRetries?: number;
};

const getSyncBaseUrl = () => {
  const configured = (import.meta.env.VITE_SYNC_API_BASE_URL || "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

function emitUpdate() {
  window.dispatchEvent(new CustomEvent("arenax:hero-video-updated", { detail: { at: new Date().toISOString() } }));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putValue(key: string, value: any) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function getValue<T>(key: string): Promise<T | null> {
  const db = await openDb();
  const value = await new Promise<T | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve((req.result as T) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

async function deleteValue(key: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function saveLocalFallback(file: File) {
  await putValue(HERO_VIDEO_KEY, file);
  await putValue(HERO_VIDEO_META_KEY, {
    name: file.name,
    type: file.type,
    size: file.size,
    updated_at: new Date().toISOString(),
    source: "local",
  });
}

async function clearLocalFallback() {
  await deleteValue(HERO_VIDEO_KEY);
  await deleteValue(HERO_VIDEO_META_KEY);
}

function uploadHeroVideoWithRetry(
  baseUrl: string,
  file: File,
  options: SaveHeroVideoOptions = {}
): Promise<void> {
  const timeoutMs = Math.max(30_000, Number(options.timeoutMs || 180_000));
  const maxRetries = Math.max(0, Number(options.maxRetries ?? 2));
  const onProgress = options.onProgress;

  const runAttempt = (attempt: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `${baseUrl}/media/home-hero`);
      xhr.timeout = timeoutMs;
      xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
      xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name || "hero-video.mp4"));

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return;
        const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
        onProgress(progress);
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve();
          return;
        }

        const canRetry = attempt < maxRetries && (xhr.status >= 500 || xhr.status === 0);
        if (canRetry) {
          window.setTimeout(() => {
            runAttempt(attempt + 1).then(resolve).catch(reject);
          }, 700 * (attempt + 1));
          return;
        }
        reject(new Error(`Upload failed: ${xhr.status || "network_error"}`));
      };

      xhr.onerror = () => {
        const canRetry = attempt < maxRetries;
        if (canRetry) {
          window.setTimeout(() => {
            runAttempt(attempt + 1).then(resolve).catch(reject);
          }, 700 * (attempt + 1));
          return;
        }
        reject(new Error("Upload failed: network_error"));
      };

      xhr.ontimeout = () => {
        const canRetry = attempt < maxRetries;
        if (canRetry) {
          window.setTimeout(() => {
            runAttempt(attempt + 1).then(resolve).catch(reject);
          }, 700 * (attempt + 1));
          return;
        }
        reject(new Error("Upload failed: timeout"));
      };

      xhr.send(file);
    });

  return runAttempt(0);
}

export async function saveHomeHeroVideo(file: File, options: SaveHeroVideoOptions = {}) {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) {
    await saveLocalFallback(file);
    options.onProgress?.(100);
    emitUpdate();
    return;
  }

  try {
    await uploadHeroVideoWithRetry(baseUrl, file, options);
    emitUpdate();
  } catch (error) {
    // In synced mode, local fallback creates device-only hero videos.
    // Fail fast so admin can retry against backend and keep global consistency.
    throw error instanceof Error ? error : new Error("Hero video upload failed");
  }
}

export async function getHomeHeroVideoBlob(): Promise<Blob | null> {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) return await getValue<Blob>(HERO_VIDEO_KEY);

  try {
    // Fetch remote video directly so transient meta endpoint errors
    // do not incorrectly hide an existing remote hero video.
    const response = await fetch(`${baseUrl}/media/home-hero`, { method: "GET" });
    if (response.ok) return await response.blob();
    if (response.status === 404) {
      // Explicitly no remote video set.
      return await getValue<Blob>(HERO_VIDEO_KEY);
    }
    return await getValue<Blob>(HERO_VIDEO_KEY);
  } catch {
    return await getValue<Blob>(HERO_VIDEO_KEY);
  }
}

export async function hasRemoteHomeHeroVideo(): Promise<boolean> {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) return false;
  try {
    const response = await fetch(`${baseUrl}/media/home-hero-meta`, { method: "GET" });
    if (!response.ok) return false;
    const payload = await response.json();
    return Boolean(payload?.exists);
  } catch {
    return false;
  }
}

export async function getHomeHeroVideoMeta(): Promise<{
  name: string;
  type: string;
  size: number;
  updated_at: string;
  source?: "remote" | "local";
} | null> {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) return await getValue(HERO_VIDEO_META_KEY);

  try {
    const response = await fetch(`${baseUrl}/media/home-hero-meta`, { method: "GET" });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.exists) {
        return {
          name: payload.name,
          type: payload.type,
          size: payload.size,
          updated_at: payload.updated_at,
          source: "remote",
        };
      }
      return null;
    }
  } catch {
    // fallback to local
  }
  const local = await getValue<{
    name: string;
    type: string;
    size: number;
    updated_at: string;
  }>(HERO_VIDEO_META_KEY);
  return local ? { ...local, source: "local" } : null;
}

export async function clearHomeHeroVideo() {
  const baseUrl = getSyncBaseUrl();
  if (baseUrl) {
    try {
      await fetch(`${baseUrl}/media/home-hero`, { method: "DELETE" });
    } catch {
      // ignore and clear local fallback
    }
  }
  await clearLocalFallback();
  emitUpdate();
}
