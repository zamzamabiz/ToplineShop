# WDR: TDR-STAGE1-REAL-DATA-CORRECTNESS-AND-ANALYTICS-001
**Date:** 2026-09-23  
**Revision:** R4 (country filter fix + GitHub push-safety gate)  
**Branch:** codex/trade-data-refinery  
**Commits:** 5ff0166 · cf8fc5b · 42b1514 · (WDR: e5619c1 · 77c9772 · this)  
**Status:** STAGE 1 PASS CLOSED — technically ready

---

## Task ID
TDR-STAGE1-REAL-DATA-CORRECTNESS-AND-ANALYTICS-001 / TDR-STAGE1-FINAL-COUNTRY-FILTER-AND-PUSH-GATE-001

## Scope
Iran country normalization fix · Analytics Country breakdown fix · Analytics Country filter alignment · GitHub remote delta safety audit

---

## Repository and Branch Verification

```
Branch:   codex/trade-data-refinery
Local HEAD (pre-WDR commit):  42b1514
Remote HEAD (after fetch):    22cedfc  (origin/codex/trade-data-refinery)
Remote:   https://github.com/zamzamabiz/ToplineShop
Repo:     E:\ToplineShop
```

`git status --short` contains only untracked WDR/log/script files — no modified tracked files. `F:\OpenCode\shop.com` not touched.

---

## Commits in This Task

| Hash | Type | Description |
|---|---|---|
| `5ff0166` | fix | Iran ISO formal name aliases + 10 regression tests |
| `e5619c1` | chore/gov | WDR R1 |
| `cf8fc5b` | fix | Direction-aware CASE for FOREIGN_COUNTRY breakdown + getFilterOptions $queryRaw |
| `77c9772` | chore/gov | WDR R3 (all prior evidence) |
| `42b1514` | fix | Align country filter with direction-aware semantics (this item) |
| *(this)* | chore/gov | WDR R4 |

---

## ITEM 1 — Country Filter Defect

### Root cause

`buildWhere()` (Prisma ORM — used by `getSummary`) and `buildRawConditions()` (raw SQL — used by `getTrend` and `getBreakdown`) both filtered `foreignCountryCode` using `foreign_party_country_code`. This field is populated for only 62 of 336,558 Pakistan Customs records.

**DB evidence (verified 2026-09-23, read-only queries):**

| filter = 'US' | direction_aware | legacy only |
|---|---|---|
| EXPORT | **77,381** | 5 |
| IMPORT | 2 | 2 |
| **Total** | **77,383** | **7** |

| filter = 'IR' | direction_aware | legacy only |
|---|---|---|
| IMPORT | **6** | 0 |
| **Total** | **6** | **0** |

Legacy filter missed 77,376 US records and 6 IR records. The direction-aware filter returns the correct counterparty set.

Confirmed legacy-populated records: **62** (from `WHERE foreign_party_country_code IS NOT NULL`).

### Fix (commit `42b1514`)

**Canonical constant extracted:**

```typescript
// §74 — canonical direction-aware counterparty country SQL expression.
// Used in: BREAKDOWN_COLUMN_MAP, buildRawConditions, getFilterOptions.
const DIRECTION_AWARE_COUNTRY_SQL =
  `CASE WHEN trade_direction = 'EXPORT'` +
  ` THEN COALESCE(importer_country_code, foreign_party_country_code)` +
  ` WHEN trade_direction = 'IMPORT'` +
  ` THEN COALESCE(exporter_country_code, foreign_party_country_code)` +
  ` ELSE foreign_party_country_code END`;
```

`BREAKDOWN_COLUMN_MAP[FOREIGN_COUNTRY]` updated to reference this constant (was inline string; now DRY).  
`getFilterOptions` `$queryRaw` updated to use `Prisma.raw(DIRECTION_AWARE_COUNTRY_SQL)` (was inline CASE).

**`buildRawConditions()` — before:**
```typescript
Prisma.sql`foreign_party_country_code = ${filter.foreignCountryCode}`
```

**`buildRawConditions()` — after:**
```typescript
Prisma.sql`(${Prisma.raw(DIRECTION_AWARE_COUNTRY_SQL)}) = ${filter.foreignCountryCode}`
```

`filter.foreignCountryCode` is a bound parameter. `DIRECTION_AWARE_COUNTRY_SQL` comes from a server-side constant — never from user input. Safe.

**`buildWhere()` — before:**
```typescript
where.foreignPartyCountryCode = filter.foreignCountryCode;
```

**`buildWhere()` — after (Prisma ORM exact equivalent of COALESCE CASE):**
```typescript
const v = filter.foreignCountryCode;
where.OR = [
  { tradeDirection: TradeDirection.EXPORT, importerCountryCode: v },
  { tradeDirection: TradeDirection.EXPORT, importerCountryCode: null, foreignPartyCountryCode: v },
  { tradeDirection: TradeDirection.IMPORT, exporterCountryCode: v },
  { tradeDirection: TradeDirection.IMPORT, exporterCountryCode: null, foreignPartyCountryCode: v },
];
```

The 4-clause OR exactly mirrors `COALESCE(primary, fallback) = v`:
- Clause 1: EXPORT, primary not null → `importer_country_code = v`
- Clause 2: EXPORT, primary null → falls through to `foreign_party_country_code = v`
- Clause 3: IMPORT, primary not null → `exporter_country_code = v`
- Clause 4: IMPORT, primary null → falls through to `foreign_party_country_code = v`

The ELSE branch (neither EXPORT nor IMPORT) is omitted — `trade_direction` is a NOT NULL required enum in the schema that only has EXPORT/IMPORT values; no rows can reach the ELSE.

### Tests added (commit `42b1514`, §9 in `tdr-analytics-readiness.spec.ts`)

| Test | Requirement |
|---|---|
| EXPORT + US: OR includes EXPORT/importerCountryCode = US | EXPORT direction |
| IMPORT + IR: OR includes IMPORT/exporterCountryCode = IR | IMPORT direction |
| Legacy fallback: OR includes EXPORT/importerCountryCode=null/foreignPartyCountryCode clause | Legacy fallback |
| Tenant isolation preserved with foreignCountryCode filter | Tenant scoping |
| Date + country combined: tradeDate and OR both present | Filter + date combination |
| Direction + country combined: tradeDirection and OR both present | Filter + direction combination |
| getBreakdown with foreignCountryCode filter calls $queryRaw | Raw SQL path unaffected |

### Backend suite after fix

| Suite | Count | Status |
|---|---|---|
| Backend Jest | **908/909** (1 governed skip) | PASS |
| Frontend Vitest | 182/182 | PASS |
| TypeScript | Clean | PASS |

### Changed files (commit `42b1514`)

| File | Change |
|---|---|
| `backend/src/trade-data-refinery/analytics/analytics.service.ts` | Extract `DIRECTION_AWARE_COUNTRY_SQL`; fix `buildWhere`, `buildRawConditions`, `getFilterOptions` |
| `backend/src/trade-data-refinery/tdr-analytics-readiness.spec.ts` | 7 new §9 tests |

### UI verification

Owner must verify the Analytics Country filter facet now returns meaningful Pakistan Customs records when a country (e.g. US, GB) is selected. DB evidence confirms the direction-aware query returns 77,383 US records vs 7 previously. Endpoint is auth-gated; browser DevTools verification required from owner.

---

## ITEM 2 — GitHub Remote Delta Safety Audit

### Delta summary

```
git fetch origin                         → fetched (no remote changes to branch)
git branch --show-current               → codex/trade-data-refinery
git rev-parse HEAD                      → 42b15147102551335a4df31ab16061fa1eb95c40
git rev-parse origin/codex/trade-data-refinery
                                        → 22cedfc28326195616b1a3c150b934ccf61b1b65
git rev-list --count origin/..HEAD      → 147
git diff --stat origin/..HEAD           → 350 files changed, 81297 insertions(+), 4639 deletions(-)
```

### Remote branch HEAD

Commit `22cedfc` — `chore: ignore local Claude settings`. This is the last commit that was pushed to origin. All 147 local commits are accumulated governed work added since that push.

### Commit authorship — all 147 commits

All 147 commits in the delta have subject lines matching ERP64/TDR conventions:

```
feat(tdr):    source lifecycle, storage, observability, versioning,
              frontend, upload refinements, export improvements,
              Pakistan Customs mapping, auth corrections, etc.
fix(tdr):     quality pipeline, country normalization, export fixes,
              analytics fixes, auth session lifecycle, etc.
chore(gov):   WDR records, registry updates, governance checkpoints
docs(tdr):    deployment, backup runbooks
```

No commit subjects are anomalous, out-of-scope, or indicative of unrelated work.

### Sensitive file audit

Patterns searched across the 350-file delta:

| Pattern | Files found | Assessment |
|---|---|---|
| `^backend/\.env$` or `^\.env$` | **0** | CLEAN — real .env not tracked |
| `\.env\.` (dotenv variants) | `backend/.env.example` only | SAFE — placeholder values, explicitly marked safe to commit in file header |
| `secret\|key\|token\|cred\|pass` (non-MD source files) | `storage-key.util.ts`, `tdr-api-key.service.ts`, `webhook-secret.util.ts` | INSPECTED — see below |
| `uploads/` (data directory) | `backend/uploads/` untracked only | CLEAN — not in delta |
| `\.log$` | untracked only | CLEAN — not in delta |
| DB dumps / `.bak` / `.pem` / private keys | **0** | CLEAN |

**Inspected security-adjacent source files:**
- `webhook-secret.util.ts` — AES-256-GCM encrypt/decrypt utility. Pure crypto logic. No hardcoded keys or secrets. Key accepted as a parameter from environment variable at runtime.
- `tdr-api-key.service.ts` — API key service that hashes/validates API keys using `crypto.randomBytes` and bcrypt. No hardcoded values.
- `storage-key.util.ts` — Builds tenant-scoped storage path keys. No secrets; pure string concatenation with path prefix enforcement.

**`.env.example` content:** contains only placeholder strings (`CHANGE_ME_DEV_ONLY`, `postgresql://USER:PASSWORD@HOST:PORT/...`). Explicitly labeled "safe to commit" and "NEVER commit a .env file with real credentials." No real credentials.

### Push safety assessment

**SAFE TO PUSH AFTER OWNER APPROVAL.**

All 147 commits are:
- Legitimate accumulated governed ERP64/TDR work
- Free of real `.env`, secrets, credentials, database dumps, uploaded trade data, or private keys
- Committed under `git add <exact-file>` staging only (git rules followed throughout)
- Consistent with project conventions and WDR governance

No force push required. A standard `git push origin codex/trade-data-refinery` is safe.

**Owner decisions before pushing:**
1. Confirm the 147-commit delta is the intended publication scope (it represents the full TDR history since `22cedfc`).
2. Confirm no sensitive local data was inadvertently staged at any point (owner is the authority on what was in their working tree during the session).

---

## Full Test Suite Summary

| Suite | Result | Delta vs start of task |
|---|---|---|
| Backend Jest | **908/909** | +20 tests (+10 Iran regression, +3 breakdown, +7 country filter) |
| Frontend Vitest | 182/182 | Unchanged |
| TypeScript | Clean | Clean |

---

## Changed Files — This Task

### Commit `5ff0166`
| File | Change |
|---|---|
| `backend/src/trade-data-refinery/quality/normalization/country.map.ts` | +2 Iran ISO aliases |
| `backend/src/trade-data-refinery/tdr-mega4-unit.spec.ts` | +10 country regression tests |

### Commit `cf8fc5b`
| File | Change |
|---|---|
| `backend/src/trade-data-refinery/analytics/analytics.service.ts` | `BREAKDOWN_COLUMN_MAP[FOREIGN_COUNTRY]` + getFilterOptions $queryRaw |
| `backend/src/trade-data-refinery/tdr-analytics-readiness.spec.ts` | +3 tests, 2 updated |
| `backend/src/trade-data-refinery/tdr-mega5-unit.spec.ts` | groupBy count 5→4 |

### Commit `42b1514`
| File | Change |
|---|---|
| `backend/src/trade-data-refinery/analytics/analytics.service.ts` | `DIRECTION_AWARE_COUNTRY_SQL` constant; fix `buildWhere`, `buildRawConditions`, `getFilterOptions` |
| `backend/src/trade-data-refinery/tdr-analytics-readiness.spec.ts` | +7 country filter §9 tests |

---

## Safety Boundaries

- No schema migration
- No DB writes
- All expressions in `Prisma.raw()` come from server-side constants only — never from user input
- Tenant isolation preserved in all filter paths (tenantId always first condition)
- Source files remain immutable
- `F:\OpenCode\shop.com` not touched (AGENTS.md isolation confirmed)
- No push to remote

---

## #123 Governance State

```
DISCUSS   ✓
DECIDE    ✓
EXECUTE   ✓
VERIFY    ✓ — 908/909 Jest + TypeScript clean + DB queries verified
CLOSE     ✓ — all objectives verified; remote delta audited
NEXT      → SAFE TO PUSH AFTER OWNER APPROVAL; then PM auth for next task
```

---

## Final Disposition

**STAGE 1 PASS CLOSED — technically ready.**

All implementation objectives are complete. The direction-aware semantics are now consistent across three paths:
1. `BREAKDOWN_COLUMN_MAP` (Analytics Country breakdown via `getBreakdown`)
2. `getFilterOptions` `$queryRaw` (filter picker facet)
3. `buildWhere` + `buildRawConditions` (summary, trend, breakdown filter)

**GitHub disposition: SAFE TO PUSH AFTER OWNER APPROVAL.**

Push is a standard `git push origin codex/trade-data-refinery`. The 147-commit delta is clean ERP64/TDR governed work with no sensitive files.

**Owner actions remaining before push:**
1. Approve this WDR R4 and the 147-commit push scope.
2. Verify Analytics UI Country filter returns meaningful Pakistan Customs records (browser DevTools; auth-gated endpoint — cannot be verified from CLI).

**Open P2 (not blocking push):**
- 6,852 unresolvable country strings (Chile, Korea (South), Kazakistan, etc.) — separate alias-remediation task
- `foreignCountryCode` filter condition is now correct for breakdown/trend/summary; no further open items on filter semantics

---

## R1/R2/R3 Errors Corrected (cumulative)

| Revision | Item corrected |
|---|---|
| R2 | Iran row count 5→6; "898 records" prose error; analytics pre-ingestion claim; status; #123 state |
| R3 | OBJ-7 PASS (replay 9a11b1fc); OBJ-8 PASS (CSV); analytics working; Country breakdown (cf8fc5b) |
| R4 | Country filter fix (42b1514); GitHub push-safety gate completed |
