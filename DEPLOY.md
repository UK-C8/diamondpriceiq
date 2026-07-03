# DiamondPrice IQ — Deployment Guide

Three services, deployed in this order:
1. **Neon Postgres** (database)
2. **FastAPI inference API** on Railway or Render
3. **Next.js frontend** on Vercel

The frontend needs the live API URL, so the API must be deployed first.

---

## 1. Neon Postgres

### Create the database

1. Sign up / log in at [neon.tech](https://neon.tech).
2. Create a new project — region closest to your API host (e.g. AWS `us-east-1`).
3. Create a database named `diamondpriceiq`.
4. Copy the **connection string** from the Neon dashboard.  It looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/diamondpriceiq?sslmode=require
   ```
5. For the FastAPI `asyncpg` driver, change the scheme to `postgresql+asyncpg`:
   ```
   postgresql+asyncpg://user:pass@ep-xxx.us-east-1.aws.neon.tech/diamondpriceiq?ssl=require
   ```

### Run migrations

From the `/api` directory on your local machine (or in a Railway one-off command):

```bash
export DATABASE_URL="postgresql+asyncpg://user:pass@ep-xxx...neon.tech/diamondpriceiq?ssl=require"
cd api
pip install -r requirements.txt
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 0001, create query_logs table
```

---

## 2. FastAPI API — Railway

### Deploy

1. In Railway, create a new project → **"Deploy from GitHub repo"** → select this repo.
2. Set the **root directory** to `/api`.
3. Railway auto-detects the `Procfile` and uses:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
4. Set the following environment variables in the Railway service settings:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@ep-xxx.neon.tech/diamondpriceiq?ssl=require` |
| `MODEL_DIR` | `/app/model/artifacts` |
| `ALLOWED_ORIGINS` | `https://diamondpriceiq.com,https://www.diamondpriceiq.com` (add Vercel preview URL too during rollout) |
| `RATE_LIMIT_PER_MINUTE` | `30` |
| `MODEL_VERSION` | `0.1.0` |
| `LOG_LEVEL` | `INFO` |

5. After the first deploy completes, copy the Railway-assigned public URL (e.g. `https://diamondpriceiq-api.up.railway.app`).

### Verify API health

```bash
curl https://diamondpriceiq-api.up.railway.app/v1/health
```

Expected response (`200 OK`):
```json
{"status": "ok", "model_loaded": true, "db_reachable": true, "model_version": "0.1.0"}
```

If `db_reachable` is `false`, check `DATABASE_URL` and that Neon's IP-allow list includes Railway's egress IPs (or is set to allow all).

---

## 3. Next.js Frontend — Vercel

### Deploy

1. In Vercel, **"Add New Project"** → import the GitHub repo.
2. Set the **root directory** to `/web`.
3. Framework preset: **Next.js** (auto-detected).
4. Set the following environment variables in Vercel project settings:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://diamondpriceiq-api.up.railway.app` (your Railway URL, no trailing slash) |
| `NEXT_PUBLIC_GA4_ID` | `G-XXXXXXXXXX` (your GA4 measurement ID, or leave blank) |
| `CRM_WEBHOOK_URL` | Your CRM webhook endpoint, or leave blank to log-only |

5. Deploy.

### Custom domain

In Vercel → Settings → Domains, add `diamondpriceiq.com` and `www.diamondpriceiq.com`.
Then go back to Railway and add both to `ALLOWED_ORIGINS` (comma-separated, no trailing slash).

---

## 4. Post-deploy verification checklist

Run these against your live URLs after all three services are up:

### API smoke tests

```bash
API=https://diamondpriceiq-api.up.railway.app

# Health
curl -s $API/v1/health | python3 -m json.tool

# Single-stone estimate
curl -s -X POST $API/v1/estimate \
  -H "Content-Type: application/json" \
  -d '{"stone":{"carat":1.0,"cut":"Ideal","color":"G","clarity":"VS1"}}' \
  | python3 -m json.tool

# Parcel estimate (2 stones)
curl -s -X POST $API/v1/estimate \
  -H "Content-Type: application/json" \
  -d '{"stones":[{"carat":0.5,"cut":"Good","color":"H","clarity":"SI1"},{"carat":1.2,"cut":"Ideal","color":"F","clarity":"VVS2"}]}' \
  | python3 -m json.tool
```

Expected: both estimate responses have `estimate.band.low`, `mid`, `high` > 0 and `confidence_level` in `["high","medium","low"]`.

### Frontend smoke tests

Open `https://diamondpriceiq.com` (or your Vercel preview URL) and verify:

- [ ] Landing page loads, DiamondIcon visible, Oxygen font renders
- [ ] Enter `1.00ct / Ideal / G / VS1` → click "Get price" → price band appears within 10s
- [ ] "Fair deal?" checker: enter a price → verdict shown
- [ ] Switch to Parcel mode → add 2 rows → run → per-stone + total shown
- [ ] Enter email in PDF section → PDF downloads
- [ ] Share card generates
- [ ] `/methodology` page loads with ClarityPriceChart
- [ ] `/privacy` page loads and "Back to estimator" link works
- [ ] `/v1/health` on the API returns `"status": "ok"` with `model_loaded: true` and `db_reachable: true`

---

## Rollback

- **API**: Railway → Deployments → click any previous deploy → "Redeploy".
- **Frontend**: Vercel → Deployments → "Instant Rollback" to the previous production deployment.
- **Database**: no rollback needed for Neon; query logs are append-only. To roll back a migration: `alembic downgrade -1`.

---

## Redeployment order for future changes

| Change type | Services to redeploy |
|---|---|
| Frontend-only (UI, copy) | Vercel only |
| API-only (model, rate limits) | Railway only |
| New migration | Run `alembic upgrade head` first, then redeploy Railway |
| Both | DB migration → Railway → Vercel |
