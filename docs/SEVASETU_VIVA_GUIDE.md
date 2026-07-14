# Viva Guide & Pitch Prep: SevaSetu

## Elevator Pitches

### 30 Seconds
SevaSetu is a secure, serverless digital platform that bridges the gap between citizens and government services. It digitizes the application process for official certificates by connecting users with verified agents who handle verification, corrections, and physical handover via a secure COD workflow, all deployed on Vercel with Cloudflare R2 storage.

### 2 Minutes
Government procedures are often plagued by fragmented portals and unreliable local brokers. SevaSetu replaces this chaotic ecosystem with a structured platform featuring three roles: Citizens, Agents, and Admins. Citizens can seamlessly apply for services like Birth or Domicile Certificates, upload required proofs securely, and track their application lifecycle. Verified Agents are assigned these requests to perform document validation and physical field checks, generating official reports. Our architecture leverages Node.js serverless functions on Vercel, MongoDB Atlas for data, and Cloudflare R2 for secure, signed-URL document storage. We handle background jobs using a persistent Outbox pattern, ensuring reliable notifications without relying on traditional persistent daemons.

## Anticipated Architecture Questions

**Q: Why did you choose Vercel Serverless over a traditional VPS or EC2 instance?**
*Answer:* Vercel offers zero-maintenance scaling and edge delivery for the React frontend. However, it presented challenges for background jobs since serverless functions die immediately after returning a response. We solved this by implementing an Outbox Pattern paired with a Vercel Cron endpoint, allowing us to process asynchronous emails and notifications reliably without a persistent server.

**Q: How are you securing the sensitive identity documents uploaded by citizens?**
*Answer:* Files are not stored on the web server or exposed publicly. They are uploaded to Cloudflare R2 (S3-compatible object storage) in private buckets. When an authorized Agent or Admin needs to view a document, the backend generates a short-lived, pre-signed URL via the AWS SDK. Additionally, strict IDOR (Insecure Direct Object Reference) checks ensure users cannot request URLs for documents they do not own or manage.

**Q: Explain how the Outbox Pattern works in your Background Jobs.**
*Answer:* Instead of sending an email directly within an HTTP request (which might fail and leave the database in an inconsistent state), we wrap the database update and an `OutboxEvent` creation in a single transaction (or synchronous block). A Vercel Cron job periodically pings a protected endpoint (`/api/v1/jobs/process-outbox`), which reads pending events, executes the task (like SMTP emails), and marks them `PROCESSED`.

**Q: What is the Cash-on-Delivery (COD) workflow and why didn't you use Razorpay/Stripe?**
*Answer:* We implemented a COD workflow to demonstrate complex state machine handling in physical logistics (`READY_FOR_DISPATCH` → `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED`). Online payment gateways are planned for the medium-term roadmap, but modeling the offline payment collection during secure physical handover proved our capability to map digital states to real-world agent actions.

**Q: How does the application handle Database connection pooling in a Serverless environment?**
*Answer:* We cache the Mongoose connection object in the global Node scope. When a serverless function spins up, it checks if `global.mongoose.conn` exists. If so, it reuses the connection pool instead of opening a new TCP connection to MongoDB, preventing database connection exhaustion during traffic bursts.

## Difficult Grilling Questions

**Q: Are you actually integrating with government databases like Aadhaar?**
*Answer:* No. SevaSetu is a demonstration of the *workflow* and *management* software that would facilitate such services. Actual B2G (Business-to-Government) API integration requires legal authorization.

**Q: If I upload a document and the agent rejects it, is the document permanently deleted?**
*Answer:* No. We enforce an audit trail. The original document is marked as `isSuperseded = true` and we link the new replacement document to it. We use soft-deletes (`deletedAt`) to maintain historical consistency for fraud prevention and auditing.
