# RBAC Usage

RBAC is layered after authentication:

```js
router.post(
  '/services',
  authenticate,
  authorizePermission(Permissions.SERVICE_CREATE),
  serviceController.createService,
);
```

## Current Roles

- `citizen`
- `agent`
- `admin`

## Permission Map

Permissions are defined in `src/common/enums/permissions.enum.js`.
Role-to-permission mapping is centralized in `src/config/permissions.js`.

Current mapping:

| Permission | Roles |
| --- | --- |
| `service:create` | `admin` |
| `service:update` | `admin` |
| `service:delete` | `admin` |
| `service:view` | `citizen`, `agent`, `admin` |
| `request:create` | `citizen` |
| `request:view_own` | `citizen` |
| `request:view_all` | `admin`, `agent` |
| `request:update_status` | `admin`, `agent` |
| `document:upload` | `citizen` |
| `document:view` | `citizen`, `agent`, `admin` |
| `document:verify` | `agent`, `admin` |
| `agent:verify` | `admin` |
| `agent:view` | `admin` |
| `admin:dashboard` | `admin` |

## Integration Examples

Only Admin: create service

```js
const authenticate = require('../../middlewares/auth.middleware');
const { authorizePermission } = require('../../middlewares/role.middleware');
const Permissions = require('../../common/enums/permissions.enum');

router.post(
  '/',
  authenticate,
  authorizePermission(Permissions.SERVICE_CREATE),
  serviceController.createService,
);
```

Only Admin: update service

```js
router.patch(
  '/:id',
  authenticate,
  authorizePermission(Permissions.SERVICE_UPDATE),
  serviceController.updateService,
);
```

Only Agent: view assigned requests

```js
router.get(
  '/assigned',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  requestController.getAssignedRequests,
);
```

Citizen: create request

```js
router.post(
  '/',
  authenticate,
  authorizePermission(Permissions.REQUEST_CREATE),
  requestController.createRequest,
);
```

Admin + Agent: view request details

```js
router.get(
  '/:id',
  authenticate,
  authorizePermission(Permissions.REQUEST_VIEW_ALL),
  requestController.getRequestDetails,
);
```

## Service Catalog Architecture Note

Do not hardcode government services in route handlers, controllers, or enums.
Store service catalog records in MongoDB so admins can add and update services without code changes.

Example document:

```json
{
  "name": "Service name managed by admin",
  "requiredDocuments": ["Document 1", "Document 2"],
  "estimatedProcessingDays": 7,
  "serviceCharge": 200,
  "isActive": true
}
```
