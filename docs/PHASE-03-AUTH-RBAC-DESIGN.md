# ToplineShop — Auth & RBAC Design Document

> **Status**: DESIGN DOCUMENT — NO AUTH IMPLEMENTATION CREATED  
> **Date**: 2026-09-07  
> **Author**: Implementation Agent under PM governance  
> **Approval Required**: PM before any auth implementation or package installation

---

## 1. Purpose

This document defines the authentication and role-based access control (RBAC) design for ToplineShop — a SaaS-first, multi-tenant, modular business platform.

It establishes the foundation for:
- User identity and session management
- Tenant-aware organization membership
- Permission-based access control
- Module-level access configuration
- Financial and AI governance guardrails
- Audit logging policy

**This is a design artifact only.** No auth packages, backend code, database schemas, or API routes have been created.

---

## 2. Current State

| Item | Status |
|------|--------|
| Auth implementation | Does not exist |
| Backend | Does not exist |
| Database | Does not exist |
| API endpoints | Do not exist |
| Packages (Auth.js, JWT, Passport) | Not installed |
| Frontend | Frozen (17 routes, mock data) |
| Users/roles | Mock-only, no real auth |

---

## 3. Auth/RBAC Design Principles

1. **Tenant-aware**: Every authenticated identity is scoped to one or more tenant organizations.
2. **Permission-based**: Access control uses explicit permissions, not only role-name checks.
3. **Module-aware**: Roles and permissions are scoped to specific platform modules.
4. **Multi-business capable**: RBAC supports marketplace, B2B, and all future modules.
5. **No single-business hardcoding**: Auth design is not limited to marketplace only.
6. **Owner/Admin powerful but audited**: Super admin access exists but is fully logged.
7. **Vendor isolation**: Vendor users access only their assigned vendor(s).
8. **Customer boundary**: Customers cannot access vendor, admin, or owner areas.
9. **Wholesale buyer approval**: B2B buyer access requires explicit approval.
10. **Financial safety**: Financial actions require special permissions and approval gates.
11. **AI governance**: AI actions require human approval for sensitive operations.
12. **Backend-enforced**: All RBAC enforced server-side; frontend guards are UX only.
13. **Future-proof**: Foundation supports CRM, ERP, FMCG, healthcare, education, property modules.

---

## 4. Identity Model Design

### 4.1 User

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique, login identifier |
| phone | VARCHAR(20) | Optional, unique if provided |
| name | VARCHAR(255) | Display name |
| avatar | TEXT | Profile image URL |
| status | UserStatus | ACTIVE, SUSPENDED, DEACTIVATED |
| emailVerified | BOOLEAN | Email verification flag |
| createdAt | TIMESTAMP | Account creation |
| updatedAt | TIMESTAMP | Last profile update |

### 4.2 Tenant / Organization

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Organization name |
| slug | VARCHAR(255) | URL-friendly identifier |
| type | TenantType | PLATFORM, VENDOR, CUSTOMER_ORG, WHOLESALER |
| status | TenantStatus | ACTIVE, SUSPENDED, ARCHIVED |
| parentId | UUID | FK → Tenant (for org hierarchy) |
| createdAt | TIMESTAMP | Creation timestamp |

**Platform Tenant**: The ToplineShop platform itself (owned by Owner/Super Admin).
**Vendor Tenant**: Each vendor is a tenant.
**Customer Org**: Optional organizational accounts for B2B customers.

### 4.3 TenantMembership

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| tenantId | UUID | FK → Tenant |
| status | MembershipStatus | ACTIVE, INVITED, SUSPENDED |
| joinedAt | TIMESTAMP | Membership timestamp |

**Constraint**: A user may belong to multiple tenants (e.g., Platform Admin + Vendor Manager).

### 4.4 Role

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(100) | Unique role name |
| displayName | VARCHAR(255) | Human-readable label |
| scope | RoleScope | PLATFORM, TENANT, MODULE |
| description | TEXT | Role purpose |
| isSystem | BOOLEAN | System-defined vs custom |
| createdAt | TIMESTAMP | Creation timestamp |

### 4.5 Permission

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| code | VARCHAR(100) | Unique permission code (module.resource.action) |
| module | VARCHAR(50) | Target module name |
| resource | VARCHAR(50) | Target resource type |
| action | VARCHAR(20) | Action type |
| description | TEXT | Permission purpose |
| isDangerous | BOOLEAN | Requires stricter controls |

### 4.6 RolePermission

| Field | Type | Description |
|-------|------|-------------|
| roleId | UUID | FK → Role |
| permissionId | UUID | FK → Permission |

**Constraint**: Many-to-many between roles and permissions.

### 4.7 TenantMembershipRole

| Field | Type | Description |
|-------|------|-------------|
| membershipId | UUID | FK → TenantMembership |
| roleId | UUID | FK → Role |

**Constraint**: A membership may have multiple roles within a tenant.

### 4.8 Module

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(50) | Unique module identifier |
| displayName | VARCHAR(100) | Human-readable label |
| description | TEXT | Module purpose |
| isActive | BOOLEAN | Globally enabled/disabled |
| createdAt | TIMESTAMP | Creation timestamp |

### 4.9 TenantModule

| Field | Type | Description |
|-------|------|-------------|
| tenantId | UUID | FK → Tenant |
| moduleId | UUID | FK → Module |
| isEnabled | BOOLEAN | Per-tenant enablement |
| enabledAt | TIMESTAMP | When enabled |
| enabledBy | UUID | FK → User (admin) |

**Constraint**: A tenant only has access to modules explicitly enabled for them.

### 4.10 VendorMembership

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| vendorId | UUID | FK → Vendor |
| role | VendorRole | OWNER, MANAGER, STAFF |
| status | MembershipStatus | ACTIVE, INVITED, SUSPENDED |
| createdAt | TIMESTAMP | Membership timestamp |

**Constraint**: Vendor users can only access their assigned vendor's data.

### 4.11 AuthAccount (Future)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| provider | VARCHAR(50) | email, google, github, etc. |
| providerAccountId | VARCHAR(255) | External account ID |
| accessToken | TEXT | OAuth token (encrypted) |
| refreshToken | TEXT | OAuth refresh token (encrypted) |
| expiresAt | TOKEN | Token expiration |

### 4.12 Session (Future)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK → User |
| tenantId | UUID | FK → Tenant (active tenant context) |
| token | TEXT | Session token (encrypted) |
| ipAddress | VARCHAR(45) | Client IP |
| userAgent | TEXT | Client user agent |
| expiresAt | TIMESTAMP | Session expiration |
| createdAt | TIMESTAMP | Session creation |

### 4.13 ApprovalGate

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| tenantId | UUID | FK → Tenant |
| action | VARCHAR(100) | Action requiring approval |
| requestedBy | UUID | FK → User |
| approvedBy | UUID | FK → User (nullable) |
| status | ApprovalStatus | PENDING, APPROVED, REJECTED |
| reason | TEXT | Justification |
| createdAt | TIMESTAMP | Request timestamp |
| resolvedAt | TIMESTAMP | Approval/rejection timestamp |

### 4.14 AuditLog

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| tenantId | UUID | FK → Tenant (nullable for platform events) |
| userId | UUID | FK → User (nullable for system events) |
| action | VARCHAR(100) | Event type |
| resource | VARCHAR(100) | Affected resource |
| resourceId | UUID | Affected resource ID |
| details | JSONB | Event metadata |
| ipAddress | VARCHAR(45) | Client IP |
| createdAt | TIMESTAMP | Event timestamp |

---

## 5. Role Model Design

### 5.1 Platform-Level Roles

| Role | Scope | Description |
|------|-------|-------------|
| **Guest** | PLATFORM | Unauthenticated visitor |
| **Registered Customer** | PLATFORM | Authenticated marketplace buyer |
| **Wholesale Buyer** | PLATFORM | Approved B2B wholesale purchaser |
| **Platform Admin** | PLATFORM | Platform operations staff |
| **Owner / Super Admin** | PLATFORM | Platform owner, full access |

### 5.2 Tenant-Level Roles

| Role | Scope | Description |
|------|-------|-------------|
| **Vendor Owner** | TENANT | Vendor business owner |
| **Vendor Manager** | TENANT | Vendor operations manager |
| **Vendor Staff** | TENANT | Vendor employee (limited access) |
| **Support Staff** | TENANT | Platform support for tenant issues |

### 5.3 Future Module Roles (Design Only)

| Module | Role | Scope | Description |
|--------|------|-------|-------------|
| CRM | CRM Agent | MODULE | Customer relationship handler |
| CRM | CRM Manager | MODULE | CRM team lead |
| ERP | ERP Operator | MODULE | Operations staff |
| ERP | ERP Finance Manager | MODULE | Finance/approval authority |
| FMCG | FMCG Sales Agent | MODULE | Field sales representative |
| FMCG | FMCG Distribution Manager | MODULE | Distribution operations |
| Property | Property Agent | MODULE | Real estate agent |
| Property | Property Manager | MODULE | Property management |
| Consulting | Consultant | MODULE | Professional consultant |
| Appointment | Receptionist | MODULE | Appointment scheduling |
| Healthcare | Doctor/Provider | MODULE | Medical professional |
| Healthcare | Clinic Admin | MODULE | Clinic operations |
| Education | School Admin | MODULE | School operations |
| Education | Teacher | MODULE | Teaching staff |
| Education | Parent/Guardian | MODULE | Parent account |
| Education | Student | MODULE | Student account |

**Important**: Future roles are design-only and not active now.

---

## 6. Permission Design

### 6.1 Naming Convention

**Format**: `module.resource.action`

### 6.2 Action Types

| Action | Risk Level | Description |
|--------|------------|-------------|
| read | LOW | View data |
| create | LOW | Create new records |
| update | MEDIUM | Modify existing records |
| delete | HIGH | Remove records |
| approve | HIGH | Authorize actions |
| reject | MEDIUM | Deny requests |
| export | HIGH | Extract data |
| manage | HIGH | Full CRUD + configuration |
| override | CRITICAL | Bypass normal controls |

### 6.3 Permission Examples

#### Marketplace Module
```
marketplace.products.read
marketplace.products.create
marketplace.products.update
marketplace.products.delete
marketplace.orders.read
marketplace.orders.create
marketplace.orders.cancel
marketplace.reviews.read
marketplace.reviews.create
marketplace.categories.read
marketplace.vendors.read
```

#### Vendor Module
```
vendor.products.read
vendor.products.create
vendor.products.update
vendor.products.delete
vendor.orders.read
vendor.orders.update
vendor.orders.ship
vendor.analytics.read
vendor.profile.update
```

#### B2B Wholesale Module
```
b2b.rfq.create
b2b.rfq.read
b2b.rfq.respond
b2b.contracts.read
b2b.contracts.create
b2b.buyers.read
b2b.buyers.approve
```

#### Admin Module
```
admin.users.read
admin.users.suspend
admin.vendors.read
admin.vendors.approve
admin.vendors.suspend
admin.products.read
admin.products.suspend
admin.analytics.read
admin.settings.manage
```

#### Owner Module
```
owner.finance.read
owner.finance.approve
owner.finance.export
owner.users.manage
owner.vendors.manage
owner.platform.manage
owner.audit.read
owner.approvals.manage
```

#### Financial Operations
```
financial.payments.read
financial.payments.process
financial.refunds.approve
financial.settlements.read
financial.settlements.execute
financial.ledger.read
financial.ledger.adjust
financial.commissions.read
```

#### AI Operations
```
ai.suggestions.read
ai.suggestions.approve
ai.classification.read
ai.classification.execute
ai.proposals.read
ai.proposals.approve
```

#### Future Module Permissions
```
crm.leads.read
crm.leads.create
crm.leads.assign
crm.contacts.read
crm.pipeline.read

erp.inventory.read
erp.inventory.manage
erp.ledger.read
erp.ledger.adjust
erp.procurement.read
erp.procurement.approve

fmcg.routes.manage
fmcg.orders.read
fmcg.orders.assign

clinic.appointments.read
clinic.appointments.manage
clinic.patients.read
clinic.patients.manage

school.students.read
school.students.manage
school.fees.read
school.fees.collect
school.attendance.read
school.attendance.mark

property.listings.read
property.listings.manage
property.leads.read
property.deals.read
property.deals.manage
```

### 6.4 Permission Rules

1. **Delete/Override/Export**: Require stricter controls, logged, may require approval.
2. **Financial permissions**: Separate from general admin; require special authorization.
3. **Module permissions**: Only effective if module is enabled for the tenant.
4. **Tenant-scoped**: Permissions only apply within the tenant context.
5. **Owner override**: Super Admin may bypass, but all overrides are audit-logged.

---

## 7. Tenant + Module Access Design

### 7.1 Access Resolution

User access = `TenantMembership × Role × Permission × TenantModule`

```
User → TenantMembership(s) → TenantMembershipRole(s) → RolePermission(s) → Permission(s)
                                                                                     ↓
Tenant → TenantModule(s) → Module (enabled/disabled)
                                                                                     ↓
                              Access = Permission ∩ Module.enabled
```

### 7.2 Access Rules

1. **Module must be enabled**: User cannot access module features if module is disabled for tenant.
2. **Role must be assigned**: User must have a role with the required permission.
3. **Membership must be active**: Suspended memberships grant no access.
4. **User must be active**: Suspended/deactivated users cannot authenticate.

### 7.3 Tenant Hierarchy

```
Platform Tenant (ToplineShop)
├── Vendor Tenant A
│   ├── Vendor Owner
│   ├── Vendor Manager
│   └── Vendor Staff
├── Vendor Tenant B
│   ├── Vendor Owner
│   └── Vendor Staff
├── Customer Org X (B2B)
│   └── Wholesale Buyer
└── Customer Org Y (B2B)
    └── Wholesale Buyer
```

### 7.4 Special Access Rules

- **Owner / Super Admin**: Can see all tenants, but actions are audit-logged.
- **Platform Admin**: Limited tenant support access; cannot access vendor financials.
- **Vendor users**: Restricted to assigned vendor(s); cannot see other vendors' data.
- **Wholesale buyers**: Require explicit approval; access limited to B2B module.
- **Customers**: Cannot access vendor, admin, or owner areas.

---

## 8. Route Access Matrix

### 8.1 Public Routes (No Auth Required)

| Route | Access |
|-------|--------|
| `/` | Guest |
| `/marketplace` | Guest |
| `/products` | Guest |
| `/products/[id]` | Guest |
| `/categories` | Guest |
| `/categories/[slug]` | Guest |
| `/vendors` | Guest |
| `/vendors/[slug]` | Guest |
| `/auth/login` | Guest |
| `/auth/register` | Guest |

### 8.2 Customer Routes (Auth Required)

| Route | Access |
|-------|--------|
| `/cart` | Registered Customer |
| `/orders` | Registered Customer |
| `/orders/[id]` | Registered Customer (own orders) |
| `/account` | Registered Customer |
| `/account/profile` | Registered Customer |

### 8.3 Wholesale Routes (Auth + Approval Required)

| Route | Access |
|-------|--------|
| `/b2b` | Wholesale Buyer |
| `/b2b/rfq` | Wholesale Buyer |
| `/b2b/orders` | Wholesale Buyer |

### 8.4 Vendor Routes (Vendor Membership Required)

| Route | Access |
|-------|--------|
| `/vendor` | Vendor Owner, Vendor Manager, Vendor Staff |
| `/vendor/dashboard` | Vendor Owner, Vendor Manager |
| `/vendor/products` | Vendor Owner, Vendor Manager, Vendor Staff |
| `/vendor/orders` | Vendor Owner, Vendor Manager, Vendor Staff |

### 8.5 Admin Routes (Platform Admin Required)

| Route | Access |
|-------|--------|
| `/admin` | Platform Admin |
| `/admin/vendors` | Platform Admin |
| `/admin/users` | Platform Admin |
| `/admin/products` | Platform Admin |
| `/admin/analytics` | Platform Admin |

### 8.6 Owner Routes (Super Admin Required)

| Route | Access |
|-------|--------|
| `/owner` | Owner / Super Admin |
| `/owner/finance` | Owner / Super Admin |
| `/owner/approvals` | Owner / Super Admin |
| `/owner/audit` | Owner / Super Admin |
| `/owner/platform` | Owner / Super Admin |

### 8.7 Project Management Routes

| Route | Access |
|-------|--------|
| `/project-management` | Owner / Super Admin (production) |

### 8.8 Future Module Routes (Not Active)

| Module | Route Pattern | Access |
|--------|---------------|--------|
| CRM | `/crm/*` | CRM Agent, CRM Manager |
| ERP | `/erp/*` | ERP Operator, ERP Finance Manager |
| FMCG | `/fmcg/*` | FMCG Sales Agent, FMCG Distribution Manager |
| Healthcare | `/clinic/*` | Doctor/Provider, Clinic Admin |
| Education | `/school/*` | School Admin, Teacher, Parent, Student |
| Property | `/property/*` | Property Agent, Property Manager |
| Consulting | `/consulting/*` | Consultant |

---

## 9. API RBAC Design

### 9.1 API Route Groups

| Group | Pattern | Auth Required | RBAC Required |
|-------|---------|---------------|---------------|
| Public | `/api/v1/products/*`, `/api/v1/vendors/*` | No | No |
| Auth | `/api/v1/auth/*` | Varies | Varies |
| Customer | `/api/v1/cart/*`, `/api/v1/orders/*` | Yes | Customer role |
| Wholesale | `/api/v1/b2b/*` | Yes | Wholesale Buyer |
| Vendor | `/api/v1/vendor/*` | Yes | Vendor role + membership |
| Admin | `/api/v1/admin/*` | Yes | Platform Admin |
| Owner | `/api/v1/owner/*` | Yes | Owner / Super Admin |
| CRM | `/api/v1/crm/*` (future) | Yes | CRM role |
| ERP | `/api/v1/erp/*` (future) | Yes | ERP role |

### 9.2 RBAC Enforcement Rules

1. **Backend must enforce**: All RBAC checks performed server-side.
2. **Frontend guards are UX only**: Route guards, UI hiding — not security.
3. **Token validation**: Every authenticated API call validates session/JWT.
4. **Tenant context**: API resolves active tenant from session.
5. **Permission check**: API verifies user has required permission for action.
6. **Module check**: API verifies module is enabled for tenant.
7. **Vendor scoping**: Vendor APIs verify user's vendor membership matches target vendor.

### 9.3 API Error Responses

| Status | Error Code | Description |
|--------|------------|-------------|
| 401 | UNAUTHENTICATED | Missing or invalid credentials |
| 403 | FORBIDDEN | Authenticated but insufficient permissions |
| 403 | MODULE_DISABLED | Module not enabled for tenant |
| 403 | VENDOR_MISMATCH | User not member of target vendor |
| 403 | TENANT_SUSPENDED | Tenant account suspended |

---

## 10. Financial Safety RBAC

### 10.1 Financial Permissions

Financial operations require dedicated permissions:

```
financial.payments.read
financial.payments.process
financial.refunds.request
financial.refunds.approve
financial.settlements.read
financial.settlements.execute
financial.ledger.read
financial.ledger.adjust
financial.commissions.read
financial.commissions.calculate
```

### 10.2 Approval Requirements

| Operation | Approval Required | Approver |
|-----------|-------------------|----------|
| Payment processing | Yes (above threshold) | Owner / ERP Finance Manager |
| Refund approval | Yes | Owner / ERP Finance Manager |
| Settlement execution | Yes | Owner |
| Ledger adjustment | Yes | Owner |
| Commission override | Yes | Owner |
| Payout processing | Yes | Owner |

### 10.3 Safety Rules

1. **No single-staff completion**: High-risk financial actions require maker-checker.
2. **Owner approval required**: Sensitive financial operations require Owner authorization.
3. **Audit logged**: All financial actions recorded in audit log.
4. **Threshold-based**: Small amounts may auto-approve; large amounts require escalation.
5. **Payment provider deferred**: Actual payment integration deferred to Phase 9+.

---

## 11. Audit Logging Policy

### 11.1 Required Audit Events

| Category | Events |
|----------|--------|
| **Security** | login, logout, login_failed, password_change, mfa_enable, mfa_disable |
| **Identity** | user_created, user_updated, user_suspended, user_deactivated |
| **Membership** | membership_created, membership_updated, membership_suspended |
| **Role** | role_assigned, role_removed, role_created, role_updated |
| **Permission** | permission_granted, permission_revoked |
| **Tenant** | tenant_created, tenant_updated, tenant_suspended |
| **Module** | module_enabled, module_disabled |
| **Vendor** | vendor_approved, vendor_suspended, vendor_verification_updated |
| **Wholesale** | buyer_approved, buyer_rejected |
| **Product** | product_created, product_updated, product_suspended, product_archived |
| **Order** | order_created, order_updated, order_cancelled, order_completed |
| **Financial** | payment_processed, refund_approved, settlement_executed, ledger_adjusted |
| **Export** | data_exported (with scope and record count) |
| **AI** | ai_proposal_created, ai_proposal_approved, ai_proposal_rejected |
| **Admin** | admin_override_used, platform_settings_updated |

### 11.2 Audit Log Fields

```
- id: UUID
- tenantId: UUID (nullable for platform events)
- userId: UUID (nullable for system events)
- action: VARCHAR(100)
- resource: VARCHAR(100)
- resourceId: UUID
- details: JSONB (before/after state, metadata)
- ipAddress: VARCHAR(45)
- userAgent: TEXT
- createdAt: TIMESTAMP
```

### 11.3 Audit Rules

1. **Immutable**: Audit logs cannot be modified or deleted.
2. **Retention**: Minimum 1 year retention; 7 years for financial events.
3. **Searchable**: Audit logs must be queryable by tenant, user, action, date range.
4. **Owner-only access**: Audit log viewing restricted to Owner / Super Admin.
5. **Export logging**: Audit log exports themselves are logged.

---

## 12. AI Governance RBAC

### 12.1 AI Permission Design

```
ai.suggestions.read          — View AI suggestions
ai.suggestions.approve       — Approve AI suggestions
ai.classification.read       — View AI classifications
ai.classification.execute    — Trigger AI classification
ai.proposals.read            — View AI proposals
ai.proposals.approve         — Approve AI proposals
ai.reports.read              — View AI-generated reports
```

### 12.2 AI Safety Rules

1. **AI may suggest**: Classify, summarize, recommend, propose.
2. **AI must not directly approve**: Financial, legal, tax, destructive, vendor penalty, customer penalty, refund, settlement, or ledger actions.
3. **Human approval required**: All AI action proposals require human review.
4. **Tenant isolation**: AI access respects tenant boundaries.
5. **Module permissions**: AI operations respect module-level RBAC.
6. **Audit logged**: All AI actions and approvals recorded.

### 12.3 AI Action Matrix

| AI Action | Human Approval Required | Approver Role |
|-----------|-------------------------|---------------|
| Product classification | No (if auto-classify enabled) | — |
| Price recommendation | Yes | Vendor Owner, Admin |
| Inventory alert | No (notification only) | — |
| Order routing suggestion | Yes | Admin |
| Refund recommendation | Yes | Owner / Finance Manager |
| Vendor rating | No (display only) | — |
| Content generation | Yes (before publish) | Admin, Vendor Manager |
| Financial report | No (read-only) | — |
| Settlement suggestion | Yes | Owner |

---

## 13. Future Module Role Support

### 13.1 Module Role Extension Pattern

When a new module is added:

1. Register module in `Module` table.
2. Define module-specific roles in `Role` table (scope = MODULE).
3. Define module permissions in `Permission` table.
4. Link roles to permissions via `RolePermission`.
5. Enable module for tenant via `TenantModule`.
6. Assign roles to tenant members via `TenantMembershipRole`.

### 13.2 Example: CRM Module Activation

```
1. Module: { name: "crm", displayName: "CRM", isActive: true }
2. Roles: { name: "crm_agent", scope: "MODULE" }
         { name: "crm_manager", scope: "MODULE" }
3. Permissions: { code: "crm.leads.read", module: "crm", resource: "leads", action: "read" }
               { code: "crm.leads.create", module: "crm", resource: "leads", action: "create" }
               { code: "crm.leads.assign", module: "crm", resource: "leads", action: "assign" }
               { code: "crm.contacts.read", module: "crm", resource: "contacts", action: "read" }
               { code: "crm.pipeline.read", module: "crm", resource: "pipeline", action: "read" }
4. RolePermission: crm_agent → [crm.leads.read, crm.leads.create, crm.contacts.read]
                   crm_manager → [all crm permissions]
5. TenantModule: tenant_id → crm (enabled)
6. TenantMembershipRole: user_membership → crm_agent
```

### 13.3 Module Compatibility

| Module | Compatible Modules | Dependencies |
|--------|-------------------|--------------|
| Marketplace | B2B, CRM, ERP | None |
| B2B | Marketplace, CRM, ERP | Marketplace |
| CRM | Marketplace, B2B | None |
| ERP | Marketplace, B2B, CRM | None |
| FMCG | CRM, ERP | CRM |
| Healthcare | CRM | CRM |
| Education | CRM | CRM |
| Property | CRM | CRM |
| Consulting | CRM | CRM |

---

## 14. Auth Technology Options

### 14.1 Option A — NextAuth.js / Auth.js

| Aspect | Assessment |
|--------|------------|
| Pros | Next.js native, fast setup, OAuth providers, session management |
| Cons | Limited multi-tenant support, RBAC requires custom adapter, NestJS integration complex |
| SaaS/Multi-tenant Suitability | LOW — designed for single-tenant apps |
| Risk | May require significant customization for multi-tenant RBAC |
| Recommended Timing | Not recommended for current architecture (NestJS backend) |

### 14.2 Option B — Custom JWT + NestJS Passport

| Aspect | Assessment |
|--------|------------|
| Pros | Full control, NestJS-native, flexible multi-tenant design, permission-based RBAC |
| Cons | More implementation effort, requires security expertise |
| SaaS/Multi-tenant Suitability | HIGH — fully customizable for complex RBAC |
| Risk | Requires careful security implementation |
| Recommended Timing | When backend bootstrap starts (Phase 3/4) |

### 14.3 Option C — External Provider (Keycloak/Auth0/Supabase Auth)

| Aspect | Assessment |
|--------|------------|
| Pros | Battle-tested, multi-tenant built-in, managed service, SSO support |
| Cons | Vendor dependency, cost at scale, may be overkill for initial launch |
| SaaS/Multi-tenant Suitability | VERY HIGH — enterprise-grade multi-tenant |
| Risk | Vendor lock-in, cost, complexity |
| Recommended Timing | Consider for Phase 7+ when scale requires |

### 14.4 Recommended Direction

**For now**: Design for backend-enforced RBAC. Auth implementation decision finalized when backend bootstrap starts.

**Recommended**: Option B (Custom JWT + NestJS Passport) for initial launch, with Option C as future consideration.

**Rationale**:
- Aligns with approved NestJS backend decision
- Full control over multi-tenant RBAC
- No vendor dependency during early stages
- Can migrate to external provider later if needed

---

## 15. Deferred Items

| Item | Status | Notes |
|------|--------|-------|
| Auth package installation | DEFERRED | No packages installed |
| Backend auth implementation | DEFERRED | No backend exists |
| JWT/session implementation | DEFERRED | No backend exists |
| Passport strategy | DEFERRED | No backend exists |
| Auth API routes | DEFERRED | No backend exists |
| Auth middleware | DEFERRED | No backend exists |
| Login/register UI wiring | DEFERRED | Backend must exist first |
| OAuth provider setup | DEFERRED | Decision deferred |
| MFA implementation | DEFERRED | Phase 5+ |
| Rate limiting | DEFERRED | Backend implementation |
| Password policy | DEFERRED | Backend implementation |

---

## 16. Owner Approval Gates

The following actions require Owner / Super Admin approval:

1. **Platform settings changes** — Global configuration
2. **Tenant creation/deletion** — New vendor organizations
3. **Module enablement** — New module activation for tenants
4. **Financial operations** — High-value payments, refunds, settlements
5. **Vendor suspension** — Permanent vendor account suspension
6. **User role escalation** — Granting Owner-level permissions
7. **Audit log access** — Viewing sensitive audit logs
8. **Data export** — Large-scale data extraction
9. **AI proposal approval** — For financial/destructive actions

---

## 17. Explicit "No Auth Implementation Created" Note

**This document is a design artifact only.**

- No auth packages installed (Auth.js, JWT, Passport, etc.)
- No backend code created
- No API routes created
- No controllers/services/modules created
- No database schemas or migrations created
- No real users, sessions, secrets, passwords, or tokens created
- No login/logout logic implemented
- No RBAC middleware implemented
- Frontend unchanged (17 routes, mock data only)
- No CRM/ERP/FMCG/hospital/school/property/appointment/consultant modules implemented
- No payment/checkout/order/RFQ/commerce logic implemented
- shop.com untouched
- TOPLINE-P3-006 not started

**All auth implementation requires PM/Owner approval via the governed task sequence.**
