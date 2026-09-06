# Phase 2 — Public B2C Marketplace Frontend

## Objective

Build the complete public marketplace frontend with real page structure, central mock data, product browsing, category discovery, product detail, vendor storefront, and mobile responsiveness. All frontend-only, mock-data only, no backend.

## Entry Criteria

- Phase 1: PASS / CLOSED
- Foundation stable, build passing, component library reusable
- No backend, database, or auth dependencies

## Task Sequence

### TOPLINE-P2-001 — Phase 2 Readiness Audit + Plan
- Audit frontend foundation
- Verify Phase 1 closure
- Identify risks
- Plan Phase 2 task sequence
- Create WDR

### TOPLINE-P2-002 — Central Mock Marketplace Data + Types
- Create `src/data/` with centralized mock products, categories, vendors
- Define TypeScript interfaces for Product, Category, Vendor
- Replace scattered inline mock data across pages
- Single source of truth for all mock data
- Fix currency inconsistency (standardize to Naira)

### TOPLINE-P2-003 — Product Listing + Category Browsing UX
- Upgrade `/products` page with central mock data
- Upgrade `/categories` page with real category → product linking
- Add category detail route `/categories/[slug]`
- Implement filter/sort UI wiring (mock logic)
- Pagination UI

### TOPLINE-P2-004 — Product Detail Page UX
- Create `/products/[id]` dynamic route
- Product image gallery placeholder
- Product info, variants, pricing, reviews section
- Add to cart button (UI only, no logic)
- Related products section
- Breadcrumb navigation

### TOPLINE-P2-005 — Vendor Storefront + B2B Discovery UX
- Create `/vendors/[slug]` dynamic route
- Vendor profile header, product grid
- Upgrade `/b2b` with central mock data
- Supplier detail route (optional)

### TOPLINE-P2-006 — Marketplace Homepage Refinement
- Upgrade `/marketplace` with central mock data
- Improve hero, featured sections
- Search bar UI (mock)
- Responsive mobile review

### TOPLINE-P2-007 — Cart/Checkout Placeholder Safety Review
- Verify all cart/checkout buttons are disabled
- Verify placeholder disclaimers consistent
- No hidden commerce logic
- Accessibility pass

### TOPLINE-P2-008 — Phase 2 Frontend Freeze Gate
- Full build verification
- Lint clean
- All routes render
- Mobile responsive audit
- Registry update
- Phase 2 closure WDR

## Not Allowed in Phase 2

- Backend / API
- Database / Prisma
- Auth / JWT / RBAC
- Real payment / checkout / order logic
- Real cart state management
- Package installation (unless task-approved)
- Push without approval

## Success Criteria

- All marketplace pages use central mock data
- Product detail page exists and renders
- Vendor storefront page exists
- Currency consistent (Naira)
- All placeholder badges present
- Build passes
- Lint passes (0 errors)
- No backend dependencies
