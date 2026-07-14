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
