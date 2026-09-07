# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Audit Logging Foundation** — Audit module skeleton implemented.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Tenant read endpoints (`GET /tenants`, `GET /tenants/:id`)
- ✅ Audit logging foundation (AuditModule, AuditService)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No tenant write endpoints
- ❌ No vendor/category/product CRUD
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

## Audit Logging

### Current State

- AuditLog model exists in database (7 fields: id, tenantId, actorUserId, action, entityType, entityId, summary, metadata, createdAt)
- AuditModule and AuditService exist as foundation
- AuditService.recordEvent() method available for future use
- Metadata is sanitized (secrets redacted) before persistence
- **No automatic audit logging on current read endpoints**
- Audit logging will be activated for write operations in future tasks

### AuditEvent Fields

| Field | Required | Description |
|-------|----------|-------------|
| action | Yes | Event type (e.g., TENANT_CREATED) |
| entityType | Yes | Affected entity type |
| entityId | No | Affected entity ID |
| tenantId | No | Tenant context |
| actorUserId | No | User who performed action |
| metadata | No | Additional data (sanitized) |
| createdAt | No | Event timestamp |

### Security

- Sensitive keys (password, token, secret, apiKey, DATABASE_URL) are redacted
- Audit write failures are logged but do not crash requests
- No secrets in audit metadata

## Smoke Test

```bash
npm run smoke
```

Verifies all endpoints return correct responses.

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

## Safety Boundaries

- Read-only tenant endpoints
- Audit foundation only (no automatic logging)
- No authentication or authorization
- No payment processing
- No tenant write operations
- No vendor/category/product CRUD
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P5-005**: Vendor Read Service (requires PM approval)
