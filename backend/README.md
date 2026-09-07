# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Tenant Read Service** — Read-only tenant API implemented.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Tenant read endpoints (`GET /tenants`, `GET /tenants/:id`)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No tenant write endpoints
- ❌ No vendor/category/product CRUD
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

### `GET /tenants`

Returns safe tenant summaries only.

```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "name": "...",
      "type": "...",
      "status": "...",
      "createdAt": "..."
    }
  ],
  "meta": {
    "count": 0,
    "phase": "P5-003"
  }
}
```

**Note:** Empty list is acceptable if no tenants exist. No seed data required.

### `GET /tenants/:id`

Returns single tenant summary or404 if not found.

**Not found response:**
```json
{
  "statusCode": 404,
  "message": "Tenant not found"
}
```

### Tenant DTO Safe Fields

Only these fields are returned:
- `id`
- `name`
- `type`
- `status`
- `createdAt`

Not returned: secrets, DB info, relations, internal flags.

## Smoke Test

```bash
npm run smoke
```

Verifies all endpoints return correct responses. Validates:
- `ok === true` on success endpoints
- `/tenants` returns array
- `/tenants/:id` handles not-found safely (404)
- No secrets or DATABASE_URL in responses

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

## Safety Boundaries

- Read-only tenant endpoints
- No authentication or authorization
- No payment processing
- No tenant write operations (create/update/delete)
- No vendor/category/product CRUD
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P5-004**: Audit Logging Foundation (requires PM approval)
