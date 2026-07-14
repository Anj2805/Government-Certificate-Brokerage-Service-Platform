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
- **Vercel Config**: Driven by `vercel.json` wildcard rewrite to `/api`, which invokes the Express serverless function.
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

## Object Storage (Cloudflare R2 Migration)
The local `/storage` directory is ephemeral on Vercel. You must configure Cloudflare R2 (or an S3-compatible alternative).

### Cloudflare R2 Setup
1. Create a **private bucket** in the Cloudflare Dashboard.
2. Generate an **Account API token** with **Object Read & Write** permissions.
3. Restrict the token exclusively to the SevaSetu bucket.
4. Note your S3-compatible endpoint.

### Backend-Only Credential Placement
Never expose storage credentials to the frontend. Configure these strictly in the Backend Vercel project environment variables (and your local `.env`):
- `STORAGE_PROVIDER=s3`
- `S3_REGION=auto`
- `S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `S3_ACCESS_KEY_ID=<YOUR_TOKEN_ACCESS_KEY>`
- `S3_SECRET_ACCESS_KEY=<YOUR_TOKEN_SECRET_KEY>`
- `S3_BUCKET=<YOUR_BUCKET_NAME>`
- `S3_FORCE_PATH_STYLE=true` (Required for R2 depending on SDK version)

**Note**: You must trigger a redeployment in Vercel after changing environment variables.

### Real-Provider Smoke Test Procedure
After deployment, verify the integration by uploading a harmless test document as a Citizen and ensuring the file appears in the R2 bucket. Verify download access and ensure unassigned Agents cannot download it.

### Key Rotation & Revocation
If credentials are leaked, immediately revoke the API token in the Cloudflare Dashboard, generate a new token, update your Vercel Environment Variables, and trigger a redeployment.

### Legacy Document Migration
Any existing local files created before migration must be manually uploaded to the R2 bucket root using the exact same filename. Since the system merely references the UUID-based filename, no database migration script is necessary; R2 objects with the same key will seamlessly serve existing records.

## Rollback Procedure
If deployment fails, redeploy the previous successful build from the Vercel Dashboard. The backend architecture modifications are highly backward-compatible with local `server.js` startup and test environments, so standard Vercel rollbacks are safe.
