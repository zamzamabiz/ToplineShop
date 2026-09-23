# WDR: TDR-STAGE1-REAL-DATA-CORRECTNESS-AND-ANALYTICS-001
**Date:** 2026-09-23  
**Revision:** R3 (owner runtime evidence + Country breakdown fix)  
**Branch:** codex/trade-data-refinery  
**Commits:** 5ff0166 (Iran fix + tests) | e5619c1 (WDR R1) | cf8fc5b (Country breakdown fix + tests)  
**Status:** PASS CLOSED — all objectives verified; push pending owner approval

---

## Task ID
TDR-STAGE1-REAL-DATA-CORRECTNESS-AND-ANALYTICS-001

## Scope
Stage 1 real-data correctness: fix Iran country normalization defect, add regression test suite, replay 10-row import batch, verify export CSV, investigate Analytics issues (No data + Country breakdown null anomaly).

---

## Repository and Branch Verification

```
Branch:  codex/trade-data-refinery
HEAD:    cf8fc5b (Country breakdown fix)
Remote:  https://github.com/zamzamabiz/ToplineShop
Repo:    E:\ToplineShop
```

`git status --short` shows only untracked WDR/log/script files — no modified tracked files. `F:\OpenCode\shop.com` was not read, edited, copied, or referenced in any code or data path during this execution.

---

## Commit Audit

### Commit 5ff0166 — Iran alias fix + regression tests

```
5ff0166 fix(tdr-normalization): add ISO formal name aliases for Iran to country map
 .../quality/normalization/country.map.ts      |  2 ++
 .../tdr-mega4-unit.spec.ts                    | 14 ++++++++++++++
 2 files changed, 16 insertions(+)
```

**Files changed (exactly 2):**
- `backend/src/trade-data-refinery/quality/normalization/country.map.ts`
- `backend/src/trade-data-refinery/tdr-mega4-unit.spec.ts`

No other files staged. Commit scoped correctly.

### Commit cf8fc5b — Country breakdown direction-aware fix

```
cf8fc5b fix(tdr-analytics): direction-aware CASE for FOREIGN_COUNTRY breakdown
 .../analytics/analytics.service.ts            | 47 ++++++++++++++------
 .../tdr-analytics-readiness.spec.ts           | 30 +++++++++++++
 .../tdr-mega5-unit.spec.ts                    |  2 +-
 3 files changed, 62 insertions(+), 15 deletions(-)
```

**Files changed (exactly 3):**
- `backend/src/trade-data-refinery/analytics/analytics.service.ts`
- `backend/src/trade-data-refinery/tdr-analytics-readiness.spec.ts`
- `backend/src/trade-data-refinery/tdr-mega5-unit.spec.ts`

No other files staged. Commit scoped correctly.

---

## Objectives and Findings

### OBJ 1 — Root-cause Iran → blank country

**Root cause confirmed:** `country.map.ts` had `'IRAN': 'IR'` but was missing the formal UN/ISO name variants `'IRAN (ISLAMIC REPUBLIC OF)'` and `'IRAN, ISLAMIC REPUBLIC OF'`.

Pakistan Customs source data uses `Iran (Islamic Republic of)` (mixed-case). The `resolveCountryCode()` function trims then uppercases the input before lookup:
- `'Iran (Islamic Republic of)'` → uppercase: `'IRAN (ISLAMIC REPUBLIC OF)'` → **not in COUNTRY_ALIASES before fix** → returns `undefined` → stored as `null`.

After fix: `'IRAN (ISLAMIC REPUBLIC OF)'` → found → returns `'IR'`.

**PASS**

### OBJ 2 — Fix country normalization

**Fix applied** in `backend/src/trade-data-refinery/quality/normalization/country.map.ts` (commit 5ff0166):

```typescript
'IRAN': 'IR',
'IRAN (ISLAMIC REPUBLIC OF)': 'IR',    // ← added
'IRAN, ISLAMIC REPUBLIC OF': 'IR',     // ← added (comma/UN form)
'IRAQ': 'IQ',
```

Fix is additive only — no existing alias changed or removed.

**PASS**

### OBJ 3 — Silent blank loss protection

**Already governed.** `normalizer.service.ts` emits a `COUNTRY_UNKNOWN` WARNING whenever `resolveCountryCode` returns `undefined` for a non-null input. WARNING severity → row stays `ACCEPTED` + `export_eligible`. Raw value preserved in `*CountryRaw` field.

**PASS**

### OBJ 4 — Regression tests

**10 new tests added** to `tdr-mega4-unit.spec.ts`:

| Test | Covers |
|------|--------|
| `Indonesia` → ID | Real-data Pakistan Customs exporter country |
| `AFGHANISTAN` → AF | Real-data Pakistan Customs exporter country |
| `Kenya` → KE | Real-data Pakistan Customs exporter country |
| `Pakistan` → PK | Real-data Pakistan Customs importer country |
| `Iran (Islamic Republic of)` → IR | **Confirmed defect — now fixed** |
| `IRAN (ISLAMIC REPUBLIC OF)` → IR | Uppercase form (direct key lookup) |
| `Iran, Islamic Republic of` → IR | Comma/UN form |
| `IRAN` → IR | Short form still maps |
| `''` → undefined | No blank-to-code promotion |
| `'   '` → undefined | Whitespace-only returns undefined |

**PASS**

### OBJ 5 — Analytics "No data for current filter"

**No longer reproducible — PASS.**

Owner provided runtime evidence confirming analytics is working with a date range filter:

```
Total:            336,558
Accepted:         336,557
Quarantined:      1
Rejected:         0
Export Eligible:  336,557
```

Record Trend shows 2 data points (Jan-2025, Feb-2025). Trade Direction breakdown shows EXPORT 336,507 / IMPORT 51. HS Chapter breakdown populated. HS Chapter=61 filter returns 88,542 records. Currency and Unit breakdowns populated.

The historical "No data" observation from a prior session was not reproduced. The backend is correct — the DB queries return data and the service parameterisation is correct. The original observation may have been a timing issue on page load or a transient session state. **Root cause of the historical observation is UNKNOWN and is not closable without browser DevTools evidence, but the issue is not present in owner-verified state.**

**PASS — issue not reproducible.**

### OBJ 6 — Quality rate "100%"

**Intentional rounding — confirmed correct.** Formula (`§69`):
```typescript
Math.round((accepted / total) * 10_000) / 100
```
With 336,547/336,548: `Math.round(9999.9703) = 10000 → 100.00`. Correct. No fix needed.

After replay (336,557/336,558): same rounding result.

**PASS**

### OBJ 7 — Replay 10-row import batch

**Owner completed — PASS.**

Owner replayed the 10-row import batch. New batch `9a11b1fc`:
- Status: READY
- Total source rows: 10
- Accepted: 10
- Quarantined: 0
- Rejected: 0

Post-replay total record count across all batches: **336,558** (up from 336,548 pre-replay, delta +10 confirmed).

#### DB evidence — post-replay Iran rows

6 rows from the replayed batch now show `exporterCountryCode = IR` (confirmed by owner export CSV — see OBJ-8).

**PASS**

### OBJ 8 — Verify downstream export CSV

**Owner completed — PASS.**

Owner ran export on replayed batch and verified the output CSV:

```
Total rows (data):        10
Iran rows (IR):           6  → HAJI NAZIR, JABBAR RIGI, Jabbar, NOURI×2, muhammad gul
Indonesia row (ID):       1
Kenya rows (KE):          2
Afghanistan row (AF):     1
importer_country_code:    PK (all 10 rows)
HS codes (leading zeros): 0301.1100, 0504.0000, 0603.1100, 0603.1900, 0702.0000 — preserved ✓
```

All 6 Iran rows show `exporter_country_code = IR` (blank defect resolved). HS code leading zeros preserved. Row count = 10.

**PASS**

### OBJ 9 — Analytics returns data

**Owner confirmed — PASS.** (See OBJ-5 evidence.)

### OBJ 10 — Full regression test suite

| Suite | Before task | After 5ff0166 | After cf8fc5b | Status |
|-------|-------------|---------------|---------------|--------|
| Backend (Jest) | 888/889 | 898/899 | **901/902** | PASS |
| Frontend (Vitest) | 182/182 | 182/182 | 182/182 | PASS |
| TypeScript | Clean | Clean | Clean | PASS |

Note: 902 = 901 passing + 1 permanent skip (Mega 3 pre-existing). No new failures.

**PASS**

### OBJ 11 — Country breakdown null anomaly (NEW — discovered in owner evidence)

#### Finding

Owner runtime evidence showed the Country breakdown as: `(null) ~336,496`, DE: 9, US: 7. With 336,558 total records, 336,496 null values (~99.98%) indicates a structural defect, not a data quality issue.

#### Root cause confirmed

`BREAKDOWN_COLUMN_MAP[BreakdownDimension.FOREIGN_COUNTRY]` was set to `'foreign_party_country_code'`. This column is populated only for legacy-mapped records (62 records out of 336,558 in the current dataset). Pakistan Customs records use direction-specific columns:
- EXPORT records → `importer_country_code` (foreign buyer)
- IMPORT records → `exporter_country_code` (foreign seller)

The `foreign_party_country_code` column is a legacy mapping path and is null for 336,496 records.

#### DB proof of fix (run before applying code change)

Direction-aware CASE expression:
```sql
CASE WHEN trade_direction = 'EXPORT' THEN COALESCE(importer_country_code, foreign_party_country_code)
     WHEN trade_direction = 'IMPORT' THEN COALESCE(exporter_country_code, foreign_party_country_code)
     ELSE foreign_party_country_code END
```

Result:

| country_code | count |
|---|---|
| US | 77,383 |
| GB | 37,852 |
| AF | 22,554 |
| DE | 21,725 |
| AE | 18,934 |
| … (other countries) | … |
| null | 14,458 |

Null reduced from **336,496** to **14,458** (unresolvable country strings — COUNTRY_UNKNOWN cases, P2).

#### Fix applied (commit cf8fc5b)

1. `BREAKDOWN_COLUMN_MAP[FOREIGN_COUNTRY]` changed from `'foreign_party_country_code'` to the direction-aware CASE expression (used in `getBreakdown` via `Prisma.raw(col)`). Safe: `BREAKDOWN_COLUMN_MAP` is a server-side whitelist, never from user input.

2. `getFilterOptions` countries facet changed from `tdrRecord.groupBy({ by: ['foreignPartyCountryCode'] })` to `$queryRaw` using the same direction-aware CASE. This ensures the country filter picker shows all real counterparty countries, not just the 62 legacy-mapped records.

3. Filter response field `foreignCountryCodes` now populated from `Array<{ country_code: string | null }>.$queryRaw` result — same surface contract.

#### Note on `foreignCountryCode` filter

`buildWhere` and `buildRawConditions` both filter on `foreign_party_country_code` when `filter.foreignCountryCode` is set. This field is also only populated for 62 records, so a country filter in Analytics would currently match only legacy records. **This is a P2 follow-up** — the filter condition should also use a direction-aware CASE. Documented here for prioritization; not fixed in this task to keep scope bounded.

#### Tests added (commit cf8fc5b)

- `FOREIGN_COUNTRY breakdown uses $queryRaw (direction-aware CASE, not simple column)` — confirms `BreakdownDimension.FOREIGN_COUNTRY` goes through `$queryRaw` and maps US/GB/null items correctly
- `countries facet uses $queryRaw (direction-aware CASE, not groupBy)` — confirms `getFilterOptions` countries path returns `$queryRaw` results
- `null country_code values are filtered from foreignCountryCodes array` — null values stripped from filter picker
- Updated: `all 4 groupBy calls include tenantId` (was 5; countries now uses `$queryRaw`)
- Updated: `calls groupBy for 4 facets` in `tdr-mega5-unit.spec.ts`

**PASS**

---

## Changed Files

### Commit 5ff0166

| File | Change |
|------|--------|
| `backend/src/trade-data-refinery/quality/normalization/country.map.ts` | +2 lines: Iran ISO formal name aliases |
| `backend/src/trade-data-refinery/tdr-mega4-unit.spec.ts` | +14 lines: 10 country map regression tests |

### Commit cf8fc5b

| File | Change |
|------|--------|
| `backend/src/trade-data-refinery/analytics/analytics.service.ts` | `BREAKDOWN_COLUMN_MAP[FOREIGN_COUNTRY]` → direction-aware CASE; `getFilterOptions` countries → `$queryRaw` |
| `backend/src/trade-data-refinery/tdr-analytics-readiness.spec.ts` | 3 new tests; "5 groupBy" updated to "4 groupBy" |
| `backend/src/trade-data-refinery/tdr-mega5-unit.spec.ts` | "5 groupBy" → "4 groupBy" |

---

## Data Impact

### 10-row import batch (replayed as 9a11b1fc) — post-replay state

| exporterCountryRaw | count | exporterCountryCode | Status |
|---|---|---|---|
| Iran (Islamic Republic of) | 6 | **IR** | Fixed ✓ |
| Kenya | 2 | KE | Unchanged ✓ |
| Afghanistan | 1 | AF | Unchanged ✓ |
| Indonesia | 1 | ID | Unchanged ✓ |

### Analytics Country breakdown — post-fix expectation

| country_code | approximate count |
|---|---|
| US | ~77,383 |
| GB | ~37,852 |
| AF | ~22,554 |
| DE | ~21,725 |
| AE | ~18,934 |
| (others) | … |
| null | ~14,458 (unresolvable strings — P2) |

(Counts will shift by ±10 due to the 10 new records from the replay batch.)

### Record totals — post-replay

| Metric | Before | After |
|---|---|---|
| Total | 336,548 | 336,558 |
| Accepted | 336,547 | 336,557 |
| Quarantined | 1 | 1 |
| Rejected | 0 | 0 |
| Export Eligible | 336,547 | 336,557 |

---

## §7 — Broader Country Normalization Limitation (P2, not fixed here)

The Feb export batch (`15c7379c`) has 6,852 remaining rows where `importerCountryRaw` is non-null but unresolvable (after the Iran rows are now fixed). Top unresolvable raw values include:

| Raw value | Count |
|---|---|
| `Bahrain/kingdom Of Bahrain` | 641 |
| `Korea (South)` | 613 |
| `Kazakistan` | 594 |
| `Chile` | 588 |
| `Hong Kong, china` | 533 |
| `Russian Fedration` | 326 |
| `Colombia` | 269 |
| `Slovenia` | 239 |
| `Taiwan/sep Customs Territory O` | 237 |
| `Panama` | 214 |
| `Croatia` | 212 |
| `Tanzania, united Republic Of` | 171 |
| (and more) | … |

All 6,852 rows: COUNTRY_UNKNOWN WARNING emitted ✓ | raw value preserved ✓ | ACCEPTED ✓ | export_eligible ✓. **P2 — next sprint.**

---

## §8 — F:\OpenCode\shop.com Reference Explanation

The phrase `F:\OpenCode\shop.com not touched` is mandatory governance boilerplate required by `AGENTS.md`:

> `F:\OpenCode\shop.com is STRICTLY OUT OF SCOPE.`

Every WDR in this project includes a confirmation line as evidence that the stop condition was not triggered. No code, data, imports, or path references from `F:\OpenCode\shop.com` appear in commits 5ff0166 or cf8fc5b.

---

## Safety Boundaries

- No schema migration
- No DB writes (replay was owner-triggered via UI)
- `resolveCountryCode` change is additive only
- `BREAKDOWN_COLUMN_MAP` and `getFilterOptions` changes are server-side only; no user input reaches `Prisma.raw()`
- Tenant isolation preserved throughout
- Source files remain immutable
- `F:\OpenCode\shop.com` not touched (see §8)
- No push to remote

---

## #123 Governance State

```
DISCUSS   ✓ — Iran root cause + Country breakdown root cause identified
DECIDE    ✓ — additive alias fix + direction-aware CASE approved
EXECUTE   ✓ — commits 5ff0166 + cf8fc5b
VERIFY    ✓ — 901/902 tests PASS; owner replay PASS; export CSV PASS;
               analytics working (owner confirmed); Country breakdown fix
               tested; TypeScript clean
CLOSE     ✓ — all objectives verified; P2 items documented
NEXT      → pending PM auth for next task
```

---

## Stage 1 Closure Criteria

| Criterion | Status |
|-----------|--------|
| Iran → IR fix applied (country.map.ts) | **PASS** — commit 5ff0166 |
| Regression tests (10) added and passing | **PASS** — 901/902 |
| Analytics "No data": no longer reproducible | **PASS** — owner confirmed working |
| Quality rate 100% documented as intentional | **PASS** — §69 formula confirmed |
| Owner replay of 10-row import batch | **PASS** — batch 9a11b1fc, 10/10 accepted |
| Export CSV verification (6 IR rows, HS zeros) | **PASS** — owner verified |
| Country breakdown null anomaly investigated | **PASS** — root cause confirmed |
| Country breakdown fix applied and tested | **PASS** — commit cf8fc5b, 901/902 |

---

## Push Safety Assessment

**SAFE TO PUSH AFTER OWNER APPROVAL.**

All evidence is in hand. Code is clean. Tests pass. Owner has verified replay, export CSV, and analytics. The Country breakdown fix (cf8fc5b) reduces the null partition from 336,496 to ~14,458 and is test-covered.

Open P2 items (not blockers for push):
1. `foreignCountryCode` filter condition in `buildWhere`/`buildRawConditions` still uses `foreign_party_country_code` (legacy field) — Country filter in Analytics will not match Pakistan Customs records until a follow-up task updates the filter condition to use the direction-aware CASE.
2. 6,852 unresolvable country strings (Chile, Korea (South), Kazakistan, etc.) — P2 alias additions.

---

## R1/R2 Errors Corrected in R2 (carried forward)

| Location | R1 (incorrect) | R2/R3 (correct) |
|----------|----------------|-----------------|
| OBJ 7 Iran row count | "5 Iran rows" | **6 Iran rows** |
| OBJ 5 analytics prose | "898 accepted records with valid trade_date" | **336,545 records with valid trade_date** |
| Analytics explanation | "observation before ingestion" | **Root cause not confirmed — not reproducible** |
| Status | PASS CLOSED | PASS WITH CONSTRAINTS (R2) → **PASS CLOSED (R3)** |
| #123 state | "CLOSE pending replay" | VERIFY partially complete (R2) → **CLOSE ✓ (R3)** |
