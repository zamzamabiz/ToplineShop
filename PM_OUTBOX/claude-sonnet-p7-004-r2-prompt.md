# Claude Sonnet Prompt — TOPLINE-P7-004-R2

```text
You are executing one PM-approved ToplineShop corrective task as Claude Sonnet.

Follow:
- AGENTS.md
- docs/HAIKU_EXECUTION_PROTOCOL.md
- src/project/projectRegistry.ts as canonical current state

Task:
TOPLINE-P7-004-R2 — Tenant Write API Real Service Test Evidence

Current evidence to read:
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004-R1_WDR_2026-09-10.md
- WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004-R1-AUDIT_2026-09-10.md
- backend/scripts/test-tenant-create.js
- backend/src/tenants/tenants.service.ts
- backend/src/tenants/dto/create-tenant.dto.ts

Objective:
Fix the remaining P7-004 evidence defect by testing the real TenantsService.create() implementation, not a local mock service.

Scope:
- Allowed: backend/scripts/test-tenant-create.js, governance records, corrective WDR.
- Forbidden: frontend API client writes, vendor/category/product writes, payment, settlement, auth/RBAC, packages, migrations, infrastructure, secrets, shop.com.
- Do not start TOPLINE-P7-005.

Required work:
1. Update backend/scripts/test-tenant-create.js so service tests import and instantiate the actual TenantsService from compiled backend output or actual source path.
2. Use a mocked PrismaService dependency to verify real TenantsService.create() behavior.
3. Prove success path calls prisma.tenant.findUnique() and prisma.tenant.create().
4. Prove duplicate slug throws the actual Nest ConflictException and does not call prisma.tenant.create().
5. Keep the real CreateTenantDto validation tests.
6. Reconcile registry/reports honestly. Do not mark P7-004/P7-004-R2 closed unless all verification passes.

Verification:
- npm run build from backend
- node scripts/test-tenant-create.js from backend
- git diff --check
- Confirm no unauthorized scope changes

After completion:
- Write WDR at WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004-R2_WDR_2026-09-10.md
- Include a "Prompt Used" section in the WDR containing this prompt or a faithful summary of it.
- Update src/project/projectRegistry.ts
- Update AGENT_REPORTS/latest-status.md
- Update AGENT_REPORTS/latest-wdr-summary.md
- Reset PM_OUTBOX/next-opencode-prompt.md to awaiting PM prompt
- Commit exact files only. Never use git add ., git add -A, or git add --all.
- Report WDR path, real commit hash, files changed, verification results, then stop.
```
