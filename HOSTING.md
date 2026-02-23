# ArenaX Hosting (Persistent Global State)

This project is now deployable as **one Node service**:
- serves frontend (`dist`)
- serves sync API (`/sync/*`)
- serves media uploads (`/media/*`)

This ensures admin changes (games, tournaments, backgrounds, hero video, etc.) are shared across devices and remain after browser reopen.

## Option A: Render (Recommended)

1. Push this repo to GitHub.
2. In Render, create Blueprint from repo (it will read `render.yaml`).
3. Deploy.

The included `render.yaml` already sets:
- build: `npm install && npm run build`
- start: `npm run start:prod`
- health check: `/health`
- persistent disk mount `/var/data`
- state file: `/var/data/sync-state.json`
- media dir: `/var/data/media`

After deploy, open the app URL and test:
- Admin creates/updates game/tournament
- Open same URL on another device/browser
- change appears globally

## Option B: VPS / Docker-less Node

```bash
npm install
npm run build
SYNC_DB_FILE=/absolute/path/sync-state.json SYNC_MEDIA_DIR=/absolute/path/media npm run start:prod
```

Use a process manager (`pm2`) and reverse proxy (`nginx`) for production.

## Notes

- `VITE_SYNC_API_BASE_URL` is optional in single-service hosting.
- If you split frontend and API into separate domains, set `VITE_SYNC_API_BASE_URL` to API URL.
- Persistence depends on server disk durability.
