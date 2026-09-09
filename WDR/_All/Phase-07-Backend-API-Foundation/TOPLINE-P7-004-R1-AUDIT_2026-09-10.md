# TOPLINE-P7-004-R1 Audit — Tenant Write API Evidence Correction

## Decision

**Audit result: BLOCKED**

`TOPLINE-P7-004-R1` is not approved or closed.

## Evidence Reviewed

- WDR: `WDR/_All/Phase-07-Backend-API-Foundation/TOPLINE-P7-004-R1_WDR_2026-09-10.md`
- Commit: `4e18565`
- Test script: `backend/scripts/test-tenant-create.js`
- Registry: `src/project/projectRegistry.ts`

## Verification Performed

- `npm run build` from `backend`: PASS
- `node scripts/test-tenant-create.js` from `backend`: PASS, 20/20
- `git diff --check`: PASS

## Findings

1. **Service evidence is still not real implementation evidence.**
   The script imports the real `CreateTenantDto` after build, but it does not import or instantiate the real `TenantsService`. It defines a local `MockTenantsService`, so duplicate slug behavior is tested against copied mock logic rather than `backend/src/tenants/tenants.service.ts`.

2. **The WDR overclaims actual service coverage.**
   It says `TenantsService.create()` behavior is tested, but the tested class is local to the script.

3. **Governance remains incomplete.**
   The P7-004-R1 WDR says the correction commit is still "to be created" even though commit `4e18565` exists. Registry `git.lastCommit` also remains stale in the committed state.

## Required Correction

Corrective task: `TOPLINE-P7-004-R2` — Tenant Write API Real Service Test Evidence.

The correction must import and exercise the actual `TenantsService` from the compiled backend output or equivalent actual source path, using a mocked Prisma dependency. It must prove:

- Successful tenant create calls `prisma.tenant.findUnique()`
- Successful tenant create calls `prisma.tenant.create()`
- Duplicate slug throws the actual Nest `ConflictException`
- Duplicate slug does not call `prisma.tenant.create()`

Do not start P7-005.
