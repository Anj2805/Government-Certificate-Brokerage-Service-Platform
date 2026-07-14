# SevaSetu Project Summary Report

## 1. Project Introduction
**SevaSetu** is a comprehensive, web-based Government Certificate & Brokerage Service Platform designed to bridge the gap between citizens and public services. It enables citizens to request official documents (e.g., Birth Certificates, Income Certificates, Domicile Certificates) without navigating complex government portals or waiting in physical lines. Verified agents facilitate the processing, document verification, and secure physical handover of these certificates.

### The Problem It Solves
Accessing government services often involves fragmented information, unreliable local brokers, opaque processing statuses, and inconvenient physical visits. SevaSetu centralizes this by providing a unified digital portal where users apply for services, agents verify applications, and admins oversee the entire ecosystem. 

## 2. Core Architecture & Tech Stack
The platform is built on a modern serverless stack:
- **Frontend:** React.js powered by Vite, utilizing Tailwind CSS for responsive design.
- **Backend:** Node.js with Express.js, deployed on Vercel as a serverless backend.
- **Database:** MongoDB Atlas with Mongoose schemas (optimized for serverless caching).
- **Storage:** Cloudflare R2 (S3-compatible) for highly secure, private document and proof uploads.
- **Authentication:** JWT-based stateless authentication with strict Role-Based Access Control (RBAC).

## 3. Workflows & Features

### Citizen Workflow
1. **Registration & Auth:** Citizens register and verify their email (OTP mocked for dev).
2. **Service Discovery:** Users browse a dynamically configured catalog of services.
3. **Application:** Citizens create a request, upload required identity proofs, and provide address snapshots.
4. **Tracking:** Dynamic tracking UI follows the state from `DRAFT` to `COMPLETED`.
5. **Corrections:** If agents find issues, citizens receive notifications to replace documents.
6. **Delivery:** Citizens track out-for-delivery status and securely receive their physical documents.

### Agent Workflow
1. **Assignment:** Agents view a dashboard grouped by request statuses (Assigned, In Progress).
2. **Review:** Agents view Citizen snapshots and uploaded documents securely via signed R2 URLs.
3. **Action:** Agents transition requests through states: `ASSIGNED` → `UNDER_REVIEW` → `APPROVED` / `CORRECTION_REQUIRED`.
4. **Finalization:** Agents upload official Verification Reports and Final Certificates.

### Admin Workflow
1. **Analytics:** Global dashboard showing revenue, request volume, and user counts.
2. **Management:** Admins review and approve pending Agent registrations (`agentStatus`).
3. **Oversight:** Full visibility into background dead-letter jobs, orphan documents, and risk flags.

## 4. Key Systems
- **Notification Engine:** Persistent database notifications mapped to realtime toast alerts for key lifecycle events.
- **Delivery & COD:** Complete state machine tracking physical dispatch (`READY_FOR_DISPATCH` → `DELIVERED`). Paid services mandate COD collection before secure handover.
- **Background Outbox Pattern:** Guarantees eventual consistency for emails and notifications using an `OutboxEvent` schema processed by Vercel Cron.

## 5. Security & Limitations
- **Security:** Private R2 buckets, hashed passwords, route-level RBAC, input sanitization, and Mongoose optimistic concurrency.
- **Limitations:** SMS/Courier APIs are mocked for development. Payment gateway is absent; relies entirely on physical COD.

## 6. Future Roadmap
- **Short-Term:** End-to-end (E2E) testing and improved accessibility (a11y).
- **Medium-Term:** Integration with Razorpay/Stripe, Twilio for SMS, and Delhivery for logistics APIs.
- **Long-Term:** Microservices transition, dedicated mobile apps for Agents, and direct B2G integrations.
