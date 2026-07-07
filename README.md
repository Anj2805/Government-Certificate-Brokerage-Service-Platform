# Government Certificate & Brokerage Service Platform

A production-oriented Node.js backend for managing government certificate services, citizen requests, document uploads, agent workflows, and admin operations.

The platform is built around a modular Express architecture with MongoDB persistence, JWT authentication, RBAC, workflow-controlled request status transitions, local document storage, and Swagger/OpenAPI documentation.

## Project Overview

This backend supports a service marketplace where administrators manage government service catalog entries, citizens create service requests, agents process assigned requests, and admins monitor and control platform operations.

Core workflows include:

- User authentication and role-based access
- Dynamic service catalog management
- Citizen service request lifecycle management
- Document upload, verification, rejection, and soft deletion
- Agent dashboard operations
- Admin dashboard metrics and management APIs

## Features

- JWT access and refresh token authentication
- Roles: `citizen`, `agent`, `admin`
- Centralized RBAC permissions
- Service catalog stored in MongoDB
- Request workflow engine with controlled status transitions
- Status history tracking for audit and review
- Sequential request numbers such as `REQ-2026-000001`
- Service snapshot stored on each request
- Local document uploads to `/uploads`
- File validation for PDF, JPG, JPEG, and PNG
- 5MB upload limit
- Agent dashboard APIs
- Admin dashboard APIs
- Centralized error handling
- Structured logging
- Security middleware: Helmet, CORS, rate limiting, HPP, Mongo sanitization, compression
- Swagger UI at `/api-docs`

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- express-validator
- Pino and Morgan
- Swagger JSDoc
- Swagger UI Express

## Architecture

The project follows a modular MVC architecture. Each business area owns its routes, validation, controller, service, repository, and model where applicable.

Key architectural decisions:

- `src/modules/*` contains feature modules.
- `src/common/*` contains shared enums, errors, response helpers, models, and utilities.
- `src/config/*` contains runtime configuration, database setup, logging, upload config, permissions, and Swagger setup.
- `src/middlewares/*` contains reusable Express middleware.
- API versioning is mounted at `/api/v1`.
- Swagger UI is mounted at `/api-docs`.

## Folder Structure

```text
.
├── app.js
├── server.js
├── package.json
├── .env.example
├── scripts
│   ├── seedAdmin.js
│   └── seedServices.js
├── uploads
├── src
│   ├── api
│   │   └── v1
│   │       └── routes
│   ├── common
│   │   ├── enums
│   │   ├── errors
│   │   ├── models
│   │   ├── responses
│   │   └── utils
│   ├── config
│   ├── docs
│   ├── middlewares
│   ├── modules
│   │   ├── admin
│   │   ├── agents
│   │   ├── auth
│   │   ├── documents
│   │   ├── requests
│   │   ├── services
│   │   └── users
│   └── utils
```

## API Documentation

Swagger UI is available at:

```text
http://localhost:5000/api-docs
```

The OpenAPI documentation covers:

- Authentication APIs
- Service Catalog APIs
- Document APIs
- Request APIs
- Agent Dashboard APIs
- Admin Dashboard APIs
- JWT bearer authentication examples
- Request and response schemas

## Installation

1. Clone the repository.

```bash
git clone <repository-url>
cd <project-folder>
```

2. Install dependencies.

```bash
npm install
```

3. Create an environment file.

```bash
cp .env.example .env
```

4. Update `.env` with local credentials and strong JWT secrets.

5. Start MongoDB locally or configure a hosted MongoDB URI.

6. Run seeders.

```bash
npm run seed:admin
npm run seed:services
```

7. Start the server.

```bash
npm run dev
```

The API will run at:

```text
http://localhost:5000/api/v1
```

## Environment Variables

```env
NODE_ENV=development
PORT=5000

APP_NAME="Government Certificate Brokerage Service"
API_VERSION=v1

MONGODB_URI=mongodb://127.0.0.1:27017/gov_certificate_brokerage
MONGODB_MAX_POOL_SIZE=10

JWT_ACCESS_SECRET=replace-with-a-strong-access-token-secret
JWT_REFRESH_SECRET=replace-with-a-strong-refresh-token-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
REQUEST_BODY_LIMIT=10kb

FRONTEND_URL=http://localhost:5173
PASSWORD_RESET_TOKEN_TTL_MINUTES=15
EMAIL_VERIFICATION_TOKEN_TTL_HOURS=24

EMAIL_FROM="SevaSetu <no-reply@example.com>"
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

## Seeder Commands

Create or update the default admin:

```bash
npm run seed:admin
```

Default admin credentials:

```text
email: admin@example.com
password: Admin@123
```

Seed default services:

```bash
npm run seed:services
```

Seeded services:

- Income Certificate
- Birth Certificate
- Caste Certificate
- Domicile Certificate
- PAN Service
- Aadhaar Service

Seeders are idempotent and prevent duplicate records through upsert logic.

## Available Scripts

```bash
npm run dev
```

Start the development server with Nodemon.

```bash
npm start
```

Start the production server.

```bash
npm test
```

Run Node.js tests.

```bash
npm run lint
```

Run ESLint.

```bash
npm run seed:admin
```

Seed the default admin user.

```bash
npm run seed:services
```

Seed default service catalog records.

## Core API Areas

Authentication:

- Register
- Login
- Refresh token
- Logout
- Current user

Services:

- Create service
- Update service
- Activate/deactivate service
- Soft delete service
- List service catalog
- View service details

Documents:

- Upload document
- View document metadata
- Verify document
- Reject document
- Soft delete document
- View uploaded documents

Requests:

- Create request
- Submit request
- Cancel request
- View own requests
- View assigned requests
- Assign agent
- Update request progress/status
- Track status history

Agent Dashboard:

- View assigned requests
- View request details
- Update progress
- Upload additional documents
- View dashboard statistics

Admin Dashboard:

- View platform metrics
- View agents
- Approve/reject/suspend agents
- View all requests
- Assign agents
- Update request status

## Future Enhancements

- Payment integration
- Notification service
- Complaint management
- Audit log module
- Reporting and analytics
- Background job processing
- Cloud object storage for documents
- Email and SMS verification
- Refresh token device/session management
- Automated test coverage
- Docker and CI/CD pipeline
- Production observability dashboards

## License

This project is currently marked as `UNLICENSED`.
