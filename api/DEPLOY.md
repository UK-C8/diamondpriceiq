# API Deployment Notes

## Start command

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway and Render auto-detect the `Procfile`; no manual configuration needed.

## Run database migrations

Against a fresh Neon (or any Postgres) instance:

```bash
# From the /api directory, with DATABASE_URL set in your shell:
export DATABASE_URL="postgresql+asyncpg://user:pass@host/db?ssl=require"
alembic upgrade head
```

This applies all migrations in `migrations/versions/` in order.
There is currently one migration: `0001_create_query_logs.py`.

## Model artifacts

The four `.joblib` files in `model/artifacts/` (≈ 12 MB total) are committed to
the repo and copied into the deploy image automatically.  No external storage
is required at this scale.

If you ever move artifacts out of the repo, set `MODEL_DIR` to the path where
they are mounted/downloaded.  The service raises `RuntimeError` at startup with
a clear message listing the missing files — it will **not** start silently with
broken inference.

## Required environment variables

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | Yes | `postgresql+asyncpg://user:pass@host/db?ssl=require` |
| `MODEL_DIR` | Yes | `/app/model/artifacts` |
| `ALLOWED_ORIGINS` | Yes | `https://diamondpriceiq.com,https://www.diamondpriceiq.com` |
| `RATE_LIMIT_PER_MINUTE` | No (default 30) | `60` |
| `MODEL_VERSION` | No (default 0.1.0) | `0.1.0` |
| `LOG_LEVEL` | No (default INFO) | `INFO` |

See `.env.example` for descriptions of every variable.
