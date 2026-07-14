# Technical Architecture: SevaSetu

## High-Level Architecture Overview
SevaSetu operates as a decoupled, full-stack web application optimized for serverless deployments on Vercel.

- **Frontend:** A React Single Page Application (SPA) built with Vite, serving static assets globally via Vercel Edge Network.
- **Backend:** A Node.js REST API built on Express.js, deployed as serverless functions.
- **Database:** MongoDB Atlas (DBaaS) configured for heavy read/write concurrency and connection pooling optimization for serverless functions.
- **Storage:** Cloudflare R2 providing S3-compatible private object storage for user documents.
- **Background Jobs:** A persistent Outbox Pattern polling worker executing via Vercel Cron.

## 1. Backend Architecture (Node.js/Express)
The backend enforces a strict layered architecture:

- **Routes (`src/modules/**/*.routes.js`):** Maps HTTP endpoints to specific controller methods. Applies authentication and RBAC middleware.
- **Controllers (`src/modules/**/*.controller.js`):** Handles HTTP request parsing, response formatting, and validation delegation.
- **Services (`src/modules/**/*.service.js`):** Contains the core business logic. Enforces workflows, transactional integrity, and calls repositories.
- **Repositories (`src/modules/**/*.repository.js`):** Abstracts direct Mongoose queries, providing an interface for data access.

## 2. Serverless Topology (Vercel)
Deploying persistent Node.js workers on Vercel is unsupported. To solve this:
1. **API Endpoints:** Standard Express routes are wrapped by Vercel serverless functions in `api/index.js`.
2. **MongoDB Connection Caching:** Global variables cache the MongoDB connection to prevent exhausting connections during cold-start bursts.
3. **Cron Architecture:** Vercel Cron invokes a secure, authenticated endpoint (`/api/v1/jobs/process-outbox`) on a schedule to drain the outbox queue, guaranteeing eventual execution of background tasks (emails, notifications).

## 3. Storage Architecture (Cloudflare R2)
- Local storage is supported via `multer` for development (`storageProvider: 'local'`).
- Production uses the `@aws-sdk/client-s3` package configured with Cloudflare R2 credentials.
- **Security:** R2 buckets are completely private. Files are accessed by generating short-lived **Signed URLs** ensuring only authorized users can view uploaded certificates.

## 4. Security Schema
- **RBAC:** Roles (`CITIZEN`, `AGENT`, `ADMIN`) are strictly enforced via the `authorizeRoles` middleware.
- **IDOR Prevention:** Service methods check that the `ownerUser` matches the `req.user.id` unless the requester is an Admin or Assigned Agent.
- **Optimistic Concurrency:** Mongoose `__v` keys are incremented on save to prevent race conditions during concurrent status updates.

## 5. Background Jobs (Outbox Pattern)
To ensure reliable delivery of emails and notifications:
1. Business logic writes an `OutboxEvent` to the database within the same transaction (or synchronously).
2. The Vercel Cron endpoint securely queries pending `OutboxEvent` documents.
3. The worker executes the task (e.g., sending an SMTP email).
4. The event is marked `PROCESSED`.
5. **Idempotency:** A unique `idempotencyKey` ensures duplicate events are not created.
