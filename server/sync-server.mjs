import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { createRequestToPay, getRequestToPayStatus } from "../functions/mtnMomo.js";
import {
  cloudinaryEnabled,
  uploadBufferToCloudinary,
  deleteCloudinaryAsset,
} from "./cloudinary.js";
import { isMailerEnabled, sendPasswordResetEmail } from "./mailer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const DB_FILE_CONFIG = process.env.SYNC_DB_FILE || path.join(__dirname, "sync-state.json");
const FRONTEND_URL = (process.env.FRONTEND_URL || "").trim();
const ALLOWED_ORIGINS = FRONTEND_URL
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const DIST_DIR = path.resolve(__dirname, "../dist");
const HERO_META_KEY = "home_hero_media_meta";
const ACCOUNTS_KEY = "arenax_user_accounts";
const PRESENCE_KEY = "arenax_user_presence";
const RESET_TOKEN_TTL_MS = Number(process.env.RESET_TOKEN_TTL_MINUTES || 30) * 60 * 1000;

let DB_FILE = DB_FILE_CONFIG;

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.length === 0) {
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "25mb" }));

function resolveWritablePaths() {
  const fallbackDb = path.join(__dirname, ".runtime", "sync-state.json");

  try {
    const dbDir = path.dirname(DB_FILE_CONFIG);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    fs.writeFileSync(path.join(dbDir, ".write-test"), "ok", "utf8");
    fs.unlinkSync(path.join(dbDir, ".write-test"));
    DB_FILE = DB_FILE_CONFIG;
  } catch {
    const dbDir = path.dirname(fallbackDb);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    DB_FILE = fallbackDb;
  }
}

resolveWritablePaths();
if (fs.existsSync(DIST_DIR)) app.use(express.static(DIST_DIR));

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ records: {} }, null, 2), "utf8");
  }
}

function sanitizeScope(input) {
  const base = String(input || "uploads").toLowerCase();
  return base.replace(/[^a-z0-9_-]/g, "_");
}

function extFromName(name) {
  const ext = path.extname(String(name || "")).toLowerCase();
  return ext && ext.length <= 8 ? ext : "";
}

function readDb() {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return parsed?.records && typeof parsed.records === "object" ? parsed : { records: {} };
  } catch {
    return { records: {} };
  }
}

function writeDb(data) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function getHeroMeta() {
  const db = readDb();
  const row = db.records?.[HERO_META_KEY]?.value;
  return row && typeof row === "object" ? row : null;
}

function setHeroMeta(meta) {
  const db = readDb();
  db.records[HERO_META_KEY] = {
    ts: Date.now(),
    value: meta,
  };
  writeDb(db);
}

function clearHeroMeta() {
  const db = readDb();
  delete db.records[HERO_META_KEY];
  writeDb(db);
}

function readAccounts() {
  const db = readDb();
  const raw = db.records?.[ACCOUNTS_KEY]?.value;
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts) {
  const db = readDb();
  db.records[ACCOUNTS_KEY] = {
    ts: Date.now(),
    value: JSON.stringify(accounts),
  };
  writeDb(db);
}

function createResetToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

function readPresenceMap() {
  const db = readDb();
  const raw = db.records?.[PRESENCE_KEY]?.value;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const list = Array.isArray(parsed) ? parsed : [];
    const now = Date.now();
    const activeWindowMs = 35_000;
    const map = new Map();
    list.forEach((row) => {
      const email = String(row?.email || "").trim().toLowerCase();
      if (!email) return;
      const lastSeen = new Date(row?.last_seen || row?.updated_at || 0).getTime();
      const online = Boolean(row?.online) && Number.isFinite(lastSeen) && now - lastSeen <= activeWindowMs;
      map.set(email, { online, last_seen: row?.last_seen || row?.updated_at || "" });
    });
    return map;
  } catch {
    return new Map();
  }
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "arenax-sync-server",
    at: new Date().toISOString(),
    db_file: DB_FILE,
    cloudinary_enabled: cloudinaryEnabled,
    frontend_url: FRONTEND_URL || null,
  });
});

app.post("/payments/initiate-momo", async (req, res) => {
  try {
    const { phone_number, amount, currency, name, tournament_name, tx_ref } = req.body || {};
    const payment = await createRequestToPay({
      phoneNumber: phone_number,
      amount,
      currency: currency || "RWF",
      externalId: tx_ref,
      payerMessage: `ArenaX ${tournament_name || "Tournament"} entry`,
      payeeNote: `Paid by ${name || "Player"}`,
    });

    return res.json({
      success: true,
      status: payment.status,
      tx_ref,
      momo_request_id: payment.referenceId,
      currency: payment.effectiveCurrency,
      requested_currency: payment.requestedCurrency,
      sandbox_currency_adjusted: payment.sandboxCurrencyAdjusted,
      data: {
        id: payment.referenceId,
        tx_ref,
      },
    });
  } catch (error) {
    console.error("[payments/initiate-momo]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "mtn_momo_request_failed",
    });
  }
});

app.post("/payments/verify-momo", async (req, res) => {
  try {
    const { transaction_id, tx_ref } = req.body || {};
    const requestId = transaction_id || tx_ref;
    if (!requestId) {
      return res.status(400).json({ success: false, status: "missing_request_id" });
    }

    const data = await getRequestToPayStatus(requestId);
    const status = String(data?.status || "").toUpperCase();
    return res.json({
      success: status === "SUCCESSFUL",
      status,
      amount: data?.amount,
      currency: data?.currency,
      tx_ref: data?.externalId || tx_ref || null,
      momo_transaction_id: requestId,
      financial_transaction_id: data?.financialTransactionId || null,
      payer: data?.payer || null,
      payer_message: data?.payerMessage || null,
      payee_note: data?.payeeNote || null,
    });
  } catch (error) {
    console.error("[payments/verify-momo]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "mtn_momo_verify_failed",
    });
  }
});

app.post("/payments/verify", async (req, res) => {
  try {
    const { transaction_id, tx_ref } = req.body || {};
    const requestId = transaction_id || tx_ref;
    if (!requestId) {
      return res.status(400).json({ success: false, status: "missing_request_id" });
    }

    const data = await getRequestToPayStatus(requestId);
    const status = String(data?.status || "").toUpperCase();
    return res.json({
      success: status === "SUCCESSFUL",
      status,
      amount: data?.amount,
      currency: data?.currency,
      tx_ref: data?.externalId || tx_ref || null,
      momo_transaction_id: requestId,
      financial_transaction_id: data?.financialTransactionId || null,
    });
  } catch (error) {
    console.error("[payments/verify]", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "mtn_momo_verify_failed",
    });
  }
});

app.get("/users/search", (req, res) => {
  const q = String(req.query?.q || "").trim().toLowerCase();
  if (q.length < 2) {
    return res.json({ users: [] });
  }

  try {
    const accounts = readAccounts();
    const presence = readPresenceMap();
    const users = accounts
      .filter((item) => item?.email_verified)
      .filter((item) => {
        const fullName = String(item?.full_name || "").toLowerCase();
        const handle = String(item?.handle || "").toLowerCase();
        const email = String(item?.email || "").toLowerCase();
        return fullName.includes(q) || handle.includes(q) || email.includes(q);
      })
      .slice(0, 25)
      .map((item) => {
        const email = String(item?.email || "").toLowerCase();
        const p = presence.get(email) || { online: false, last_seen: "" };
        return {
          id: String(item?.id || ""),
          full_name: String(item?.full_name || ""),
          handle: item?.handle || "",
          email,
          avatar_url: item?.avatar_url || "",
          online: Boolean(p.online),
          last_seen: p.last_seen || "",
        };
      });
    return res.json({ users });
  } catch (error) {
    console.error("[users/search]", error);
    return res.status(500).json({ users: [] });
  }
});

app.post("/auth/forgot-password", async (req, res) => {
  const normalizedEmail = String(req.body?.email || "").trim().toLowerCase();
  const genericMessage = "If this email is registered, a reset link has been sent.";
  if (!isMailerEnabled) {
    return res.status(503).json({
      ok: false,
      error: "Email service is not configured. Contact support.",
    });
  }
  if (!normalizedEmail) {
    return res.json({ ok: true, message: genericMessage });
  }

  try {
    const accounts = readAccounts();
    const index = accounts.findIndex(
      (item) => String(item?.email || "").trim().toLowerCase() === normalizedEmail
    );

    if (index >= 0) {
      const { rawToken, tokenHash } = createResetToken();
      const account = accounts[index];
      accounts[index] = {
        ...account,
        password_reset_token: tokenHash,
        password_reset_expires: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      };
      writeAccounts(accounts);

      const frontendBase = FRONTEND_URL || "http://localhost:8080";
      const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(
        rawToken
      )}&id=${encodeURIComponent(String(account.id || ""))}`;

      await sendPasswordResetEmail({
        to: normalizedEmail,
        resetUrl,
      });
    }

    return res.json({ ok: true, message: genericMessage });
  } catch (error) {
    console.error("[auth/forgot-password]", error);
    return res.status(500).json({
      ok: false,
      error: "Could not send reset email right now. Please try again.",
    });
  }
});

app.post("/auth/reset-password", (req, res) => {
  const userId = String(req.body?.userId || "").trim();
  const rawToken = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.password || "");

  if (!userId || !rawToken || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, error: "Invalid reset payload." });
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  try {
    const accounts = readAccounts();
    const index = accounts.findIndex((item) => String(item?.id || "") === userId);
    if (index < 0) {
      return res.status(400).json({ ok: false, error: "Invalid or expired token." });
    }

    const account = accounts[index];
    const expiresAt = new Date(account?.password_reset_expires || 0).getTime();
    const tokenValid = account?.password_reset_token === tokenHash;
    const notExpired = Number.isFinite(expiresAt) && expiresAt > Date.now();

    if (!tokenValid || !notExpired) {
      return res.status(400).json({ ok: false, error: "Invalid or expired token." });
    }

    accounts[index] = {
      ...account,
      password: newPassword,
      password_reset_token: "",
      password_reset_expires: "",
      session_revoked_at: new Date().toISOString(),
    };
    writeAccounts(accounts);

    return res.json({ ok: true, message: "Password has been reset successfully." });
  } catch (error) {
    console.error("[auth/reset-password]", error);
    return res.status(500).json({ ok: false, error: "Could not reset password." });
  }
});

app.get("/sync/snapshot", (_req, res) => {
  const db = readDb();
  const now = Date.now();
  const maxSkewMs = 5 * 60 * 1000;
  const records = Object.entries(db.records).map(([key, value]) => ({
    key,
    ts: Math.min(Number(value?.ts || 0), now + maxSkewMs),
    value: typeof value?.value === "undefined" ? null : value.value,
  }));
  res.json({ records });
});

app.get("/media/home-hero-meta", (_req, res) => {
  const meta = getHeroMeta();
  if (!meta?.url) {
    return res.json({ exists: false });
  }
  return res.json({
    exists: true,
    name: meta.name || "home-hero-video",
    type: meta.type || "video/mp4",
    size: Number(meta.size || 0),
    updated_at: meta.updated_at || new Date().toISOString(),
    url: meta.url,
    public_id: meta.public_id || "",
    resource_type: meta.resource_type || "video",
  });
});

app.get("/media/home-hero", (_req, res) => {
  const meta = getHeroMeta();
  if (!meta?.url) {
    return res.status(404).json({ error: "No hero video" });
  }
  return res.redirect(meta.url);
});

app.put(
  "/media/home-hero",
  express.raw({ type: "video/*", limit: "90mb" }),
  async (req, res) => {
    if (!cloudinaryEnabled) {
      return res.status(500).json({ error: "Cloudinary is not configured" });
    }

    const body = req.body;
    if (!body || !Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: "Empty video payload" });
    }
    const contentType = req.header("content-type") || "video/mp4";
    const encodedName = req.header("x-file-name") || "hero-video.mp4";
    const fileName = decodeURIComponent(encodedName);

    try {
      const uploaded = await uploadBufferToCloudinary({
        buffer: body,
        folder: "arenax/home",
        publicId: "home-hero-video",
        resourceType: "video",
        overwrite: true,
        invalidate: true,
        filename: fileName,
      });

      const meta = {
        name: fileName,
        type: contentType,
        size: Number(uploaded?.bytes || body.length),
        updated_at: new Date().toISOString(),
        url: uploaded?.secure_url || uploaded?.url || "",
        public_id: uploaded?.public_id || "arenax/home/home-hero-video",
        resource_type: uploaded?.resource_type || "video",
      };
      setHeroMeta(meta);

      return res.json({ ok: true, url: meta.url, public_id: meta.public_id });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to save hero video",
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
);

app.delete("/media/home-hero", async (_req, res) => {
  try {
    const meta = getHeroMeta();
    if (meta?.public_id) {
      await deleteCloudinaryAsset(meta.public_id, "video");
    }
    clearHeroMeta();
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete hero video",
      detail: error instanceof Error ? error.message : "unknown_error",
    });
  }
});

app.post(
  "/media/upload",
  express.raw({ type: "*/*", limit: "40mb" }),
  async (req, res) => {
    if (!cloudinaryEnabled) {
      return res.status(500).json({ error: "Cloudinary is not configured" });
    }

    const body = req.body;
    if (!body || !Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: "Empty upload payload" });
    }

    const encodedName = req.header("x-file-name") || "upload";
    const originalName = decodeURIComponent(encodedName);
    const scope = sanitizeScope(req.header("x-scope") || "uploads");
    const ext = extFromName(originalName);
    const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;

    try {
      const uploaded = await uploadBufferToCloudinary({
        buffer: body,
        folder: `arenax/${scope}`,
        publicId,
        resourceType: "auto",
        overwrite: false,
        invalidate: true,
        filename: originalName,
      });

      const permanentUrl = uploaded?.secure_url || uploaded?.url;
      if (!permanentUrl) {
        return res.status(500).json({ error: "Cloudinary upload did not return URL" });
      }

      return res.json({
        ok: true,
        url: permanentUrl,
        name: originalName,
        size: Number(uploaded?.bytes || body.length),
        public_id: uploaded?.public_id || null,
        resource_type: uploaded?.resource_type || null,
      });
    } catch (error) {
      return res.status(500).json({
        error: "Failed to upload file",
        detail: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }
);

app.post("/sync/merge", (req, res) => {
  const incoming = Array.isArray(req.body?.records) ? req.body.records : [];
  const db = readDb();
  const current = db.records || {};
  const now = Date.now();
  const maxSkewMs = 5 * 60 * 1000;

  for (const row of incoming) {
    const key = String(row?.key || "");
    if (!key) continue;
    const incomingTsRaw = Number(row?.ts || 0);
    const incomingTs = Math.min(incomingTsRaw, now + maxSkewMs);
    const existingTsRaw = Number(current[key]?.ts || 0);
    const existingTs = existingTsRaw > now + maxSkewMs ? 0 : existingTsRaw;
    if (incomingTs >= existingTs) {
      current[key] = {
        ts: incomingTs,
        value: typeof row?.value === "undefined" ? null : row.value,
      };
    }
  }

  writeDb({ records: current });
  res.json({ ok: true, merged: incoming.length });
});

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/sync/") || req.path.startsWith("/media/") || req.path === "/health") {
    return next();
  }
  if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
    return res.status(404).send("Frontend build not found. Run `npm run build` first.");
  }
  return res.sendFile(path.join(DIST_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`ArenaX sync server running on http://localhost:${PORT}`);
  console.log(`State file: ${DB_FILE}`);
  console.log(`Cloudinary: ${cloudinaryEnabled ? "enabled" : "disabled"}`);
  console.log(`CORS origin: ${FRONTEND_URL || "<not configured>"}`);
});
