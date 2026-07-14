# Vercel Deployment Checklist

This checklist ensures your project is properly configured for Vercel deployment.

## Prerequisites

- ✅ GitHub repository created
- ✅ Project pushed to GitHub
- ✅ Vercel account created

## Step 1: Backend Deployment (Express API)

### Environment Variables to Configure

```env
# Node Environment
NODE_ENV=production

# Database
MONGODB_URI=<your-mongodb-atlas-connection-string>

# JWT Secrets (Generate strong random strings)
JWT_ACCESS_SECRET=<generate-strong-random-string>
JWT_REFRESH_SECRET=<generate-strong-random-string>

# Encryption & Security
DELIVERY_SECRET_ENCRYPTION_KEY=<32-character-encryption-key>
CRON_SECRET=<secure-random-string>

# CORS & URLs (Replace with your frontend Vercel URL after frontend deployment)
FRONTEND_URL=https://<frontend-project>.vercel.app
CORS_ORIGIN=https://<frontend-project>.vercel.app

# Email Configuration (SMTP)
SMTP_HOST=<your-smtp-host>
SMTP_PORT=587
SMTP_USER=<your-smtp-username>
SMTP_PASS=<your-smtp-password>
EMAIL_FROM=noreply@yourdomain.com

# Object Storage (Cloudflare R2 or S3)
STORAGE_PROVIDER=s3
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<your-r2-access-key>
S3_SECRET_ACCESS_KEY=<your-r2-secret-key>
S3_BUCKET=<your-bucket-name>
S3_FORCE_PATH_STYLE=true
```

### Deployment Steps

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Framework Preset**: Select "Other" (Node.js)
4. **Root Directory**: Leave as `./` (default)
5. **Build Command**: `npm install`
6. **Install Command**: Leave default
7. **Output Directory**: Leave empty
8. **Environment Variables**: Add all variables from above
9. Click **Deploy**

### After Backend Deployment

- Note the Backend URL (e.g., `https://sevasetu-backend.vercel.app`)
- Update `FRONTEND_URL` and `CORS_ORIGIN` if they contain the backend URL
- If needed, redeploy backend with updated environment variables

---

## Step 2: Frontend Deployment (React + Vite)

### Environment Variables to Configure

```env
VITE_API_BASE_URL=https://<backend-project>.vercel.app/api/v1
```

### Deployment Steps

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same GitHub repository
3. **Framework Preset**: `Vite`
4. **Root Directory**: `frontend`
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. **Install Command**: Leave default
8. **Environment Variables**: Add `VITE_API_BASE_URL`
9. Click **Deploy**

### After Frontend Deployment

- Note the Frontend URL (e.g., `https://sevasetu-frontend.vercel.app`)
- Go back to Backend Environment Variables in Vercel
- Update `FRONTEND_URL` and `CORS_ORIGIN` with the Frontend URL
- Trigger a redeployment of the backend

---

## Step 3: Verify Deployment

### Backend Health Check

```bash
curl https://<backend-url>/
```

Expected response:
```json
{
  "success": true,
  "service": "Government Certificate Brokerage Service",
  "version": "v1",
  "basePath": "/api/v1"
}
```

### Frontend Accessibility

Open `https://<frontend-url>` in your browser and verify:
- Landing page loads correctly
- Navigation works
- API calls reach the backend (check Network tab in DevTools)

### API Connection Test

1. Go to Frontend
2. Try to register as a citizen
3. Verify:
   - Request reaches backend
   - Response contains expected data
   - No CORS errors in browser console

---

## Step 4: Configure External Services

### MongoDB Atlas

1. Create/access MongoDB Atlas cluster
2. Get connection string
3. Add IP whitelist for Vercel IPs:
   - Vercel: `0.0.0.0/0` (allow all, or use specific Vercel IPs if needed)

### Cloudflare R2 (Storage)

1. Create R2 bucket in Cloudflare Dashboard
2. Generate API token with Object Read & Write permissions
3. Restrict token to the specific bucket
4. Get endpoint URL, access key, and secret key

### SMTP Provider

1. Choose provider (Gmail, SendGrid, Resend, AWS SES, etc.)
2. Verify domain if required
3. Get SMTP credentials

---

## Step 5: Background Processing (Cron)

Your `vercel.json` is configured with:

```json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "*/15 * * * *"
  }]
}
```

This runs every 15 minutes to:
- Process delivery jobs
- Send queued emails
- Handle retries and dead-letter messages

**Ensure `CRON_SECRET` matches** in environment variables for security.

---

## Step 6: Document Upload Testing

After deployment, verify the document storage flow:

1. **As Citizen**: Upload a test document
2. **Check R2 Bucket**: Verify file appears in Cloudflare R2
3. **As Agent**: Request access to the document
4. **Verify Access**: Signed URL works and document is accessible
5. **Check Expiry**: URL expires after configured time (prevents permanent public access)

---

## Step 7: Email Testing

1. Register a new citizen account
2. Check email (may go to spam initially)
3. Verify email contains:
   - Verification link
   - Correct frontend URL
4. Click verification link and verify it works

---

## Step 8: Troubleshooting Common Issues

### CORS Errors
- ✅ Verify `CORS_ORIGIN` in backend matches frontend URL
- ✅ Redeploy backend after changing environment variables

### API Calls Failing
- ✅ Check Network tab for 404 or 500 errors
- ✅ Verify `VITE_API_BASE_URL` in frontend
- ✅ Check Vercel Function logs for backend errors

### Email Not Sending
- ✅ Verify SMTP credentials are correct
- ✅ Check spam folder
- ✅ Verify sender email is configured in SMTP provider
- ✅ Check backend logs for email errors

### Document Upload Fails
- ✅ Verify S3/R2 credentials
- ✅ Check bucket exists and is private
- ✅ Verify `S3_BUCKET` name is correct
- ✅ Check S3 endpoint URL format

### Database Connection Issues
- ✅ Verify MongoDB URI is correct
- ✅ Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- ✅ Verify database name in URI

---

## Step 9: Production Best Practices

- ✅ Store all secrets in Vercel Environment Variables (never in `.env`)
- ✅ Use strong random strings for JWT secrets (min 32 characters)
- ✅ Enable MongoDB IP address filtering once identified
- ✅ Set up monitoring in Vercel Dashboard
- ✅ Enable error tracking (e.g., Sentry)
- ✅ Test backup and restore procedures for database
- ✅ Document all environment variables with their purpose
- ✅ Set up alerts for failed deployments

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Node.js on Vercel](https://vercel.com/docs/runtimes/nodejs)
- [Project Deployment Guide](./DEPLOYMENT.md)

---

**Status**: Ready for Vercel Deployment ✅

All configuration files are in place. Follow the steps above to deploy to Vercel.
