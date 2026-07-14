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
