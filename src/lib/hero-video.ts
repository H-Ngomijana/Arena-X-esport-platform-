const DB_NAME = "arenax_media_db";
const DB_VERSION = 1;
const STORE_NAME = "kv";
const HERO_VIDEO_KEY = "home_hero_video_blob";
const HERO_VIDEO_META_KEY = "home_hero_video_meta";

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

export async function saveHomeHeroVideo(file: File) {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) {
    await saveLocalFallback(file);
    emitUpdate();
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/media/home-hero`, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "video/mp4",
        "x-file-name": encodeURIComponent(file.name || "hero-video.mp4"),
      },
      body: file,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    emitUpdate();
  } catch {
    // Keep local fallback in case sync server is unavailable.
    await saveLocalFallback(file);
    emitUpdate();
  }
}

export async function getHomeHeroVideoBlob(): Promise<Blob | null> {
  const baseUrl = getSyncBaseUrl();
  if (!baseUrl) return await getValue<Blob>(HERO_VIDEO_KEY);

  try {
    const meta = await getHomeHeroVideoMeta();
    if (!meta || meta.source === "local") {
      return await getValue<Blob>(HERO_VIDEO_KEY);
    }
    const response = await fetch(`${baseUrl}/media/home-hero`, { method: "GET" });
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return await getValue<Blob>(HERO_VIDEO_KEY);
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
