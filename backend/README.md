# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Product Read Service** — Read-only product API implemented. Phase 5 complete.

- ✅ NestJS application structure
- ✅ Common API response standard (`ok`, `data`, `meta`)
- ✅ Health endpoint with database status (`GET /health`)
- ✅ Version endpoint (`GET /version`)
- ✅ Tenant read endpoints (`GET /tenants`, `GET /tenants/:id`)
- ✅ Vendor read endpoints (`GET /vendors`, `GET /vendors/:id`)
- ✅ Category read endpoints (`GET /categories`, `GET /categories/:id`)
- ✅ Product read endpoints (`GET /products`, `GET /products/:id`)
- ✅ Audit logging foundation (AuditModule, AuditService)
- ✅ Smoke test script (11 endpoints)
- ✅ Prisma installed (schema + service)
- ✅ Core schema models (7 models, 7 enums)
- ✅ Local PostgreSQL migration applied
- ✅ Database health check (SELECT 1)
- ❌ No auth/RBAC implemented
- ❌ No payment/commerce logic
- ❌ No write endpoints
- ❌ No automatic audit logging on read endpoints

## Setup

```bash
npm install
npm run build
npm run start:dev
```

## API Response Standard

```json
{ "ok": true, "data": { ... }, "meta": { ... } }
```

## Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Bootstrap status |
| `/health` | GET | Health + DB status |
| `/version` | GET | Version info |
| `/tenants` | GET | List tenants (read-only) |
| `/tenants/:id` | GET | Get tenant |
| `/vendors` | GET | List vendors (read-only, optional `?tenantId=`) |
| `/vendors/:id` | GET | Get vendor |
| `/categories` | GET | List categories (read-only, optional `?tenantId=`, `?parentId=`) |
| `/categories/:id` | GET | Get category |
| `/products` | GET | List products (read-only, optional `?tenantId=`, `?vendorId=`, `?categoryId=`, `?status=`) |
| `/products/:id` | GET | Get product |

## Smoke Test

```bash
npm run smoke
```

## Safety Boundaries

- Read-only endpoints only
- No authentication or authorization
- No payment processing
- No write operations
- No real secrets committed

## Next Steps

- Phase 6: Admin & Platform Owner Frontend (requires PM approval)
