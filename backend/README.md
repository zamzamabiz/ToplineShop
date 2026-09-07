# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Core Schema Foundation** — 7 Prisma models implemented, no migrations executed.

- ✅ NestJS application structure
- ✅ Health endpoint (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service scaffold)
- ✅ Core schema models (7 models, 7 enums)
- ❌ No migrations created or run
- ❌ No database connection active
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
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

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

**Note:** Schema has 7 models (Tenant, User, Membership, Vendor, Category, Product, AuditLog) and 7 enums. No migrations executed yet. No database connection active.

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Bootstrap status check |
| `/health` | GET | System health with subsystem status |
| `/version` | GET | Service version info |

### `GET /`

```json
{
  "message": "ToplineShop backend bootstrap is running",
  "status": "ok"
}
```

### `GET /health`

```json
{
  "status": "ok",
  "service": "toplineshop-api",
  "version": "0.1.0",
  "environment": "development",
  "checks": {
    "api": "ok",
    "database": "not_configured",
    "auth": "not_configured",
    "payments": "locked"
  }
}
```

### `GET /version`

```json
{
  "service": "toplineshop-api",
  "version": "0.1.0",
  "phase": "P3-008"
}
```

## Smoke Test

```bash
npm run smoke
```

Verifies all three endpoints return correct responses. Exits non-zero on failure.

## Configuration

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

See `.env.example` for available configuration options.

## Safety Boundaries

- Core schema models implemented (7 models, 7 enums)
- No migrations created or run
- No database connection active
- No authentication or authorization
- No payment processing
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P4-004B**: Local PostgreSQL connection + migration run (requires PM approval)
