import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8787);
const DB_FILE = process.env.SYNC_DB_FILE || path.join(__dirname, "sync-state.json");
const MEDIA_DIR = process.env.SYNC_MEDIA_DIR || path.join(__dirname, "media");
const HERO_VIDEO_FILE = path.join(MEDIA_DIR, "home-hero-video.bin");
const HERO_VIDEO_META_FILE = path.join(MEDIA_DIR, "home-hero-video-meta.json");
const DIST_DIR = path.resolve(__dirname, "../dist");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use("/media/files", express.static(MEDIA_DIR));
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ records: {} }, null, 2), "utf8");
  }
}

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "arenax-sync-server", at: new Date().toISOString() });
});

app.get("/sync/snapshot", (_req, res) => {
  const db = readDb();
  const records = Object.entries(db.records).map(([key, value]) => ({
    key,
    ts: Number(value?.ts || 0),
    value: typeof value?.value === "undefined" ? null : value.value,
  }));
  res.json({ records });
});

app.get("/media/home-hero-meta", (_req, res) => {
  ensureMediaDir();
  if (!fs.existsSync(HERO_VIDEO_FILE) || !fs.existsSync(HERO_VIDEO_META_FILE)) {
    return res.json({ exists: false });
  }
  try {
    const rawMeta = fs.readFileSync(HERO_VIDEO_META_FILE, "utf8");
    const meta = JSON.parse(rawMeta);
    return res.json({
      exists: true,
      name: meta.name || "home-hero-video",
      type: meta.type || "video/mp4",
      size: Number(meta.size || 0),
      updated_at: meta.updated_at || new Date().toISOString(),
    });
  } catch {
    return res.json({ exists: false });
  }
});

app.get("/media/home-hero", (_req, res) => {
  ensureMediaDir();
  if (!fs.existsSync(HERO_VIDEO_FILE) || !fs.existsSync(HERO_VIDEO_META_FILE)) {
    return res.status(404).json({ error: "No hero video" });
  }
  try {
    const rawMeta = fs.readFileSync(HERO_VIDEO_META_FILE, "utf8");
    const meta = JSON.parse(rawMeta);
    res.setHeader("Content-Type", meta.type || "video/mp4");
    res.setHeader("Cache-Control", "no-cache");
    return fs.createReadStream(HERO_VIDEO_FILE).pipe(res);
  } catch {
    return res.status(500).json({ error: "Failed to read hero video" });
  }
});

app.put(
  "/media/home-hero",
  express.raw({ type: "video/*", limit: "90mb" }),
  (req, res) => {
    ensureMediaDir();
    const body = req.body;
    if (!body || !Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: "Empty video payload" });
    }
    const contentType = req.header("content-type") || "video/mp4";
    const encodedName = req.header("x-file-name") || "hero-video";
    const fileName = decodeURIComponent(encodedName);

    try {
      fs.writeFileSync(HERO_VIDEO_FILE, body);
      fs.writeFileSync(
        HERO_VIDEO_META_FILE,
        JSON.stringify(
          {
            name: fileName,
            type: contentType,
            size: body.length,
            updated_at: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      );
      return res.json({ ok: true });
    } catch {
      return res.status(500).json({ error: "Failed to save hero video" });
    }
  }
);

app.delete("/media/home-hero", (_req, res) => {
  ensureMediaDir();
  try {
    if (fs.existsSync(HERO_VIDEO_FILE)) fs.unlinkSync(HERO_VIDEO_FILE);
    if (fs.existsSync(HERO_VIDEO_META_FILE)) fs.unlinkSync(HERO_VIDEO_META_FILE);
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Failed to delete hero video" });
  }
});

app.post(
  "/media/upload",
  express.raw({ type: "*/*", limit: "40mb" }),
  (req, res) => {
    ensureMediaDir();
    const body = req.body;
    if (!body || !Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({ error: "Empty upload payload" });
    }

    const encodedName = req.header("x-file-name") || "upload";
    const originalName = decodeURIComponent(encodedName);
    const scope = sanitizeScope(req.header("x-scope") || "uploads");
    const scopeDir = path.join(MEDIA_DIR, scope);
    if (!fs.existsSync(scopeDir)) fs.mkdirSync(scopeDir, { recursive: true });

    const ext = extFromName(originalName);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    const outputPath = path.join(scopeDir, fileName);
    try {
      fs.writeFileSync(outputPath, body);
      const publicUrl = `/media/files/${scope}/${fileName}`;
      return res.json({ ok: true, url: publicUrl, name: originalName, size: body.length });
    } catch {
      return res.status(500).json({ error: "Failed to save file" });
    }
  }
);

app.post("/sync/merge", (req, res) => {
  const incoming = Array.isArray(req.body?.records) ? req.body.records : [];
  const db = readDb();
  const current = db.records || {};

  for (const row of incoming) {
    const key = String(row?.key || "");
    if (!key) continue;
    const incomingTs = Number(row?.ts || 0);
    const existingTs = Number(current[key]?.ts || 0);
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
});
