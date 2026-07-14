# Security Policy

## Supported Versions

Currently, only the latest version on the `master` branch is supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within SevaSetu, please do not disclose it publicly.

Instead, please report it to the repository maintainers. We ask that you include:
- A detailed description of the vulnerability.
- Steps to reproduce the issue.
- Any potential impact on citizens, agents, or admins.

We will acknowledge receipt of your vulnerability report and strive to send you regular updates about our progress.

## Secure Configuration Reminders
- Never commit your `.env` or `.env.test` files.
- Ensure Cloudflare R2 / AWS S3 buckets are configured for private access only.
- Rotate JWT secrets periodically.
