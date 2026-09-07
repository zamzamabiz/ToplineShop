# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Health Check + Smoke Test** — Minimal backend with system readiness endpoints.

- ✅ NestJS application structure
- ✅ Health endpoint (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Smoke test script
- ❌ No database connected
- ❌ No auth/RBAC implemented
- ❌ No API contract routes implemented
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

- No database schema or migrations
- No authentication or authorization
- No payment processing
- No real secrets committed
- Frontend at root remains unchanged

## Next Steps

- **TOPLINE-P3-009**: Database schema design (future)
