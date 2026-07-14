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
