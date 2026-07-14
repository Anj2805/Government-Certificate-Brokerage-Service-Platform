# SevaSetu Comprehensive Documentation

# Features and Workflows: SevaSetu

## 1. Request Lifecycle
The core of SevaSetu is the application request workflow. It strictly enforces the following status transitions:

- `DRAFT`: Citizen creates a request but hasn't finalized documents.
- `SUBMITTED`: Request is locked and pending assignment.
- `ASSIGNED`: An Admin routes the request to an Agent.
- `UNDER_REVIEW`: The Agent begins verifying documents.
- `CORRECTION_REQUIRED`: Agent rejects a document. Citizen must replace it.
- `RESUBMITTED`: Citizen uploads new documents.
- `APPROVED`: Agent accepts all documents. Proceed to Delivery/COD.
- `COMPLETED`: Certificate physically delivered and payment (if any) collected.
- `REJECTED`: Application permanently denied.
- `CANCELLED`: Citizen withdraws the application.

## 2. Delivery & Cash on Delivery (COD) Workflow
SevaSetu models physical delivery tracking.

**For Free Services:**
`NOT_REQUIRED` → `READY_FOR_DISPATCH` → `DISPATCHED` → `DELIVERED`

**For Paid Services (COD):**
1. The request enters `APPROVED` state.
2. Delivery status becomes `READY_FOR_DISPATCH`.
3. Agent dispatches the physical document (`DISPATCHED`).
4. Out for delivery (`OUT_FOR_DELIVERY`).
5. Payment status remains `PENDING`.
6. Upon delivery, the agent collects the COD fee, marking Payment as `COMPLETED`.
7. Secure handover is completed, marking Delivery as `DELIVERED`.

## 3. Document Workflow
Documents follow a strict lifecycle to ensure fraud prevention:
1. **Upload:** Citizens upload proofs (Aadhar, PAN, Income). Stored safely on Cloudflare R2 as `PENDING`.
2. **Review:** Agents access files via short-lived Signed URLs.
3. **Verification:** Agents mark the document as `VERIFIED`.
4. **Rejection:** Agents mark the document as `REJECTED` with a reason.
5. **Replacement:** Citizens upload a new file. The original is marked `isSuperseded = true` (audit trail preserved) and the new file replaces it.
6. **Agent Uploads:** Agents upload official `VERIFICATION_REPORT` and `FINAL_CERTIFICATION` documents attached to the Request.

## 4. Notifications
Persistent, real-time database notifications track major events:
- **`REQUEST_SUBMITTED`**
- **`AGENT_ASSIGNED`**
- **`DOCUMENTS_REQUIRED`**
- **`REQUEST_COMPLETED`**

Citizens see these in a dedicated notification center with unread counts and global toast alerts.


---

# Features and Workflows: SevaSetu

## 1. Request Lifecycle
The core of SevaSetu is the application request workflow. It strictly enforces the following status transitions:

- `DRAFT`: Citizen creates a request but hasn't finalized documents.
- `SUBMITTED`: Request is locked and pending assignment.
- `ASSIGNED`: An Admin routes the request to an Agent.
- `UNDER_REVIEW`: The Agent begins verifying documents.
- `CORRECTION_REQUIRED`: Agent rejects a document. Citizen must replace it.
- `RESUBMITTED`: Citizen uploads new documents.
- `APPROVED`: Agent accepts all documents. Proceed to Delivery/COD.
- `COMPLETED`: Certificate physically delivered and payment (if any) collected.
- `REJECTED`: Application permanently denied.
- `CANCELLED`: Citizen withdraws the application.

## 2. Delivery & Cash on Delivery (COD) Workflow
SevaSetu models physical delivery tracking.

**For Free Services:**
`NOT_REQUIRED` → `READY_FOR_DISPATCH` → `DISPATCHED` → `DELIVERED`

**For Paid Services (COD):**
1. The request enters `APPROVED` state.
2. Delivery status becomes `READY_FOR_DISPATCH`.
3. Agent dispatches the physical document (`DISPATCHED`).
4. Out for delivery (`OUT_FOR_DELIVERY`).
5. Payment status remains `PENDING`.
6. Upon delivery, the agent collects the COD fee, marking Payment as `COMPLETED`.
7. Secure handover is completed, marking Delivery as `DELIVERED`.

## 3. Document Workflow
Documents follow a strict lifecycle to ensure fraud prevention:
1. **Upload:** Citizens upload proofs (Aadhar, PAN, Income). Stored safely on Cloudflare R2 as `PENDING`.
2. **Review:** Agents access files via short-lived Signed URLs.
3. **Verification:** Agents mark the document as `VERIFIED`.
4. **Rejection:** Agents mark the document as `REJECTED` with a reason.
5. **Replacement:** Citizens upload a new file. The original is marked `isSuperseded = true` (audit trail preserved) and the new file replaces it.
6. **Agent Uploads:** Agents upload official `VERIFICATION_REPORT` and `FINAL_CERTIFICATION` documents attached to the Request.

## 4. Notifications
Persistent, real-time database notifications track major events:
- **`REQUEST_SUBMITTED`**
- **`AGENT_ASSIGNED`**
- **`DOCUMENTS_REQUIRED`**
- **`REQUEST_COMPLETED`**

Citizens see these in a dedicated notification center with unread counts and global toast alerts.
# Future Scope: SevaSetu

## Current Limitations & Mocked Interfaces
SevaSetu was built to demonstrate complex workflows and secure data handling. As such, several external dependencies are currently mocked:
- **SMS/OTP Providers:** OTP generation and delivery logic exists, but the SMS dispatch is mocked via backend logging.
- **Payment Gateways:** Online payments (Stripe/Razorpay) are not implemented. The system relies entirely on physical Cash-on-Delivery (COD) states.
- **Courier Logistics:** Dispatch tracking is managed via internal states (`DISPATCHED`, `IN_TRANSIT`) rather than integrating with APIs like Delhivery or BlueDart.

## 1. Short-Term Roadmap (1-3 Months)
- **E2E Testing Suite:** Implement Cypress or Playwright to automate end-to-end frontend user journey tests.
- **Accessibility (a11y) Audit:** Ensure full WCAG compliance for forms and dashboards to support citizens with disabilities.
- **Enhanced Observability:** Integrate Datadog or Sentry for tracking serverless function cold starts and UI error boundaries.

## 2. Medium-Term Roadmap (3-12 Months)
- **Payment Gateway Integration:** Implement Razorpay to allow citizens to pay online, minimizing COD risk for agents.
- **SMS Gateway:** Integrate Twilio or MSG91 to dispatch actual verification codes and status alerts.
- **Mobile First PWA / Native App:** Transition the Agent portal to a Progressive Web App (PWA) or React Native app for field agents handling offline document scanning.

## 3. Long-Term Roadmap (1-3 Years) & Commercial Expansion
- **DigiLocker Integration:** Allow citizens to pull verified government documents directly from India's DigiLocker API instead of uploading physical scans.
- **eSign/Digital Signatures:** Integrate Aadhaar eSign or similar digital signature APIs for instant certificate generation.
- **B2G White-Label SaaS:** Package SevaSetu as a multi-tenant SaaS platform where local municipal corporations can run their own branded citizen service portals.
- **AI-Assisted Fraud Detection:** Train ML models to automatically scan and flag potentially fraudulent identity documents before they reach manual Agent review.
# Presentation Content: SevaSetu

This document contains slide-ready content for a 20-30 slide technical presentation.

## Slide 1: Title
**Title:** SevaSetu - Government Certificate & Brokerage Service Platform
**Key Points:**
- Modernizing citizen access to public services.
- Secure, verifiable, and transparent workflows.
**Speaker Notes:** Welcome the audience. Introduce the core vision of SevaSetu—a bridge between citizens and complex government documentation.

## Slide 2: The Problem Statement
**Title:** Fragmentation and Inefficiency in Public Services
**Key Points:**
- Citizens face long lines and opaque procedures.
- Reliance on unverified local agents or "brokers".
- Lack of status tracking and secure document handling.
**Speaker Notes:** Explain the pain points of a citizen trying to get an Income or Birth certificate today. Highlight the security risks of handing sensitive documents to unverified third parties.

## Slide 3: Proposed Solution
**Title:** A Unified Digital Workflow
**Key Points:**
- Centralized digital portal for service applications.
- Three-tier RBAC system: Citizens, Verified Agents, Admins.
- Secure document uploads and real-time lifecycle tracking.
**Speaker Notes:** Introduce how SevaSetu solves the problem by structuring the workflow, ensuring agents are vetted, and keeping the citizen informed at every step.

## Slide 4: System Architecture
**Title:** Serverless Full-Stack Architecture
**Key Points:**
- **Frontend:** React + Vite (Vercel Edge)
- **Backend:** Node.js + Express (Vercel Serverless)
- **Database:** MongoDB Atlas
- **Storage:** Cloudflare R2 (S3-Compatible)
**Speaker Notes:** Highlight the decision to go serverless for zero-maintenance scaling. Mention the MongoDB connection pooling strategy.

## Slide 5: The Citizen Workflow
**Title:** Empowering the Applicant
**Key Points:**
- Browse dynamic service catalog.
- Upload identity proofs securely.
- Track application from `DRAFT` to `COMPLETED`.
- Receive corrections if documents are invalid.
**Speaker Notes:** Walk through the user journey. Emphasize that citizens are never left in the dark about their application status.

## Slide 6: The Agent Workflow
**Title:** Field Verification & Processing
**Key Points:**
- Agents access assigned tasks via a prioritized dashboard.
- View Citizen documents via short-lived Signed URLs.
- Approve proofs or request replacements.
- Upload official Verification Reports.
**Speaker Notes:** Explain that Agents are the operational engine. They perform the real-world validation and update the digital state.

## Slide 7: Security & Document Storage
**Title:** Zero-Trust Document Handling
**Key Points:**
- Private Cloudflare R2 Buckets.
- No public access to sensitive IDs (Aadhaar, PAN).
- AWS SDK generates Signed URLs valid for minutes.
- Strict IDOR prevention at the API level.
**Speaker Notes:** This is crucial. Assure the audience that a citizen's PAN card cannot be downloaded by just guessing a URL.

## Slide 8: Background Jobs on Serverless
**Title:** The Outbox Pattern
**Key Points:**
- Vercel functions die after HTTP response.
- We use an `OutboxEvent` schema to guarantee message delivery.
- Vercel Cron triggers the worker endpoint securely.
- Idempotency keys prevent duplicate processing.
**Speaker Notes:** Explain the technical challenge of background jobs (like sending emails) on Vercel, and how the Outbox pattern guarantees reliability without a persistent worker daemon.

## Slide 9: Delivery and COD
**Title:** Bridging Digital to Physical
**Key Points:**
- Paid services require Cash on Delivery (COD).
- State transitions: `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED`.
- Secure handover triggers both Delivery and Payment completion.
**Speaker Notes:** Explain why COD is used to map real-world logistics into the digital state machine.

## Slide 10: Future Scope
**Title:** Expanding SevaSetu
**Key Points:**
- Integration with online payment gateways (Stripe/Razorpay).
- Real SMS delivery via Twilio.
- DigiLocker API integration for automated verification.
**Speaker Notes:** Conclude by showing that the architecture is built to scale and integrate with real-world GovTech APIs in the future.
# SevaSetu Project Master Report

## 1. Project Overview & Motivation
**SevaSetu** is a Government Certificate & Brokerage Service Platform designed to streamline citizen access to public services. 

### The Problem
Obtaining official government documents (Income Certificates, Domicile Certificates, etc.) often requires multiple physical visits to administrative offices, reliance on unverified local agents, and navigating complex, opaque procedures. This results in lost time, increased fraud risk (due to handing sensitive documents to unverified third parties), and a lack of transparency for the applicant.

### The Solution
SevaSetu solves this by providing a unified digital portal where Citizens can securely upload their identity proofs, apply for services, and track real-time status. The platform connects them with strictly vetted, system-approved Agents who manage the bureaucratic processing, field verification, and physical delivery of the final certificates. The entire ecosystem is overseen by platform Administrators to ensure accountability and efficiency.

*Note: SevaSetu is a software demonstration of digital government workflow management. It is not currently integrated with live official government databases (e.g., Aadhaar APIs) due to legal boundaries.*

## 2. Platform Roles (Stakeholder Analysis)

### Citizen
- **Capabilities:** Browse services, create applications, upload encrypted identity proofs, track application states (`SUBMITTED` to `COMPLETED`), manage their profile, and receive notifications.
- **Restrictions:** Can only view their own requests and documents. Cannot bypass the Agent verification step.

### Agent
- **Capabilities:** Access a prioritized dashboard of assigned tasks. View Citizen applications and securely access uploaded documents via temporary signed URLs. Transition states (`UNDER_REVIEW`, `APPROVED`, `CORRECTION_REQUIRED`). Upload official Verification Reports. Execute physical delivery and COD collection.
- **Restrictions:** Must be explicitly approved by an Admin (`agentStatus: 'approved'`). Can only access documents tied to their specific assigned requests.

### Admin
- **Capabilities:** Global oversight. Approve or suspend Agents. Reassign stuck requests. View systemic analytics, dead-letter jobs, and overall system health. Manage the dynamic service catalog (e.g., adding a new "Marriage Certificate" service).
- **Restrictions:** Does not participate in the field-verification workflow directly.

## 3. Core Functional Requirements (FR)

| ID | Requirement | Role | Status | Implementation |
|----|-------------|------|--------|----------------|
| FR-01 | Secure User Authentication | All | IMPLEMENTED | JWT, bcrypt, RBAC middleware. |
| FR-02 | Service Discovery | Citizen | IMPLEMENTED | Dynamic search and filtering on Landing Page. |
| FR-03 | Request Submission | Citizen | IMPLEMENTED | Multi-step form with document upload validation. |
| FR-04 | Document Verification | Agent | IMPLEMENTED | Secure R2 Signed URLs, Accept/Reject actions. |
| FR-05 | Cash on Delivery (COD) | Agent | IMPLEMENTED | State machine tracking physical handover. |
| FR-06 | Real-time Notifications | All | IMPLEMENTED | DB-persisted notifications with Toast popups. |
| FR-07 | Agent Onboarding Review | Admin | IMPLEMENTED | `agentStatus` enum approval flow. |
| FR-08 | SMS OTP Verification | All | MOCKED | Logic implemented, but SMS provider mocked. |

## 4. System Workflows

### The Application Lifecycle
The core workflow is governed by a strict state machine implemented in `src/modules/requests/request.workflow.js`:

1. `DRAFT`: Form created, pending document uploads.
2. `SUBMITTED`: Locked by Citizen, waiting for Admin routing.
3. `ASSIGNED`: Admin assigns an Agent.
4. `UNDER_REVIEW`: Agent actively processing.
5. `APPROVED`: Documents verified, preparing for delivery.
6. **(Alternate) `CORRECTION_REQUIRED`**: Proof rejected. Citizen must upload a replacement (`RESUBMITTED`).
7. `COMPLETED`: Physical delivery executed, COD collected.

### The Document Lifecycle
1. **Upload:** Files uploaded to Cloudflare R2 (`PENDING`).
2. **Verification:** Agent reviews via Signed URL. Marks `VERIFIED` or `REJECTED`.
3. **Replacement Audit:** If rejected, the Citizen uploads a new file. The original is marked `isSuperseded: true` but is **never hard-deleted** to preserve the audit trail against fraud.

## 5. Technical Architecture

### Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS. (Vercel Edge)
- **Backend:** Node.js, Express.js. (Vercel Serverless)
- **Database:** MongoDB Atlas with Mongoose.
- **Storage:** Cloudflare R2 (S3-Compatible API).

### Vercel Serverless Challenges & Solutions
Deploying to Vercel presented unique architectural challenges:
- **Challenge 1: Connection Exhaustion.** Serverless functions spin up rapidly, potentially overwhelming MongoDB with connections.
  *Solution:* We implemented connection caching in the global Node scope within `app.js` to reuse existing connections across function invocations.
- **Challenge 2: Background Jobs.** Serverless functions cannot run persistent `setTimeout` or daemon workers for tasks like sending emails.
  *Solution:* **The Outbox Pattern**. The API writes an `OutboxEvent` to MongoDB synchronously. A Vercel Cron Job securely pings `/api/v1/jobs/process-outbox` every minute to drain the queue idempotently, guaranteeing email delivery even if a function dies.

### Storage Architecture
- The application completely abstracts file storage (`src/services/storage.service.js`).
- During local development, it supports writing to the local filesystem (`multer`).
- In production, it utilizes the `@aws-sdk/client-s3` package connected to Cloudflare R2.
- **Security:** R2 buckets are completely private. The application generates **Signed URLs** that expire within minutes to ensure that sensitive IDs are never permanently exposed to the public internet.

## 6. Security Analysis
| Threat | Security Control | Status |
|--------|------------------|--------|
| Insecure Direct Object Reference (IDOR) | Strict ownership checks in services. Users can only view their own `ownerUser` documents. | IMPLEMENTED |
| Unauthorized Access | Route-level RBAC (`authorizeRoles('admin')`). | IMPLEMENTED |
| Data Exposure | Private R2 Buckets + Signed URLs. No public file hosting. | IMPLEMENTED |
| Concurrent State Overwrites | Mongoose Optimistic Concurrency (`__v` incrementing). | IMPLEMENTED |
| Password Leaks | `bcrypt` hashing with salt rounds. | IMPLEMENTED |

## 7. Current Limitations
- **Mocked Logistics:** The "Out for Delivery" state is manually toggled by Agents rather than integrating with an API like BlueDart or Delhivery.
- **Mocked SMS:** OTP codes are printed to the server logs rather than dispatched via Twilio to save costs during development.
- **No Online Payment Gateway:** The system currently relies entirely on Cash on Delivery (COD). Integrating Razorpay or Stripe would reduce the liability on Agents carrying cash.

## 8. Future Scope and Roadmap
- **Short-Term (1-3 Months):** Implement E2E testing using Cypress to ensure core workflows (Citizen Apply -> Agent Approve -> Delivery) do not regress.
- **Medium-Term (3-12 Months):** Integrate real SMS providers (Twilio) and an online Payment Gateway (Razorpay). 
- **Long-Term (1-3 Years):** Transition the Agent UI to a React Native mobile application for better offline capability during field verification. Investigate DigiLocker integrations to pull verified documents directly from the government, eliminating the need for manual image uploads.

## 9. Conclusion
SevaSetu successfully demonstrates a highly secure, serverless-optimized full-stack application capable of managing complex, multi-role state machines. By adhering to strict audit trails, enforcing private cloud storage, and utilizing resilient background job patterns, it serves as a robust blueprint for digital government workflow modernization.
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


---

# Future Scope: SevaSetu

## Current Limitations & Mocked Interfaces
SevaSetu was built to demonstrate complex workflows and secure data handling. As such, several external dependencies are currently mocked:
- **SMS/OTP Providers:** OTP generation and delivery logic exists, but the SMS dispatch is mocked via backend logging.
- **Payment Gateways:** Online payments (Stripe/Razorpay) are not implemented. The system relies entirely on physical Cash-on-Delivery (COD) states.
- **Courier Logistics:** Dispatch tracking is managed via internal states (`DISPATCHED`, `IN_TRANSIT`) rather than integrating with APIs like Delhivery or BlueDart.

## 1. Short-Term Roadmap (1-3 Months)
- **E2E Testing Suite:** Implement Cypress or Playwright to automate end-to-end frontend user journey tests.
- **Accessibility (a11y) Audit:** Ensure full WCAG compliance for forms and dashboards to support citizens with disabilities.
- **Enhanced Observability:** Integrate Datadog or Sentry for tracking serverless function cold starts and UI error boundaries.

## 2. Medium-Term Roadmap (3-12 Months)
- **Payment Gateway Integration:** Implement Razorpay to allow citizens to pay online, minimizing COD risk for agents.
- **SMS Gateway:** Integrate Twilio or MSG91 to dispatch actual verification codes and status alerts.
- **Mobile First PWA / Native App:** Transition the Agent portal to a Progressive Web App (PWA) or React Native app for field agents handling offline document scanning.

## 3. Long-Term Roadmap (1-3 Years) & Commercial Expansion
- **DigiLocker Integration:** Allow citizens to pull verified government documents directly from India's DigiLocker API instead of uploading physical scans.
- **eSign/Digital Signatures:** Integrate Aadhaar eSign or similar digital signature APIs for instant certificate generation.
- **B2G White-Label SaaS:** Package SevaSetu as a multi-tenant SaaS platform where local municipal corporations can run their own branded citizen service portals.
- **AI-Assisted Fraud Detection:** Train ML models to automatically scan and flag potentially fraudulent identity documents before they reach manual Agent review.


---

# Presentation Content: SevaSetu

This document contains slide-ready content for a 20-30 slide technical presentation.

## Slide 1: Title
**Title:** SevaSetu - Government Certificate & Brokerage Service Platform
**Key Points:**
- Modernizing citizen access to public services.
- Secure, verifiable, and transparent workflows.
**Speaker Notes:** Welcome the audience. Introduce the core vision of SevaSetu—a bridge between citizens and complex government documentation.

## Slide 2: The Problem Statement
**Title:** Fragmentation and Inefficiency in Public Services
**Key Points:**
- Citizens face long lines and opaque procedures.
- Reliance on unverified local agents or "brokers".
- Lack of status tracking and secure document handling.
**Speaker Notes:** Explain the pain points of a citizen trying to get an Income or Birth certificate today. Highlight the security risks of handing sensitive documents to unverified third parties.

## Slide 3: Proposed Solution
**Title:** A Unified Digital Workflow
**Key Points:**
- Centralized digital portal for service applications.
- Three-tier RBAC system: Citizens, Verified Agents, Admins.
- Secure document uploads and real-time lifecycle tracking.
**Speaker Notes:** Introduce how SevaSetu solves the problem by structuring the workflow, ensuring agents are vetted, and keeping the citizen informed at every step.

## Slide 4: System Architecture
**Title:** Serverless Full-Stack Architecture
**Key Points:**
- **Frontend:** React + Vite (Vercel Edge)
- **Backend:** Node.js + Express (Vercel Serverless)
- **Database:** MongoDB Atlas
- **Storage:** Cloudflare R2 (S3-Compatible)
**Speaker Notes:** Highlight the decision to go serverless for zero-maintenance scaling. Mention the MongoDB connection pooling strategy.

## Slide 5: The Citizen Workflow
**Title:** Empowering the Applicant
**Key Points:**
- Browse dynamic service catalog.
- Upload identity proofs securely.
- Track application from `DRAFT` to `COMPLETED`.
- Receive corrections if documents are invalid.
**Speaker Notes:** Walk through the user journey. Emphasize that citizens are never left in the dark about their application status.

## Slide 6: The Agent Workflow
**Title:** Field Verification & Processing
**Key Points:**
- Agents access assigned tasks via a prioritized dashboard.
- View Citizen documents via short-lived Signed URLs.
- Approve proofs or request replacements.
- Upload official Verification Reports.
**Speaker Notes:** Explain that Agents are the operational engine. They perform the real-world validation and update the digital state.

## Slide 7: Security & Document Storage
**Title:** Zero-Trust Document Handling
**Key Points:**
- Private Cloudflare R2 Buckets.
- No public access to sensitive IDs (Aadhaar, PAN).
- AWS SDK generates Signed URLs valid for minutes.
- Strict IDOR prevention at the API level.
**Speaker Notes:** This is crucial. Assure the audience that a citizen's PAN card cannot be downloaded by just guessing a URL.

## Slide 8: Background Jobs on Serverless
**Title:** The Outbox Pattern
**Key Points:**
- Vercel functions die after HTTP response.
- We use an `OutboxEvent` schema to guarantee message delivery.
- Vercel Cron triggers the worker endpoint securely.
- Idempotency keys prevent duplicate processing.
**Speaker Notes:** Explain the technical challenge of background jobs (like sending emails) on Vercel, and how the Outbox pattern guarantees reliability without a persistent worker daemon.

## Slide 9: Delivery and COD
**Title:** Bridging Digital to Physical
**Key Points:**
- Paid services require Cash on Delivery (COD).
- State transitions: `DISPATCHED` → `OUT_FOR_DELIVERY` → `DELIVERED`.
- Secure handover triggers both Delivery and Payment completion.
**Speaker Notes:** Explain why COD is used to map real-world logistics into the digital state machine.

## Slide 10: Future Scope
**Title:** Expanding SevaSetu
**Key Points:**
- Integration with online payment gateways (Stripe/Razorpay).
- Real SMS delivery via Twilio.
- DigiLocker API integration for automated verification.
**Speaker Notes:** Conclude by showing that the architecture is built to scale and integrate with real-world GovTech APIs in the future.


---

# SevaSetu Project Master Report

## 1. Project Overview & Motivation
**SevaSetu** is a Government Certificate & Brokerage Service Platform designed to streamline citizen access to public services. 

### The Problem
Obtaining official government documents (Income Certificates, Domicile Certificates, etc.) often requires multiple physical visits to administrative offices, reliance on unverified local agents, and navigating complex, opaque procedures. This results in lost time, increased fraud risk (due to handing sensitive documents to unverified third parties), and a lack of transparency for the applicant.

### The Solution
SevaSetu solves this by providing a unified digital portal where Citizens can securely upload their identity proofs, apply for services, and track real-time status. The platform connects them with strictly vetted, system-approved Agents who manage the bureaucratic processing, field verification, and physical delivery of the final certificates. The entire ecosystem is overseen by platform Administrators to ensure accountability and efficiency.

*Note: SevaSetu is a software demonstration of digital government workflow management. It is not currently integrated with live official government databases (e.g., Aadhaar APIs) due to legal boundaries.*

## 2. Platform Roles (Stakeholder Analysis)

### Citizen
- **Capabilities:** Browse services, create applications, upload encrypted identity proofs, track application states (`SUBMITTED` to `COMPLETED`), manage their profile, and receive notifications.
- **Restrictions:** Can only view their own requests and documents. Cannot bypass the Agent verification step.

### Agent
- **Capabilities:** Access a prioritized dashboard of assigned tasks. View Citizen applications and securely access uploaded documents via temporary signed URLs. Transition states (`UNDER_REVIEW`, `APPROVED`, `CORRECTION_REQUIRED`). Upload official Verification Reports. Execute physical delivery and COD collection.
- **Restrictions:** Must be explicitly approved by an Admin (`agentStatus: 'approved'`). Can only access documents tied to their specific assigned requests.

### Admin
- **Capabilities:** Global oversight. Approve or suspend Agents. Reassign stuck requests. View systemic analytics, dead-letter jobs, and overall system health. Manage the dynamic service catalog (e.g., adding a new "Marriage Certificate" service).
- **Restrictions:** Does not participate in the field-verification workflow directly.

## 3. Core Functional Requirements (FR)

| ID | Requirement | Role | Status | Implementation |
|----|-------------|------|--------|----------------|
| FR-01 | Secure User Authentication | All | IMPLEMENTED | JWT, bcrypt, RBAC middleware. |
| FR-02 | Service Discovery | Citizen | IMPLEMENTED | Dynamic search and filtering on Landing Page. |
| FR-03 | Request Submission | Citizen | IMPLEMENTED | Multi-step form with document upload validation. |
| FR-04 | Document Verification | Agent | IMPLEMENTED | Secure R2 Signed URLs, Accept/Reject actions. |
| FR-05 | Cash on Delivery (COD) | Agent | IMPLEMENTED | State machine tracking physical handover. |
| FR-06 | Real-time Notifications | All | IMPLEMENTED | DB-persisted notifications with Toast popups. |
| FR-07 | Agent Onboarding Review | Admin | IMPLEMENTED | `agentStatus` enum approval flow. |
| FR-08 | SMS OTP Verification | All | MOCKED | Logic implemented, but SMS provider mocked. |

## 4. System Workflows

### The Application Lifecycle
The core workflow is governed by a strict state machine implemented in `src/modules/requests/request.workflow.js`:

1. `DRAFT`: Form created, pending document uploads.
2. `SUBMITTED`: Locked by Citizen, waiting for Admin routing.
3. `ASSIGNED`: Admin assigns an Agent.
4. `UNDER_REVIEW`: Agent actively processing.
5. `APPROVED`: Documents verified, preparing for delivery.
6. **(Alternate) `CORRECTION_REQUIRED`**: Proof rejected. Citizen must upload a replacement (`RESUBMITTED`).
7. `COMPLETED`: Physical delivery executed, COD collected.

### The Document Lifecycle
1. **Upload:** Files uploaded to Cloudflare R2 (`PENDING`).
2. **Verification:** Agent reviews via Signed URL. Marks `VERIFIED` or `REJECTED`.
3. **Replacement Audit:** If rejected, the Citizen uploads a new file. The original is marked `isSuperseded: true` but is **never hard-deleted** to preserve the audit trail against fraud.

## 5. Technical Architecture

### Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS. (Vercel Edge)
- **Backend:** Node.js, Express.js. (Vercel Serverless)
- **Database:** MongoDB Atlas with Mongoose.
- **Storage:** Cloudflare R2 (S3-Compatible API).

### Vercel Serverless Challenges & Solutions
Deploying to Vercel presented unique architectural challenges:
- **Challenge 1: Connection Exhaustion.** Serverless functions spin up rapidly, potentially overwhelming MongoDB with connections.
  *Solution:* We implemented connection caching in the global Node scope within `app.js` to reuse existing connections across function invocations.
- **Challenge 2: Background Jobs.** Serverless functions cannot run persistent `setTimeout` or daemon workers for tasks like sending emails.
  *Solution:* **The Outbox Pattern**. The API writes an `OutboxEvent` to MongoDB synchronously. A Vercel Cron Job securely pings `/api/v1/jobs/process-outbox` every minute to drain the queue idempotently, guaranteeing email delivery even if a function dies.

### Storage Architecture
- The application completely abstracts file storage (`src/services/storage.service.js`).
- During local development, it supports writing to the local filesystem (`multer`).
- In production, it utilizes the `@aws-sdk/client-s3` package connected to Cloudflare R2.
- **Security:** R2 buckets are completely private. The application generates **Signed URLs** that expire within minutes to ensure that sensitive IDs are never permanently exposed to the public internet.

## 6. Security Analysis
| Threat | Security Control | Status |
|--------|------------------|--------|
| Insecure Direct Object Reference (IDOR) | Strict ownership checks in services. Users can only view their own `ownerUser` documents. | IMPLEMENTED |
| Unauthorized Access | Route-level RBAC (`authorizeRoles('admin')`). | IMPLEMENTED |
| Data Exposure | Private R2 Buckets + Signed URLs. No public file hosting. | IMPLEMENTED |
| Concurrent State Overwrites | Mongoose Optimistic Concurrency (`__v` incrementing). | IMPLEMENTED |
| Password Leaks | `bcrypt` hashing with salt rounds. | IMPLEMENTED |

## 7. Current Limitations
- **Mocked Logistics:** The "Out for Delivery" state is manually toggled by Agents rather than integrating with an API like BlueDart or Delhivery.
- **Mocked SMS:** OTP codes are printed to the server logs rather than dispatched via Twilio to save costs during development.
- **No Online Payment Gateway:** The system currently relies entirely on Cash on Delivery (COD). Integrating Razorpay or Stripe would reduce the liability on Agents carrying cash.

## 8. Future Scope and Roadmap
- **Short-Term (1-3 Months):** Implement E2E testing using Cypress to ensure core workflows (Citizen Apply -> Agent Approve -> Delivery) do not regress.
- **Medium-Term (3-12 Months):** Integrate real SMS providers (Twilio) and an online Payment Gateway (Razorpay). 
- **Long-Term (1-3 Years):** Transition the Agent UI to a React Native mobile application for better offline capability during field verification. Investigate DigiLocker integrations to pull verified documents directly from the government, eliminating the need for manual image uploads.

## 9. Conclusion
SevaSetu successfully demonstrates a highly secure, serverless-optimized full-stack application capable of managing complex, multi-role state machines. By adhering to strict audit trails, enforcing private cloud storage, and utilizing resilient background job patterns, it serves as a robust blueprint for digital government workflow modernization.


---

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


---

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


---

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


---

