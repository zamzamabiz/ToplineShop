# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Category Read Service** — Read-only category API implemented.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Tenant read endpoints (`GET /tenants`, `GET /tenants/:id`)
- ✅ Vendor read endpoints (`GET /vendors`, `GET /vendors/:id`)
- ✅ Category read endpoints (`GET /categories`, `GET /categories/:id`)
- ✅ Audit logging foundation (AuditModule, AuditService)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No tenant/vendor/category write endpoints
- ❌ No product CRUD
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
| `/vendors` | GET | List vendors (read-only, optional `?tenantId=`) |
| `/vendors/:id` | GET | Get vendor by ID (read-only) |
| `/categories` | GET | List categories (read-only, optional `?tenantId=`, `?parentId=`) |
| `/categories/:id` | GET | Get category by ID (read-only) |

### `GET /categories`

Returns safe category summaries. Optional query parameters:
- `tenantId` — filter by tenant
- `parentId` — filter by parent category (use `null` for root categories)

```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "tenantId": "...",
      "parentId": "...",
      "name": "...",
      "status": "...",
      "sortOrder": 0,
      "createdAt": "..."
    }
  ],
  "meta": {
    "count": 0,
    "phase": "P5-006"
  }
}
```

**Note:** Empty list is acceptable if no categories exist. No seed data required.

### `GET /categories/:id`

Returns single category summary or 404 if not found.

### Category DTO Safe Fields

Only these fields are returned:
- `id`
- `tenantId`
- `parentId`
- `name`
- `status`
- `sortOrder`
- `createdAt`

## Smoke Test

```bash
npm run smoke
```

Verifies all 9 endpoints return correct responses.

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

## Safety Boundaries

- Read-only tenant, vendor, and category endpoints
- Audit foundation only (no automatic logging)
- No authentication or authorization
- No payment processing
- No write operations
- No product CRUD
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P5-007**: Product Read Service (requires PM approval)
