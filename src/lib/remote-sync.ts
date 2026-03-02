const SYNC_META_KEY = "arenax_sync_meta_v1";

type SyncMeta = Record<string, number>;

type SyncRecord = {
  key: string;
  ts: number;
  value: string | null;
};

const SYNC_KEYS = [
  "arenax_games",
  "tournaments",
  "announcements",
  "media_feed",
  "page_backgrounds",
  "teams",
  "matches",
  "join_requests",
  "solo_profiles",
  "dispute_reports",
  "user_notifications",
  "arenax_user_accounts",
  "arenax_password_reset_requests",
  "arenax_direct_messages",
  "arenax_team_invites",
  "arenax_match_chat_messages",
  "arenax_system_settings",
  "submissions",
  "solo_registrations",
  "team_registrations",
  "transactions",
  "flw_simulated_payments",
] as const;

const getBaseUrl = () => {
  const configured = (import.meta.env.VITE_SYNC_API_BASE_URL || "").trim();
  if (configured) return configured;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
};

function readMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: SyncMeta) {
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
}

export function markKeyDirty(key: string) {
  const meta = readMeta();
  meta[key] = Date.now();
  writeMeta(meta);
}

let syncStarted = false;
let pushInFlight = false;
let pullInFlight = false;
let syncEnabled = false;
let syncHydrated = false;
const LOCAL_WRITE_PROTECT_MS = 2 * 60 * 1000;
const MAX_RECORD_BYTES = 2 * 1024 * 1024;

function stripDataUrls(value: any): { value: any; changed: boolean } {
  if (typeof value === "string") {
    if (value.startsWith("data:")) return { value: "", changed: true };
    return { value, changed: false };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const next = value
      .map((item) => {
        const stripped = stripDataUrls(item);
        changed = changed || stripped.changed;
        return stripped.value;
      })
      .filter((item) => item !== null && typeof item !== "undefined");
    return { value: next, changed };
  }
  if (value && typeof value === "object") {
    let changed = false;
    const next: Record<string, any> = {};
    for (const [key, nested] of Object.entries(value)) {
      const stripped = stripDataUrls(nested);
      changed = changed || stripped.changed;
      next[key] = stripped.value;
    }
    return { value: next, changed };
  }
  return { value, changed: false };
}

function normalizeLocalRecordValue(key: string, rawValue: string | null): string | null {
  if (rawValue === null) return null;
  if (rawValue.length <= MAX_RECORD_BYTES) return rawValue;
  try {
    const parsed = JSON.parse(rawValue);
    const stripped = stripDataUrls(parsed);
    if (!stripped.changed) return rawValue;
    const normalized = JSON.stringify(stripped.value);
    localStorage.setItem(key, normalized);
    return normalized;
  } catch {
    return rawValue;
  }
}

async function pushAll(baseUrl: string) {
  if (syncEnabled && !syncHydrated) return;
  if (pushInFlight) return;
  pushInFlight = true;
  try {
    const meta = readMeta();
    const records: SyncRecord[] = SYNC_KEYS.map((key) => ({
      key,
      ts: Number(meta[key] || 0),
      value: normalizeLocalRecordValue(key, localStorage.getItem(key)),
    }));
    const response = await fetch(`${baseUrl}/sync/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    if (!response.ok) {
      throw new Error(`Sync merge failed: ${response.status}`);
    }
  } catch {
    // no-op: fallback remains local only
  } finally {
    pushInFlight = false;
  }
}

async function pullAll(baseUrl: string) {
  if (pullInFlight) return;
  pullInFlight = true;
  try {
    const response = await fetch(`${baseUrl}/sync/snapshot`);
    if (!response.ok) return;
    const payload = await response.json();
    const records: SyncRecord[] = Array.isArray(payload?.records) ? payload.records : [];
    const meta = readMeta();
    let changed = false;

    for (const record of records) {
      if (!record?.key) continue;
      const localTs = Number(meta[record.key] || 0);
      const remoteTs = Number(record.ts || 0);
      const localWriteIsRecent = localTs > 0 && Date.now() - localTs < LOCAL_WRITE_PROTECT_MS;
      if (localWriteIsRecent && remoteTs >= localTs) {
        // Protect recent local/admin actions from being rolled back by delayed remote snapshots.
        continue;
      }
      if (remoteTs <= localTs) continue;

      if (record.value === null || typeof record.value === "undefined") {
        localStorage.removeItem(record.key);
      } else {
        localStorage.setItem(record.key, String(record.value));
      }
      meta[record.key] = remoteTs;
      changed = true;
    }

    if (changed) {
      writeMeta(meta);
      window.dispatchEvent(
        new CustomEvent("arenax:data-changed", {
          detail: { key: "remote_sync", at: new Date().toISOString() },
        })
      );
    }
  } catch {
    // no-op
  } finally {
    pullInFlight = false;
  }
}

export function startRemoteSync() {
  if (syncStarted) return;
  syncStarted = true;

  const baseUrl = getBaseUrl();
  if (!baseUrl) return;
  syncEnabled = true;
  syncHydrated = false;

  Promise.resolve()
    .then(async () => {
      await pullAll(baseUrl);
      syncHydrated = true;
      await pushAll(baseUrl);
    })
    .catch(() => {
      syncHydrated = true;
    });

  const pushTimer = window.setInterval(() => pushAll(baseUrl), 2000);
  const pullTimer = window.setInterval(() => pullAll(baseUrl), 2000);

  const onOnline = () => {
    pullAll(baseUrl);
    pushAll(baseUrl);
  };
  const onDataChanged = () => {
    // Push quickly after local writes to reduce conflict window.
    pushAll(baseUrl);
  };
  window.addEventListener("online", onOnline);
  window.addEventListener("arenax:data-changed", onDataChanged as EventListener);

  return () => {
    window.clearInterval(pushTimer);
    window.clearInterval(pullTimer);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("arenax:data-changed", onDataChanged as EventListener);
    syncEnabled = false;
    syncHydrated = false;
    syncStarted = false;
  };
}
