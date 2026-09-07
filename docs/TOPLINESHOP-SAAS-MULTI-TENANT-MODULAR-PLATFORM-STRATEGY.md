# ToplineShop — SaaS Multi-Tenant Modular Business Platform Strategy

> **Status**: STRATEGY DOCUMENT — NO IMPLEMENTATION  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM/Owner before any module or backend implementation

---

## A. Purpose

This document establishes the strategic direction of ToplineShop as a SaaS-first, multi-tenant, modular business platform. It protects the future architecture before Auth/RBAC and backend implementation begins.

ToplineShop will not be designed as a single-purpose marketplace. It will be a platform capable of supporting multiple business verticals through modular extensions.

---

## B. Core Platform Decision

**ToplineShop will be designed as a SaaS-first, multi-tenant, modular business platform.**

It must support:
- Multiple business strategies
- Multiple future vertical applications
- Not only e-commerce

**First Active Product Module:** Marketplace / B2C / B2B Wholesale Commerce

---

## C. Platform Core vs Business Modules

### Platform Core (Shared Foundation)

| Component | Purpose |
|-----------|---------|
| Tenant / Organization model | Multi-tenant data isolation |
| Auth / RBAC | Authentication and role-based access |
| User profiles | Unified user management |
| Module registry | Enable/disable modules per tenant |
| Audit logs | Activity tracking for all modules |
| Notifications | Cross-module notification system |
| Owner/Admin control center | Platform oversight |
| Financial safety policy | Money operation guardrails |
| API contract standards | Consistent API design |
| Data isolation | Tenant-aware data boundaries |
| Feature enable/disable | Per-tenant module control |

### Business Modules (Future Extensions)

| Module | Status | Priority |
|--------|--------|----------|
| Marketplace (B2C) | Active (Phase 2) | Primary |
| B2B Wholesale | Active (Phase 3) | Primary |
| CRM | Future | Early |
| ERP | Future | Late |
| FMCG Distribution | Future | Deferred |
| Consulting | Future | Deferred |
| Property / Broker | Future | Deferred |
| Doctors / Appointments | Future | Deferred |
| Hospital / Clinic | Future | Deferred |
| Schools / Education | Future | Deferred |
| Service Business | Future | Deferred |
| Other SaaS modules | Future | Deferred |

---

## D. SaaS-First Policy

1. **Subscription-ready architecture** — designed for multi-tenant billing from day one
2. **Tenant-based access** — every organization is a tenant
3. **Configurable modules per tenant** — different tenants may have different modules active
4. **Owner/Admin controls** — platform-level and tenant-level administration
5. **No single-business hardcoding** — architecture supports multiple business types
6. **Scalable for multiple client organizations** — not limited to one business

---

## E. Multi-Tenant Policy

1. **Every future business record** must belong to a tenant/organization where applicable
2. **Tenant isolation is mandatory** — no cross-tenant data leakage
3. **Cross-tenant access forbidden** unless Owner/Admin policy explicitly allows
4. **Tenant-aware audit logs** — every action tagged with tenant context
5. **Tenant-aware feature flags** — modules enabled/disabled per tenant
6. **Tenant-aware billing later** — subscription and usage tracking per tenant
7. **Tenant-aware module controls** — each tenant configures its active modules

---

## F. Multi-Business / Multi-Vertical Strategy

Future modules may serve different industries:

| Industry | Module | Example Use |
|----------|--------|-------------|
| E-commerce | Marketplace | Product listing, ordering, delivery |
| Wholesale | B2B | Bulk orders, RFQ, supplier management |
| Distribution | FMCG | Distributor/retailer routes, stock movement |
| Professional Services | Consulting | Client management, appointments, deals |
| Real Estate | Property/Broker | Listings, leads, deals, commissions |
| Healthcare | Doctors/Appointments | Patient profiles, scheduling, billing |
| Healthcare | Hospital/Clinic | Departments, cases, operations |
| Education | Schools | Students, parents, fees, attendance |
| Service Business | Service Management | Bookings, service orders, invoicing |

**Important:** Do not make current marketplace depend on these future modules.

---

## G. Marketplace as First Active Module

1. **Marketplace remains first active module** — B2C/B2B commerce is primary focus
2. **Current frontend freeze remains protected** — no changes to Phase 0-2 work
3. **B2C/B2B commerce continues** as primary current business focus
4. **Other modules are future optional extensions** — not required for marketplace
5. **No current marketplace feature should be broken** for future modules

---

## H. CRM Future Policy

CRM will be introduced earlier as marketplace relationship management.

### Future CRM Scope

- Customer CRM
- Vendor CRM
- B2B buyer CRM
- Leads and inquiries
- Support follow-up
- Sales agent/referral tracking (later)
- Communication history
- Pipeline/status tracking

### CRM Requirements

- Tenant isolation
- RBAC
- Audit logs
- Module enable/disable controls

---

## I. ERP Future Policy

ERP will be introduced later as controlled operations, accounting, inventory, ledger, and settlement modules.

### Future ERP Scope

- Inventory management
- Procurement
- Vendor payouts
- Settlements
- Ledger
- Expenses
- Warehouse management
- Delivery/logistics
- Accounting summaries
- Tax/export reports (later)

### ERP Requirements

- Owner/Admin approval gated
- Audit-logged
- Financially safe
- Tenant-isolated
- Implemented only after backend, auth, database, order, and payment safety foundations are approved

---

## J. FMCG Distribution Future Policy

Future capabilities:

- Distributor management
- Retailer/customer routes
- Sales orders
- Stock movement
- Delivery planning
- Territory management
- Sales agent management
- Scheme/discount planning

**Status:** Future only. Not implemented now.

---

## K. Appointment / Clinic / Hospital / Doctor Future Policy

Future capabilities:

- Patient/customer profiles
- Appointment booking
- Doctor schedule
- Clinic departments
- Case history placeholder
- Billing integration (later)
- Notifications/reminders

**Status:** Future only. Medical/legal/privacy design required before implementation.

---

## L. School / Education Future Policy

Future capabilities:

- Student profiles
- Parent profiles
- Classes
- Fee records
- Attendance
- Notices
- Scheduling

**Status:** Future only. Separate education domain design required before implementation.

---

## M. Property / Broker / Consultant Future Policy

Future capabilities:

- Leads
- Clients
- Properties/projects
- Appointments
- Deals
- Documents
- Commission tracking (later)
- Follow-up pipeline

**Status:** Future only. No implementation now.

---

## N. Module Registry Strategy

1. **Future modules must be registered** in a module registry
2. **Modules can be enabled/disabled** per tenant
3. **Permission controlled** — each module defines its own roles/permissions
4. **UI navigation should be module-aware** later
5. **API routes should be module-aware** later
6. **Database records should be tenant-aware** later
7. **Module metadata** tracks version, dependencies, status

---

## O. Auth/RBAC Impact for P3-005

**P3-005 must design RBAC with:**

1. **Tenant/organization support** — roles scoped to tenant
2. **Module-aware permissions** — permissions tied to specific modules
3. **Future-proof role design** — not hardcoded only for marketplace
4. **Vendor/customer/doctor/teacher/property-manager style roles** — possible as future module roles
5. **Owner/Admin override** — controlled and audited
6. **Permission inheritance** — role → permissions → module access
7. **Cross-module roles** — user may have different roles in different modules

---

## P. Database/API Impact

### Database

1. **Shared platform-core tables** — Tenant, User, Role, Permission, Module, AuditLog
2. **Business-module tables separate** from platform-core tables
3. **Tenant ID on all business records** where applicable
4. **No marketplace-only assumptions** in shared tables
5. **Module registry table** tracks active modules per tenant

### API

1. **Module namespace** in API routes — `/api/v1/marketplace/*`, `/api/v1/crm/*`, etc.
2. **Shared endpoints** for platform-core — `/api/v1/auth/*`, `/api/v1/users/*`
3. **Module-aware RBAC** — middleware checks module + role + permission
4. **Consistent API contract standards** across all modules

---

## Q. Safety Boundaries

**No future module may bypass:**

- Tenant isolation
- RBAC
- Audit logging
- Financial safety
- Owner/Admin approval gates
- Platform API standards
- Data privacy rules
- Module enable/disable controls

---

## R. Deferred Implementation Note

**Clearly stated:**

- No CRM module implemented now
- No ERP module implemented now
- No FMCG/hospital/school/property/appointment/consultant modules implemented now
- No backend/API/database/auth/payment implementation now
- **This is strategy documentation only**

---

## S. Suggested Updated Phase Direction

| Phase | Focus |
|-------|-------|
| Phase 3 | Backend readiness and foundation |
| Phase 4 | Real catalog + vendor/product APIs |
| Phase 5 | Auth/RBAC + user/vendor/customer accounts |
| Phase 6 | Cart/order backend |
| Phase 7 | CRM foundation |
| Phase 8 | B2B RFQ + wholesale CRM |
| Phase 9 | Payment/ledger/settlement safety |
| Phase 10 | ERP foundation |

**Future industry modules should be added only after platform core is stable.**

---

## T. Explicit "No Implementation" Note

**This document is a strategy artifact only.**

- No CRM module implemented
- No ERP module implemented
- No FMCG/hospital/school/property/appointment/consultant modules implemented
- No backend/API/database/auth/payment implementation
- No packages installed
- Frontend unchanged

**All module implementation requires PM/Owner approval via the governed task sequence.**
