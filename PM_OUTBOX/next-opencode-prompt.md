# #MM — TOPLINE-P7-009 — Frontend API Client Write Methods

You are approved to execute exactly one governed task:

TOPLINE-P7-009 — Frontend API Client Write Methods

Follow #123:
DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT

Do not start TOPLINE-P7-010 or any later task.

Read only these files first:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- docs/PHASE-07-BACKEND-API-READINESS-PLAN.md
- src/project/projectRegistry.ts
- src/lib/api-client.ts
- src/types/api.ts
- backend/src/tenants/dto/create-tenant.dto.ts
- backend/src/vendors/dto/create-vendor.dto.ts
- backend/src/categories/dto/create-category.dto.ts
- backend/src/products/dto/create-product.dto.ts
- backend/src/tenants/tenants.controller.ts
- backend/src/vendors/vendors.controller.ts
- backend/src/categories/categories.controller.ts
- backend/src/products/products.controller.ts

Current governance state:

P7-008 and P7-008-R1 are PASS / CLOSED by PM audit.

Next approved task:

TOPLINE-P7-009 — Frontend API Client Write Methods

Objective:

Add frontend API client write support and typed request contracts for the Phase 7 backend write endpoints, while preserving all existing read methods and frontend screens.

Important scope clarification:

Only add frontend client methods for backend endpoints that actually exist now.

The current approved backend write endpoints are:
- POST /tenants
- POST /vendors
- POST /categories
- POST /products

Do not invent PATCH or DELETE client methods unless the backend controllers already expose matching PATCH/DELETE endpoints. If PATCH/DELETE are mentioned in the plan but not implemented in backend, document them as deferred in the WDR.

Required work:

1. Update src/types/api.ts with request types for:
   - CreateTenantRequest
   - CreateVendorRequest
   - CreateCategoryRequest
   - CreateProductRequest

2. Types must match the real backend DTO fields and validation:
   - Tenant: name, slug, type, status
   - Vendor: tenantId, name, slug, status, optional description, optional logo
   - Category: tenantId, name, slug, status, optional icon, optional parentId, optional sortOrder
   - Product: tenantId, vendorId, categoryId, name, slug, basePrice, status, optional description, optional currency, optional inStock

3. Update src/lib/api-client.ts:
   - preserve all existing GET methods exactly in behavior
   - add a shared write helper if useful
   - add createTenant(data)
   - add createVendor(data)
   - add createCategory(data)
   - add createProduct(data)
   - methods must use POST, JSON body, existing ApiResponse / ApiError handling style
   - encode path parts when path parts are used

4. Add lightweight verification for the frontend API client if the repo has an existing frontend test pattern. If no frontend test pattern exists, do not introduce a large new test framework. Instead run build/lint/type checks available in package scripts and document the limitation.

5. Update governance:
   - src/project/projectRegistry.ts
   - AGENT_REPORTS/latest-status.md
   - AGENT_REPORTS/latest-wdr-summary.md
   - PM_OUTBOX/next-opencode-prompt.md
   - new WDR

6. Write WDR:
   WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-009_WDR_2026-09-10.md

Strict out of scope:

- Do not modify backend implementation.
- Do not add backend endpoints.
- Do not implement PATCH/DELETE clients unless matching backend endpoints already exist.
- Do not modify frontend pages/components unless required for type compilation.
- Do not start P7-010.
- Do not implement auth/RBAC, payments, settlements, migrations, infrastructure, deployment, secrets, or business logic.
- Do not touch F:\OpenCode\shop.com.

Verification required:

Run and report:
- npm run build from project root
- any existing lint/type-check script if available
- git diff --check
- git status --short --untracked-files=all

Also verify:
- existing GET client methods remain present
- new POST methods target the correct paths
- request types align with backend DTOs
- no backend source files were modified

Git rules:

- Preserve unrelated user changes.
- Never use git add .
- Never use git add -A
- Never use git add --all
- Stage exact files only.
- Commit the task and report the exact commit hash.

Final response format:

TASK:
STATUS:
WDR:
COMMIT:
FILES CHANGED:
VERIFICATION:
STOPPED BEFORE NEXT TASK: YES
