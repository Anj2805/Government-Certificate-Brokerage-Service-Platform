# SevaSetu

A comprehensive Government Certificate & Brokerage Service Platform designed to streamline citizen access to public services through verified agents, secure document workflows, and transparent application tracking.

## Overview

Navigating government processes often involves complex procedures and long waiting times. SevaSetu digitizes this journey by connecting citizens with verified service agents who provide procedural assistance, document verification, and secure final delivery (including COD options for paid services).

The platform operates across three primary roles:
- **Citizen:** Users seeking certificates (Birth, Income, PAN, Domicile, etc.).
- **Agent:** Verified representatives managing applications, conducting field verifications, and updating statuses.
- **Admin:** Platform administrators overseeing agents, monitoring requests, and managing service catalog and analytics.

## Key Features

### Citizen Portal
- **Secure Authentication:** Registration, login, and secure password management.
- **Service Discovery:** Search and browse available government services with dynamic requirements.
- **Application Workflow:** Submit applications, upload required proofs, and track real-time status.
- **Dynamic Tracking:** Visual timeline covering Draft → Submitted → Assigned → Under Review → Approved → Completed.
- **Correction Handling:** Review agent feedback and re-upload documents if corrections are requested.
- **Secure Delivery & COD:** Track physical delivery of certificates, including offline Cash-on-Delivery payment handling.

### Agent Portal
- **Dashboard & Workload:** Overview of assigned tasks, grouped by "New", "In Progress", and "Action Required".
- **Application Management:** Review citizen applications and submitted proofs.
- **Document Workflows:** Approve/reject citizen documents, request corrections, and upload official reports (Verification Reports, Agent Notes).
- **Final Certification:** Upload final government certificates securely on behalf of the citizen.
- **Status Updates:** Advance applications through their lifecycle to trigger real-time updates for citizens.

### Admin Portal
- **Global Dashboard:** High-level metrics, active requests, and revenue tracking.
- **Agent & User Management:** Approve, suspend, or audit agents and citizens.
- **Service Management:** Dynamically configure services, required documents, processing times, and fees.
- **Request Oversight:** Reassign requests, monitor stalled applications, and view granular audit histories.
- **Analytics:** Data-driven insights into platform usage and completion rates.

### Security
- **Authentication & Authorization:** Secure JWT-based sessions and strict Role-Based Access Control (RBAC).
- **Data Protection:** Hashed passwords (bcrypt) and sanitized database queries.
- **Storage Security:** Cloudflare R2 (S3-compatible) integration ensuring private object storage. Files are never publicly exposed.
- **Audit Trails:** Immutable status history logs on every request.

### Notifications and Background Jobs
- **Real-Time Feedback:** Global toast notifications for immediate actions.
- **Status Alerts:** Persistent notification center for citizens (e.g., application updates, missing document alerts).
- **Background Workers:** Scheduled Cron jobs and reliable queue processors for asynchronous email delivery and system health checks.

### Secure Delivery and COD Workflow
- **Free Services:** Application → Verification → Dispatch → Secure Handover.
- **Paid Services:** Application → Verification → Dispatch → COD Collection → Secure Handover.

## Architecture & Tech Stack

**Layer** | **Technology**
--- | ---
Frontend | React.js (Vite), Tailwind CSS
Backend | Node.js, Express.js
Database | MongoDB Atlas, Mongoose
Authentication | JWT, bcrypt
Storage | Cloudflare R2 (S3 API)
Deployment | Vercel (Serverless Backend + Static Frontend)

## Showcase Dataset

The repository includes a robust, deterministic seeding engine designed for demonstrating the platform's full capabilities without manual data entry.

**Personas Included:**
- Active Citizens, New Users, Users requiring Corrections.
- High-Performance Agents, Verification Specialists.
- Administrator accounts.

### Using the Showcase Demo
To populate the database with realistic demo data, run:
```bash
npm run seed:showcase
```
This generates users, services, requests, document uploads, and notifications.

> **Note:** Demo credentials are automatically saved to `SHOWCASE_ACCOUNTS.md`. These passwords are for development and demonstration purposes only. Do not use these credentials in a production environment.

## Installation & Local Development

### Prerequisites
- Node.js (v20+)
- MongoDB (Local or Atlas)
- Cloudflare R2 or AWS S3 credentials (for production document storage)

### Backend Setup
1. Clone the repository and navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your local MongoDB URI and JWT secrets.
5. Start the backend development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Running Tests
To run the integration and regression test suite:
```bash
npm run test:all
```

## Security Notes
- **Never commit your `.env` files.**
- Always rotate JWT and Storage keys if exposed.
- Keep Cloudflare R2 buckets private to prevent unauthorized document access.

## Current Limitations
- SMS Provider is currently mocked for development purposes; a real provider integration (e.g., Twilio) is required for production OTP routing.
- Real courier APIs are currently mocked; delivery states are managed internally.

## Future Improvements
- Online payment gateway integration (Stripe/Razorpay).
- Real-time chat support between citizens and agents.
- Comprehensive E2E testing for frontend workflows.
- Native mobile application for on-the-go agents.

## Contributing
Contributions are welcome! Please follow the guidelines outlined in `CONTRIBUTING.md`.

## License
UNLICENSED - Contact the repository owner for permissions.
