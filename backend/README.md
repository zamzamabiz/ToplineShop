# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Vendor Read Service** — Read-only vendor API implemented.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Tenant read endpoints (`GET /tenants`, `GET /tenants/:id`)
- ✅ Vendor read endpoints (`GET /vendors`, `GET /vendors/:id`)
- ✅ Audit logging foundation (AuditModule, AuditService)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No tenant/vendor write endpoints
- ❌ No category/product CRUD
- ❌ No automatic audit logging on read endpoints
- ❌ No CRM/ERP/FMCG modules

## Setup

```bash
# Install dependencies
npm install

# Build
npm run build

# Development (watch mode)
npm run start:dev

# Production
npm run start:prod
```

## API Response Standard

All endpoints return a standardized response format:

### Success

```json
{
  "ok": true,
  "data": { ... },
  "meta": { ... }
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Safe human-readable message"
  }
}
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Bootstrap status check |
| `/health` | GET | System health with database status |
| `/version` | GET | Service version info |
| `/tenants` | GET | List all tenants (read-only) |
| `/tenants/:id` | GET | Get tenant by ID (read-only) |
| `/vendors` | GET | List vendors (read-only, optional `?tenantId=` filter) |
| `/vendors/:id` | GET | Get vendor by ID (read-only) |

### `GET /vendors`

Returns safe vendor summaries. Optional `tenantId` query parameter for filtering.

```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "tenantId": "...",
      "name": "...",
      "status": "...",
      "createdAt": "..."
    }
  ],
  "meta": {
    "count": 0,
    "phase": "P5-005"
  }
}
```

**Note:** Empty list is acceptable if no vendors exist. No seed data required.

### `GET /vendors/:id`

Returns single vendor summary or 404 if not found.

### Vendor DTO Safe Fields

Only these fields are returned:
- `id`
- `tenantId`
- `name`
- `status`
- `createdAt`

## Smoke Test

```bash
npm run smoke
```

Verifies all7 endpoints return correct responses.

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

## Safety Boundaries

- Read-only tenant and vendor endpoints
- Audit foundation only (no automatic logging)
- No authentication or authorization
- No payment processing
- No write operations
- No category/product CRUD
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P5-006**: Category Read Service (requires PM approval)
