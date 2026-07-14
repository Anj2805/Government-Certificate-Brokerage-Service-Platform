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
