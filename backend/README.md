# ToplineShop Backend

NestJS backend service for ToplineShop multi-vendor SaaS marketplace.

## Current Status

**Bootstrap only** — This is the initial NestJS backend scaffold.

- ✅ NestJS application structure created
- ✅ Basic bootstrap and startup configured
- ✅ TypeScript configuration set
- ❌ No database connected
- ❌ No auth/RBAC implemented
- ❌ No API contract routes implemented
- ❌ No payment/commerce logic
- ❌ No CRM/ERP/FMCG modules

## Setup

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run start:dev

# Build
npm run build

# Production
npm run start:prod
```

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

## Next Step

**TOPLINE-P3-008**: Health Check API + Backend Smoke Test
