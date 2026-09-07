# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**API Standards + Database Health** — Common response format and database health status implemented.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Smoke test script
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No business CRUD APIs
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

### Error (future)

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

### `GET /`

```json
{
  "ok": true,
  "data": {
    "message": "ToplineShop backend bootstrap is running",
    "status": "ok"
  }
}
```

### `GET /health`

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "service": "toplineshop-api",
    "version": "0.1.0",
    "environment": "development",
    "checks": {
      "api": "ok",
      "prisma": "configured",
      "database": "ok",
      "auth": "not_configured",
      "payments": "locked"
    }
  },
  "meta": {
    "phase": "P5-002"
  }
}
```

**Database health behavior:**
- Runs `SELECT 1` through Prisma on each request
- Returns `"ok"` if database is reachable
- Returns `"unavailable"` if database connection fails
- Does not crash the backend if database is unavailable
- Does not expose DATABASE_URL, credentials, or error details

### `GET /version`

```json
{
  "ok": true,
  "data": {
    "service": "toplineshop-api",
    "version": "0.1.0",
    "phase": "P5-002"
  }
}
```

## Smoke Test

```bash
npm run smoke
```

Verifies all three endpoints return standardized responses. Validates:
- `ok === true` on all endpoints
- `/health` includes `api`, `prisma`, `database`, `auth`, `payments` checks
- No secrets or DATABASE_URL in responses
- No password fields in responses

## Prisma Commands

```bash
# Validate schema
npm run prisma:validate

# Generate Prisma client
npm run prisma:generate
```

## Safety Boundaries

- Common API response standard implemented
- Database health check (non-business SELECT 1)
- No authentication or authorization
- No payment processing
- No business CRUD APIs
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P5-003**: Tenant Read Service (requires PM approval)
