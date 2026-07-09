# SevaSetu Production Deployment Guide

## Architecture Decision: Two Vercel Projects
To ensure Vercel reliably serves the Vite frontend SPA independently of the Express backend API without conflicting build pipelines, **SevaSetu must be deployed as two separate Vercel projects**.

### 1. Frontend Project
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Required Env Variables**:
  - `VITE_API_BASE_URL`: The production URL of the deployed Backend Project.

### 2. Backend Project
- **Framework Preset**: Other / Node.js
- **Root Directory**: `./` (Repository Root)
- **Build Command**: `npm install`
- **Output Directory**: (Leave blank/default)
- **Vercel Config**: Driven by `vercel.json` wildcard rewrite to `/api/index.js`.
- **Required Env Variables**:
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: Atlas connection string
  - `JWT_ACCESS_SECRET`: Secret key for access token
  - `JWT_REFRESH_SECRET`: Secret key for refresh token
  - `DELIVERY_SECRET_ENCRYPTION_KEY`: 32-character encryption key
  - `CRON_SECRET`: Secure string used to authorize Vercel Cron jobs
  - `FRONTEND_URL`: URL of the deployed Frontend Project
  - `CORS_ORIGIN`: URL of the deployed Frontend Project
  - `STORAGE_PROVIDER`: `s3`
  - `S3_REGION`: Region of the S3 bucket
  - `S3_ENDPOINT`: Custom endpoint (optional, e.g., Cloudflare R2 / MinIO)
  - `S3_ACCESS_KEY_ID`: S3 credentials
  - `S3_SECRET_ACCESS_KEY`: S3 credentials
  - `S3_BUCKET`: Name of bucket
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`: SMTP configuration

## Background Processing (Cron)
Vercel serverless functions are ephemeral and cannot run a persistent `worker.js`. 
Instead, `vercel.json` configures a cron job calling `/api/cron` every 15 minutes. 
- You MUST configure `CRON_SECRET` in Vercel to match the one deployed in the environment variables. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` in cron requests.
- The cron safely executes `deliveryWorker.runOnce()` and `schedulerWorker.runOnce()` sequentially in a bounded time budget, picking up `DEAD_LETTER` retries, processing email queues, and running scheduled state changes.

## Object Storage (S3 Migration)
The local `/storage` directory is ephemeral on Vercel. 
- You must configure `STORAGE_PROVIDER=s3`.
- Any existing local files created before migration must be manually uploaded to the S3 bucket root using the exact same filename. Since the system merely references the UUID-based filename, no database migration script is necessary; S3 objects with the same key will seamlessly serve existing records.

## Rollback Procedure
If deployment fails, redeploy the previous successful build from the Vercel Dashboard. The backend architecture modifications are highly backward-compatible with local `server.js` startup and test environments, so standard Vercel rollbacks are safe.
