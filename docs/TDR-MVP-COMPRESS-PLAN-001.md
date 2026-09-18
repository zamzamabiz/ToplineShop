# TDR-MVP-COMPRESS-PLAN-001
## ERP64 — Trade Data Refinery: Repository-Aware Architecture & MVP Execution Freeze

| Field | Value |
|---|---|
| Task ID | TDR-MVP-COMPRESS-PLAN-001 (Mega 0) |
| Date | 2026-09-19 |
| Branch | `codex/trade-data-refinery` |
| Starting HEAD | `aecd2c220d5ca31f511c8a0378d98acf42c8313e` |
| G1 — Frontend Freeze | **PASS** |
| G2 — Platform Readiness | **PASS** |
| Backend baseline | 109/109 PASS |
| Status | **PLANNING ARTIFACT — NO RUNTIME CHANGES** |

---

## A. EXECUTIVE STATUS

**G1 PASS.** TDR frontend (Next.js 16) is implemented, visually proved across 6 UX states (healthy, empty, loading, warning, failed, disabled), and frozen. The frontend uses mock data only — no API client, no live backend calls.

**G2 PASS.** All four platform readiness gates confirmed: TDR-P2-001 (scope/registry), TDR-P2-002 (RBAC), TDR-P2-003 (module-registry), TDR-P2-004 (audit/PII). No blockers.

**TDR runtime implementation: NOT STARTED.** No TDR module, no TDR routes, no ingestion, no dashboard backend, no TDR Prisma schema, no TDR migrations.

**Mega 0 purpose:** Freeze the complete architecture, data model, ingestion design, security model, test strategy, and 7-mega execution map so that Mega 1 through Mega 6 can execute without reopening fundamental decisions.

---

## B. REPOSITORY REALITY CHECK

### B.1 Backend (E:\ToplineShop\backend)

| Dimension | Finding |
|---|---|
| Runtime | NestJS 11, TypeScript 5.7, Jest 29 |
| Database | PostgreSQL via Prisma 6.19.3 |
| Auth | JwtAuthGuard (APP_GUARD #1) + RolesGuard (APP_GUARD #2), @Public() allowlist |
| Roles | 10 roles: SUPER_ADMIN, TENANT_ADMIN, IMPORT_MANAGER, EXPORT_MANAGER, SALES_MANAGER, PROCUREMENT_MANAGER, WAREHOUSE_MANAGER, FINANCE_MANAGER, ANALYST, VIEWER |
| Permissions | 5 permissions (CREATE_TENANT, CREATE_VENDOR, CREATE_CATEGORY, CREATE_PRODUCT, READ_ANALYTICS) |
| Audit | @Global() AuditModule, AuditService.recordEvent(), sanitizeMetadata() active |
| Existing models | Tenant, User, Membership, Vendor, Category, Product, AuditLog, Session |
| Existing migrations | 20260907172636_init_core_schema, 20260916000000_p8_002_auth_persistence |
| Decimal convention | Prisma `Decimal @db.Decimal(19,4)` established in Product.basePrice — follow this |
| API convention | `ApiResponse<T>` with `{ ok: true, data, meta? }` / `{ ok: false, error: {...} }` |
| Validation | class-validator + class-transformer, CustomValidationPipe global |
| File upload | **NOT PRESENT** — no multer, no @nestjs/platform-express file handling |
| CSV parser | **NOT PRESENT** — not in package.json |
| XLSX parser | **NOT PRESENT** — not in package.json |
| Job queue | **NOT PRESENT** — no BullMQ, no pg-boss, no scheduler |
| File storage | **NOT PRESENT** — no S3, no local-disk abstraction |
| Hashing | argon2 present (for passwords) — crypto module (Node built-in) available for SHA-256 |
| Bulk insert | **NOT PRESENT** — no createMany usage patterns yet |
| PermissionsGuard | Created (file exists) but NOT registered as APP_GUARD — available for future use |

### B.2 Frontend (E:\ToplineShop root)

| Dimension | Finding |
|---|---|
| Runtime | Next.js 16.3.4, React 19, TypeScript 5, Tailwind CSS 4 |
| TDR page | `src/app/tdr/page.tsx` — complete, 6 view states, mock data, all import/upload controls disabled |
| Data fetching | **NONE** — no SWR, no React Query, no fetch wrappers. Mega 5 must add |
| API client | **NOT PRESENT** — must be built in Mega 5 |
| State management | React useState only — sufficient for MVP |
| TDR components | TdrPreviewBanner, TdrMetricsGrid, TdrBatchTable, TdrQualityPanel, TdrQuarantinePanel, TdrSourceHealthPanel, TdrImportWorkflowPanel, TdrLineageQualityPanel, TdrProjectManagementPanel — all present, mock-data-wired |
| Auth/session | Frontend auth hooks: **NOT PRESENT** — must be added in Mega 5 |

### B.3 No New Infrastructure Surprise Conditions

The repository confirms:
- No existing file upload — must be added in Mega 3
- No existing job queue — DB-backed processing job is the correct MVP decision
- No existing CSV/XLSX library — must be added in Mega 3
- No file storage abstraction — must be added in Mega 3 (local disk + abstract interface)
- Frontend has no API client — must be added in Mega 5
- All guard infrastructure (JWT, Roles) is in place and reusable

---

## C. REAL DATA RECONCILIATION

| Source | Rows | Direction |
|---|---|---|
| January 2025 IMPORT | ~293,893 | IMPORT |
| January 2025 EXPORT | ~177,076 | EXPORT |
| **Combined** | **~470,969** | Both |

**Production target:** 100M–500M+ shipment records.

### C.1 Schema Differences (IMPORT vs EXPORT)

| Aspect | IMPORT | EXPORT |
|---|---|---|
| Column count | ~15 | ~17 |
| Headings | Custom Pakistan Customs IMPORT headings | Different headings, different column order |
| Direction column | Implicit (IMPORT file = IMPORT direction) | Implicit (EXPORT file = EXPORT direction) |
| Local party | Pakistan importer (buyer/consignee) | Pakistan exporter (seller/shipper) |
| Foreign party | Overseas exporter | Overseas importer |

### C.2 Currency Encoding Discrepancy (Critical)

| File | Example currencies |
|---|---|
| IMPORT | `US $`, `Rs.`, `EURO`, `Dhm`, `Rmb`, `YEN`, `STG`, `S.Fr` |
| EXPORT | `840`, `586`, `826`, `784`, `998`, `36`, `124` (ISO 4217 numeric codes) |

**Decision frozen:** Raw currency value is always preserved. Normalization attempts ISO 4217 alpha-3 lookup from both text labels and numeric codes. Unknown currencies: preserve raw, set currencyCode = NULL, rowDisposition may become QUARANTINED if currency is required.

### C.3 HS/PCT Code Representation

Observed: `6105.2`, `301.11`, `504.0` — these look like floating-point numbers. They are NOT. They are character strings that happen to resemble decimals. **Never use FLOAT/NUMERIC storage for HS codes.** Always store as TEXT. Never invent missing HS digits.

### C.4 Quantity/Unit Encoding

Units include: `KG`, `u`, `U`, `2u`, `2U`, `L`, `m²`, `m³`, `m3`, `PACK`, `MMBTU`, `carat`, `1000`, `1000u`. Normalization converts to a canonical unit code where possible; unknown units are preserved raw.

### C.5 Data Quality Realities

- Party data (names, addresses) can be blank — not an error, ACCEPTED_NULL
- Tax IDs (NTN/CNIC for Pakistan) can be blank — not a rejection, ACCEPTED_NULL
- Ports can be blank — ACCEPTED_NULL
- Some monetary values are very large — use `NUMERIC(24,6)` minimum
- Legitimate zero values exist — NULL ≠ 0 ≠ blank must be preserved throughout

---

## D. ARCHITECTURE DECISIONS FROZEN

| ID | Decision | Justification |
|---|---|---|
| AD-001 | **Asynchronous ingestion mandatory** | HTTP upload must return before full-file processing. DB-backed TdrProcessingJob for MVP (no Kafka, no BullMQ dependency). | 
| AD-002 | **TenantModule relational model** | Repository has no Tenant.enabledModules array. Use separate TenantModule table for per-tenant TDR enablement. |
| AD-003 | **TdrSourceFile is 1:N TdrBatch** | One physical file can be replayed creating new batches. TdrSourceFile is immutable. |
| AD-004 | **Replay creates NEW batch** | Prior batch history never overwritten. `replayOfBatchId` self-reference on TdrBatch. No standalone TdrReplayRecord needed. |
| AD-005 | **One canonical TdrRecord** | No TdrNormalizedRow + TdrRefinedRow. One typed canonical record with immutable source evidence, validation issues, quarantine lineage. |
| AD-006 | **Raw files NOT in PostgreSQL** | TdrSourceFile stores path/key only. File content in local-disk storage (MVP) behind abstract interface. |
| AD-007 | **JSONB for bounded metadata only** | sourceRowEvidence, mappingConfig, processingConfig, validationMeta may use JSONB. Frequently-queried shipment fields (HS code, trade date, amounts) use typed columns. |
| AD-008 | **HS/PCT always TEXT** | Never FLOAT/NUMERIC. Raw: TEXT. Normalized: TEXT. No digit invention. |
| AD-009 | **Quantities/prices: NUMERIC(24,6)** | PostgreSQL NUMERIC / Prisma Decimal. No binary float for stored values. |
| AD-010 | **Bulk persistence mandatory** | createMany for chunks. No row-at-a-time hot path. Architecture permits future COPY/staging-table upgrade. |
| AD-011 | **Chunk-level transactions** | No giant transaction per file. Chunk size: 500–1000 rows. Checkpoint after each chunk. |
| AD-012 | **XLSX resource-limited** | No formula execution. Zip-bomb protection. Streaming/read-only parse. CSV preferred for large files. |
| AD-013 | **DB-backed job state for MVP** | TdrProcessingJob with lease/checkpoint/retry. No external queue introduced. NestJS @Interval() or setInterval for worker loop. |
| AD-014 | **Storage abstraction interface** | StorageService interface with LocalDiskAdapter for MVP. Future S3Adapter is a drop-in. Paths use `tenantId/batchId/filename` key structure. |
| AD-015 | **Duplicate fingerprint includes versions** | tenantId + contentHash + mappingVersion + parserVersion + normalizationVersion + validationVersion. Filename/size are supporting evidence only. |
| AD-016 | **No AI entity matching in MVP** | No ML/LLM for party name matching. Raw values preserved, normalization is rule-based only. |
| AD-017 | **No speculative country inference** | Unknown country codes: preserve raw, set to NULL in canonical. |
| AD-018 | **Reuse existing guard chain** | JwtAuthGuard + RolesGuard cover TDR routes. TenantModuleGuard is a new addition at position #3 in the APP_GUARD chain. |

---

## E. CANONICAL SHIPMENT DATA CONTRACT v1

### E.1 Field Definitions

| Field | PG Type | Prisma Type | Nullable | IMPORT source | EXPORT source | Raw retained | Normalized | Missing treatment |
|---|---|---|---|---|---|---|---|---|
| `id` | UUID | String | NO | — | — | — | generated | — |
| `tenantId` | UUID | String | NO | system | system | — | required | — |
| `sourceFileId` | UUID | String | NO | system | system | — | required | — |
| `batchId` | UUID | String | NO | system | system | — | required | — |
| `sourceRowNumber` | INT | Int | NO | row ordinal | row ordinal | YES | — | — |
| `rowHash` | VARCHAR(64) | String | NO | SHA-256 of raw row | SHA-256 of raw row | — | derived | — |
| `tradeDirection` | ENUM | TradeDirection | NO | `IMPORT` (file-level) | `EXPORT` (file-level) | YES (raw) | IMPORT/EXPORT | reject if absent |
| `tradeDate` | DATE | DateTime | YES | date column | date column | YES (raw text) | ISO 8601 | QUARANTINED if unparseable |
| `hsCodeRaw` | TEXT | String | YES | HS/PCT column | HS/PCT column | YES | — | ACCEPTED_NULL |
| `hsCodeNormalized` | TEXT | String | YES | normalized from raw | normalized from raw | — | strip trailing .0 artifacts, keep leading zeros | ACCEPTED_NULL |
| `hsChapter` | CHAR(2) | String | YES | first 2 chars of hsCodeNormalized | same | — | derived | NULL if hs absent |
| `productDescriptionRaw` | TEXT | String | YES | description column | description column | YES | — | ACCEPTED_NULL |
| `productDescriptionNormalized` | TEXT | String | YES | trimmed/uppercased | same | — | normalized | ACCEPTED_NULL |
| `localPartyTaxIdRaw` | TEXT | String | YES | NTN/CNIC column | NTN/CNIC column | YES | — | ACCEPTED_NULL |
| `localPartyTaxIdNormalized` | TEXT | String | YES | digits/dashes only | digits/dashes only | — | normalized | ACCEPTED_NULL |
| `localPartyNameRaw` | TEXT | String | YES | importer name | exporter name | YES | — | ACCEPTED_NULL |
| `localPartyNameNormalized` | TEXT | String | YES | normalized | normalized | — | normalized | ACCEPTED_NULL |
| `localPartyAddressRaw` | TEXT | String | YES | importer address | exporter address | YES | — | ACCEPTED_NULL |
| `localPartyCountryCode` | CHAR(2) | String | YES | `PK` (Pakistan, always) | `PK` (Pakistan, always) | — | derived constant | `PK` |
| `foreignPartyNameRaw` | TEXT | String | YES | exporter name | importer name | YES | — | ACCEPTED_NULL |
| `foreignPartyNameNormalized` | TEXT | String | YES | normalized | normalized | — | normalized | ACCEPTED_NULL |
| `foreignPartyAddressRaw` | TEXT | String | YES | exporter address | importer address | YES | — | ACCEPTED_NULL |
| `foreignPartyCountryRaw` | TEXT | String | YES | country column | country column | YES | — | ACCEPTED_NULL |
| `foreignPartyCountryCode` | CHAR(2) | String | YES | ISO 3166-1 alpha-2 lookup | same | — | normalized | NULL if unknown |
| `originPortRaw` | TEXT | String | YES | port of loading/origin | port of loading/origin | YES | — | ACCEPTED_NULL |
| `originPortNormalized` | TEXT | String | YES | normalized port name/code | normalized | — | normalized | ACCEPTED_NULL |
| `quantityRaw` | TEXT | String | YES | quantity column (string) | quantity column | YES | — | ACCEPTED_NULL |
| `quantityNormalized` | NUMERIC(24,6) | Decimal | YES | parsed decimal | parsed decimal | — | normalized | NULL if unparseable |
| `quantityUnitRaw` | TEXT | String | YES | unit column | unit column | YES | — | ACCEPTED_NULL |
| `quantityUnitCode` | TEXT | String | YES | normalized unit code | normalized | — | normalized | NULL if unknown |
| `unitPriceRaw` | TEXT | String | YES | unit price column | unit price column | YES | — | ACCEPTED_NULL |
| `unitPriceNormalized` | NUMERIC(24,6) | Decimal | YES | parsed decimal | parsed decimal | — | normalized | NULL if unparseable |
| `currencyRaw` | TEXT | String | YES | currency column | currency column | YES | — | ACCEPTED_NULL |
| `currencyCode` | CHAR(3) | String | YES | ISO 4217 alpha-3 lookup | ISO 4217 lookup from numeric | — | normalized | NULL if unknown |
| `sourceSchemaSignature` | TEXT | String | NO | column header fingerprint | column header fingerprint | — | derived at parse | — |
| `mappingVersion` | TEXT | String | NO | system | system | — | locked at batch creation | — |
| `parserVersion` | TEXT | String | NO | system | system | — | locked at batch creation | — |
| `normalizationVersion` | TEXT | String | NO | system | system | — | locked at batch creation | — |
| `validationVersion` | TEXT | String | NO | system | system | — | locked at batch creation | — |
| `rowDisposition` | ENUM | RowDisposition | NO | computed | computed | — | ACCEPTED/QUARANTINED/REJECTED | — |
| `sourceRowEvidence` | JSONB | Json | YES | full raw row as parsed object | same | YES | immutable | always captured |
| `createdAt` | TIMESTAMPTZ | DateTime | NO | system | system | — | auto | — |
| `updatedAt` | TIMESTAMPTZ | DateTime | NO | system | system | — | auto | — |

### E.2 Enum Definitions

```
TradeDirection: IMPORT | EXPORT
RowDisposition: ACCEPTED | QUARANTINED | REJECTED
BatchStatus: RECEIVED | QUEUED | PROCESSING | REVIEW_REQUIRED | READY | PARTIAL | FAILED | CANCELLED | EXPORTING | EXPORTED
JobStatus: PENDING | LEASED | COMPLETED | FAILED | CANCELLED
```

### E.3 Processing Version Snapshot

Every TdrBatch locks an immutable snapshot at creation time:

```
mappingVersion    — e.g. "PAK_CUSTOMS_IMPORT_V1"
parserVersion     — e.g. "csv-parser@3.0.0" or "exceljs@4.4.0"
normalizationVersion — e.g. "tdr-norm-v1"
validationVersion — e.g. "tdr-validation-v1"
```

---

## F. SOURCE MAPPING PROFILE CONTRACT

### F.1 Design Principles

- No Pakistan Customs headings hardcoded in the TdrRecord entity.
- Each source file type is described by a versioned TdrSchemaMapping record.
- Mapping profiles are stored in the database and versioned.
- The mapping profile fingerprint (SHA-256 of sorted column headers) is used to auto-select or auto-detect the profile.

### F.2 Profile Structure (TdrSchemaMapping entity — see Section G)

```typescript
interface SchemaMappingProfile {
  profileId: string;               // e.g. "PAK_CUSTOMS_IMPORT_V1"
  version: number;                 // monotonically incrementing
  tradeDirection: 'IMPORT' | 'EXPORT';
  sourceSchemaFingerprint: string; // SHA-256 of canonical sorted column headers
  columnMappings: ColumnMapping[];
  processingRules: ProcessingRule[];
  requiredColumns: string[];
  optionalColumns: string[];
}

interface ColumnMapping {
  sourceColumnName: string;        // exact header as it appears in source file
  canonicalField: string;          // TdrRecord field name
  sourceDatatype: 'TEXT' | 'DATE' | 'DECIMAL' | 'INTEGER';
  transformationRule?: string;     // e.g. 'CURRENCY_LOOKUP', 'DATE_PARSE_DMY', 'HS_NORMALIZE'
  requiredPolicy: 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL';
  defaultValue?: string;
  validationRules: string[];       // rule codes e.g. ['NOT_EMPTY', 'HS_FORMAT']
}
```

### F.3 Known Profiles to Create in Mega 1

| Profile ID | Direction | Est. columns |
|---|---|---|
| `PAK_CUSTOMS_IMPORT_V1` | IMPORT | ~15 |
| `PAK_CUSTOMS_EXPORT_V1` | EXPORT | ~17 |

Profiles are seeded in a Prisma seed file (not in a migration). Mega 1 will create the schema; Mega 4 will implement the mapping logic; seed data will be created at Mega 4.

---

## G. DATA MODEL v1

### G.1 Entity Relationship

```
Tenant (existing)
 ├── TenantModule           [new] per-tenant module enable/disable
 ├── TdrSchemaMapping       [new] versioned source column mapping profiles
 └── TdrSourceFile          [new] immutable uploaded file evidence
      └── TdrBatch          [new] one processing run per file (1:N for replay)
           ├── TdrProcessingJob  [new] durable async job state
           ├── TdrSourceRow      [new] raw source row evidence (optional, configurable)
           └── TdrRecord         [new] canonical shipment record
                ├── TdrValidationIssue   [new] field/row-level quality issues
                └── TdrQuarantineReview  [new] human review/correction lineage

AuditLog (existing, @Global) — generic event audit for TDR lifecycle events
```

### G.2 TenantModule

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | FK → Tenant, NOT NULL |
| `moduleKey` | VARCHAR(50) | e.g. `TRADE_DATA_REFINERY`, NOT NULL |
| `enabled` | BOOLEAN | default false |
| `enabledAt` | TIMESTAMPTZ? | NULL if not yet enabled |
| `enabledBy` | UUID? | FK → User (optional, who enabled) |
| `configuration` | JSONB? | per-tenant module config |
| `createdAt` | TIMESTAMPTZ | auto |
| `updatedAt` | TIMESTAMPTZ | auto |

Unique constraint: `(tenantId, moduleKey)`. Index: `(tenantId, moduleKey, enabled)`.

**Immutable:** `tenantId`, `moduleKey`. **Mutable:** `enabled`, `configuration`.

TdrModule guard checks: `SELECT enabled FROM tenant_modules WHERE tenantId = ? AND moduleKey = 'TRADE_DATA_REFINERY'`. Returns 403 if not enabled or not found.

### G.3 TdrSchemaMapping

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID? | NULL = platform-wide/default, non-null = tenant-specific override |
| `profileId` | VARCHAR(100) | e.g. `PAK_CUSTOMS_IMPORT_V1`, NOT NULL |
| `version` | INT | monotonic version, NOT NULL |
| `tradeDirection` | ENUM TradeDirection | NOT NULL |
| `sourceSchemaFingerprint` | TEXT | SHA-256 of sorted column headers |
| `mappingConfig` | JSONB | full ColumnMapping[] array |
| `active` | BOOLEAN | only one active per profileId |
| `createdAt` | TIMESTAMPTZ | auto |

Unique: `(profileId, version)`. Index: `(sourceSchemaFingerprint)`, `(tenantId, tradeDirection, active)`.

**Immutable once created.** New version = new row.

### G.4 TdrSourceFile

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | FK → Tenant, NOT NULL |
| `originalFilename` | TEXT | NOT NULL |
| `mimeType` | VARCHAR(100) | `text/csv` or XLSX mime |
| `fileSizeBytes` | BIGINT | NOT NULL |
| `storageKey` | TEXT | storage path/key, NOT NULL |
| `contentHash` | CHAR(64) | SHA-256 hex, NOT NULL |
| `tradeDirection` | ENUM TradeDirection | NOT NULL |
| `uploadedBy` | UUID | FK → User, NOT NULL |
| `uploadedAt` | TIMESTAMPTZ | NOT NULL |
| `createdAt` | TIMESTAMPTZ | auto |

Unique: `(tenantId, contentHash)` — same content within a tenant is the same source file. Index: `(tenantId, uploadedAt)`, `(tenantId, contentHash)`.

**Fully immutable after creation.** No updates.

### G.5 TdrBatch

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | FK → Tenant, NOT NULL |
| `sourceFileId` | UUID | FK → TdrSourceFile, NOT NULL |
| `status` | ENUM BatchStatus | NOT NULL, default RECEIVED |
| `tradeDirection` | ENUM TradeDirection | NOT NULL |
| `mappingVersion` | TEXT | locked at creation, NOT NULL |
| `parserVersion` | TEXT | locked at creation, NOT NULL |
| `normalizationVersion` | TEXT | locked at creation, NOT NULL |
| `validationVersion` | TEXT | locked at creation, NOT NULL |
| `processingFingerprintHash` | CHAR(64) | SHA-256(tenantId+contentHash+allVersions) for duplicate detection |
| `replayOfBatchId` | UUID? | FK → TdrBatch self-ref for intentional replay |
| `replayReason` | TEXT? | human-readable replay justification |
| `totalSourceRows` | INT? | populated after parse |
| `processedRows` | INT | running counter, default 0 |
| `acceptedRows` | INT | default 0 |
| `quarantinedRows` | INT | default 0 |
| `rejectedRows` | INT | default 0 |
| `failedChunks` | INT | default 0 |
| `lastCheckpointAt` | TIMESTAMPTZ? | updated after each chunk |
| `startedAt` | TIMESTAMPTZ? | when worker began |
| `completedAt` | TIMESTAMPTZ? | when READY/FAILED |
| `createdAt` | TIMESTAMPTZ | auto |
| `updatedAt` | TIMESTAMPTZ | auto |
| `createdBy` | UUID | FK → User |

Unique: `(tenantId, processingFingerprintHash)` — prevents silent duplicate processing.

Index: `(tenantId, status)`, `(tenantId, createdAt)`, `(sourceFileId)`, `(tenantId, tradeDirection, status)`.

**Status transitions:** RECEIVED → QUEUED → PROCESSING → REVIEW_REQUIRED | READY | PARTIAL | FAILED | CANCELLED. READY/PARTIAL → EXPORTING → EXPORTED.

### G.6 TdrProcessingJob

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `batchId` | UUID | FK → TdrBatch, NOT NULL, UNIQUE (one job per batch) |
| `tenantId` | UUID | FK → Tenant, NOT NULL (for index) |
| `status` | ENUM JobStatus | PENDING/LEASED/COMPLETED/FAILED/CANCELLED |
| `attemptCount` | INT | default 0 |
| `maxAttempts` | INT | default 3 |
| `leasedAt` | TIMESTAMPTZ? | when worker acquired lease |
| `leaseExpiresAt` | TIMESTAMPTZ? | worker must renew or job becomes re-claimable |
| `leaseDurationMs` | INT | default 300000 (5 min) |
| `lastHeartbeatAt` | TIMESTAMPTZ? | worker liveness |
| `lastCheckpointRow` | INT | row number last successfully committed |
| `workerInstanceId` | TEXT? | worker identity for debugging |
| `errorMessage` | TEXT? | last error |
| `errorStack` | TEXT? | last error stack (trimmed) |
| `completedAt` | TIMESTAMPTZ? | auto |
| `createdAt` | TIMESTAMPTZ | auto |
| `updatedAt` | TIMESTAMPTZ | auto |

Index: `(status, leaseExpiresAt)` — worker polls this. `(batchId)`. `(tenantId, status)`.

**Lease semantics:** Worker SELECTs `WHERE status = 'PENDING' OR (status = 'LEASED' AND leaseExpiresAt < NOW())` with FOR UPDATE SKIP LOCKED (using Prisma raw query). Acquires lease, processes chunks, renews heartbeat. On completion: status = COMPLETED. On failure after maxAttempts: status = FAILED, batch status = FAILED.

### G.7 TdrSourceRow

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `batchId` | UUID | FK → TdrBatch |
| `tenantId` | UUID | FK → Tenant (for isolation index) |
| `sourceRowNumber` | INT | 1-based |
| `rawContent` | JSONB | full raw row as key-value pairs |
| `rowHash` | CHAR(64) | SHA-256 of canonical raw row representation |
| `createdAt` | TIMESTAMPTZ | auto |

**Scale decision:** TdrSourceRow is configurable per TdrBatch. For 100M+ rows, storing a full JSONB copy of every source row is prohibitively expensive. The recommended default is `storeSourceRows: false` in TdrBatch processing config. Source row evidence is stored in `TdrRecord.sourceRowEvidence` (JSONB on the canonical record). TdrSourceRow is available for explicit replay/audit scenarios only. This must be a per-batch opt-in config.

Index: `(batchId, sourceRowNumber)` — UNIQUE. `(tenantId, rowHash)` — duplicate detection within tenant.

### G.8 TdrRecord (Canonical Shipment Record)

Contains all fields from Section E.1 plus:

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `tenantId` | UUID | FK → Tenant, NOT NULL |
| `batchId` | UUID | FK → TdrBatch, NOT NULL |
| `sourceFileId` | UUID | FK → TdrSourceFile, NOT NULL |
| `quarantineReviewRequired` | BOOLEAN | default false |
| `exportEligible` | BOOLEAN | default false — set true when ACCEPTED and not quarantined |
| `exportedAt` | TIMESTAMPTZ? | when included in an export |
| `sourceRowEvidence` | JSONB | full raw row object — immutable |
| `createdAt` | TIMESTAMPTZ | auto |
| `updatedAt` | TIMESTAMPTZ | auto |

**Key indexes:**
- `(tenantId, batchId, rowDisposition)` — primary query path
- `(tenantId, tradeDate)` — time-series analytics
- `(tenantId, hsCodeNormalized, tradeDate)` — HS-based analytics
- `(tenantId, localPartyTaxIdNormalized)` — party analytics
- `(batchId, sourceRowNumber)` — UNIQUE, lineage lookup
- `(tenantId, exportEligible)` — export queue

**Partition readiness:** Future partitioning candidate on `(tenantId, tradeDate)` range partitioning. Do NOT implement partitioning in MVP — add `@@index` and `@@map` as usual and document the partition path.

### G.9 TdrValidationIssue

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `recordId` | UUID | FK → TdrRecord |
| `batchId` | UUID | FK → TdrBatch (denormalized for batch-level queries) |
| `tenantId` | UUID | FK → Tenant |
| `fieldName` | VARCHAR(100) | which field has the issue |
| `ruleCode` | VARCHAR(50) | e.g. `HS_FLOAT_DETECTED`, `DATE_UNPARSEABLE`, `CURRENCY_UNKNOWN` |
| `severity` | ENUM IssueSeverity | WARNING / ERROR / BLOCKING |
| `message` | TEXT | human-readable |
| `rawValue` | TEXT? | the raw value that triggered the issue (not full row) |
| `status` | ENUM IssueStatus | OPEN / REVIEWED / SUPPRESSED |
| `createdAt` | TIMESTAMPTZ | auto |

Index: `(batchId, severity, status)` — batch summary. `(recordId)`. `(tenantId, ruleCode)`.

**Scale note:** Only issues are persisted — not a "one row per field per record" matrix. Typical bad records have 1–5 issues. At 10% quarantine rate on 1M records = ~500K issue rows — acceptable.

### G.10 TdrQuarantineReview

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `recordId` | UUID | FK → TdrRecord |
| `tenantId` | UUID | FK → Tenant |
| `batchId` | UUID | denormalized |
| `reviewedBy` | UUID? | FK → User |
| `action` | ENUM ReviewAction | APPROVE / REJECT / CORRECT |
| `correctionFieldName` | VARCHAR(100)? | which field was corrected |
| `correctionValueHash` | CHAR(64)? | SHA-256 of correction value (not raw value — PII protection) |
| `correctionNote` | TEXT? | reviewer note |
| `appliedAt` | TIMESTAMPTZ? | when correction applied |
| `createdAt` | TIMESTAMPTZ | auto |

**Privacy:** Correction values are NOT stored as plaintext in AuditLog or QuarantineReview. Hash references only in generic audit. Actual corrected values live in TdrRecord canonical columns (tenant-controlled domain table).

Index: `(recordId)`. `(batchId, action)`. `(tenantId, appliedAt)`.

---

## H. INGESTION ARCHITECTURE v1

### H.1 Complete Pipeline

```
POST /tdr/batches/upload
  ↓ JwtAuthGuard (APP_GUARD #1)
  ↓ RolesGuard: @Roles(IMPORT_MANAGER, EXPORT_MANAGER, TENANT_ADMIN, SUPER_ADMIN)
  ↓ TenantModuleGuard (APP_GUARD #3): check TenantModule.enabled for TRADE_DATA_REFINERY
  ↓ @RequiresTenantContext()
  ↓ File type validation (accept: text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
  ↓ Byte-size limit check (configurable max, e.g. 500MB, env-controlled)
  ↓ Multer streaming to temp dir (memory limit: 0 — stream to disk, never buffer full file in RAM)
  ↓ SHA-256 hash of temp file (Node crypto.createHash stream)
  ↓ Check for duplicate: SELECT FROM tdr_source_files WHERE tenantId = ? AND contentHash = ?
  ↓ If duplicate: return 409 with existing sourceFileId and batches list
  ↓ Move temp file to permanent storage key: {tenantId}/{uuid}/{originalFilename}
  ↓ INSERT TdrSourceFile (immutable record)
  ↓ Check for duplicate processing fingerprint: SELECT FROM tdr_batches WHERE processingFingerprintHash = ?
  ↓ INSERT TdrBatch (status = RECEIVED)
  ↓ INSERT TdrProcessingJob (status = PENDING)
  ↓ UPDATE TdrBatch status → QUEUED
  ↓ AuditService.recordEvent('tdr.batch.created', ...)
  ↓ RETURN 202 { batchId, jobId, status: 'QUEUED' }

[Background Worker — NestJS @Interval(5000) or standalone processor]
  ↓ Poll: SELECT job WHERE status = PENDING OR (status = LEASED AND leaseExpiresAt < NOW()) LIMIT 1 FOR UPDATE SKIP LOCKED
  ↓ Acquire lease: UPDATE status = LEASED, leasedAt, leaseExpiresAt = NOW() + 5min
  ↓ Update batch status → PROCESSING
  ↓ Determine parser (CSV vs XLSX) from TdrSourceFile.mimeType
  ↓ Open file from StorageService by storageKey
  ↓ Detect/validate schema headers → compute sourceSchemaFingerprint
  ↓ Resolve mapping profile from TdrSchemaMapping by (tenantId, tradeDirection, active, fingerprint match)
  ↓ Stream/parse rows in chunks of 500
  ↓ FOR EACH CHUNK:
       ↓ Map raw columns → canonical fields using mapping profile
       ↓ Normalize (dates, HS codes, currencies, units, quantities, text)
       ↓ Validate each row, collect TdrValidationIssues
       ↓ Assign rowDisposition: ACCEPTED | QUARANTINED | REJECTED
       ↓ Compute rowHash (SHA-256 of raw row canonical JSON)
       ↓ createMany TdrRecord (bulk)
       ↓ createMany TdrValidationIssue (bulk, for issues found)
       ↓ UPDATE TdrProcessingJob.lastCheckpointRow, lastHeartbeatAt
       ↓ UPDATE TdrBatch counters (processedRows, acceptedRows, quarantinedRows, rejectedRows)
  ↓ On chunk failure: increment failedChunks, retry chunk up to 3x, then mark chunk as failed (do not fail whole batch for one bad chunk — log and continue unless catastrophic)
  ↓ On completion: UPDATE TdrBatch status = READY (if 0 quarantine) | REVIEW_REQUIRED (if quarantine > 0) | PARTIAL (if failedChunks > 0)
  ↓ UPDATE TdrProcessingJob status = COMPLETED
  ↓ AuditService.recordEvent('tdr.batch.completed', ...)
```

### H.2 Storage Contract

```typescript
interface StorageService {
  saveFile(tenantId: string, filename: string, sourcePath: string): Promise<string>; // returns storageKey
  getFilePath(storageKey: string): Promise<string>;   // returns absolute local path
  deleteFile(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}
// MVP: LocalDiskStorageAdapter — stores to ./storage/{storageKey}
// Future: S3StorageAdapter
```

Storage key format: `{tenantId}/{batchId}/{safe-filename}` — no path traversal, sanitized.

### H.3 Parser Strategy

| Format | Library | Streaming | Zip-bomb protection | Formula exec |
|---|---|---|---|---|
| CSV | `csv-parser` (npm) | YES — Node stream | N/A | N/A |
| XLSX | `exceljs` (npm) | Partial streaming | File size + row limit before parse | Disabled (read-only mode) |

XLSX resource limits: max 100MB file, max 2M rows, max 10 sheets parsed (first sheet only), no formula evaluation.

### H.4 Chunk Sizing

| File size | Chunk size |
|---|---|
| Any | 500 rows per transaction |

Each chunk is one Prisma transaction: `prisma.$transaction([...createMany...])`. Checkpoint written after each chunk.

### H.5 Job Locking (DB-backed, MVP)

```sql
-- Atomic lease acquisition (Prisma raw query in Mega 2/3)
SELECT * FROM tdr_processing_jobs
WHERE status = 'PENDING'
   OR (status = 'LEASED' AND lease_expires_at < NOW())
LIMIT 1
FOR UPDATE SKIP LOCKED;
```

If no rows returned: worker sleeps and tries again. If row found: UPDATE status = LEASED, set lease timestamps.

**Stale job recovery:** Any job with `status = LEASED AND leaseExpiresAt < NOW()` is re-claimable. Worker that holds a lease must renew every 60s via heartbeat. If worker crashes, job becomes re-claimable after 5 minutes.

---

## I. BACKGROUND PROCESSING DECISION

**Decision:** DB-backed TdrProcessingJob with NestJS `@Interval()` polling loop.

**Rationale:**
- Repository has no BullMQ, no Redis, no external queue infrastructure
- Adding Redis/BullMQ is significant infrastructure cost for MVP
- PostgreSQL `FOR UPDATE SKIP LOCKED` provides safe distributed locking
- NestJS `@ScheduleModule` + `@Interval()` provides the worker loop without external deps
- This pattern is well-understood, debuggable, and upgradeable
- Future path: BullMQ with Redis when scale requires it — job state table provides clean migration path

**Worker architecture:**
- `TdrProcessorService` injectable service with `@Interval(5000)`
- Registered in `TradeDataRefineryModule`
- Polls for PENDING jobs, acquires lease, processes in background
- `ScheduleModule.forRoot()` added to AppModule in Mega 2

---

## J. DUPLICATE / IDEMPOTENCY / REPLAY MODEL

### J.1 Duplicate Detection (Silent re-upload prevention)

**Level 1 — Source file duplicate:**
- Hash: SHA-256 of file content
- Check: `(tenantId, contentHash)` UNIQUE on TdrSourceFile
- Response: 409 Conflict — "File already uploaded. Existing sourceFileId: X"

**Level 2 — Processing duplicate (same file, same versions):**
- Hash: `SHA-256(tenantId + contentHash + mappingVersion + parserVersion + normalizationVersion + validationVersion)`
- Check: `(tenantId, processingFingerprintHash)` UNIQUE on TdrBatch
- Response: 409 Conflict — "Equivalent processing already exists. Use replay endpoint to create new batch."

### J.2 Intentional Replay

- Endpoint: `POST /tdr/batches/:batchId/replay` (requires TENANT_ADMIN or SUPER_ADMIN)
- Body: `{ reason: string }` (required)
- Creates NEW TdrBatch with: `replayOfBatchId = priorBatchId`, `replayReason = reason`
- New batch uses CURRENT active mapping/parser/normalization/validation versions
- Different version set → different processingFingerprintHash → allowed
- Prior batch is never modified
- Prior TdrRecord, TdrValidationIssue, TdrQuarantineReview rows are never deleted

### J.3 Idempotency

- All upload and batch-creation operations are idempotent by content hash
- Job processing uses checkpointing — if a job is re-leased after worker crash, it resumes from `lastCheckpointRow`
- Rows already written are skipped (batchId + sourceRowNumber UNIQUE on TdrRecord)

---

## K. VALIDATION / DATA QUALITY MATRIX

| Field | Required? | Quarantine on? | Reject on? | Accepted-null? | Normalization |
|---|---|---|---|---|---|
| `tradeDate` | CONDITIONAL (batch-level; if column present, value required) | Unparseable date format | — | — | Parse to ISO DATE; QUARANTINE if fails |
| `tradeDirection` | REQUIRED (file-level) | — | Cannot be determined | — | Derive from file type/mapping profile |
| `hsCode` | OPTIONAL | — | — | YES | Strip trailing `.0`, preserve leading zeros as text |
| `productDescription` | OPTIONAL | — | — | YES | Trim, normalize whitespace |
| `localPartyTaxId` | OPTIONAL | — | — | YES | Digits/dashes only; preserve raw |
| `localPartyName` | OPTIONAL | — | — | YES | Trim, normalize |
| `foreignPartyName` | OPTIONAL | — | — | YES | Trim, normalize |
| `foreignPartyCountry` | OPTIONAL | — | — | YES | ISO lookup; NULL if unknown (no speculation) |
| `originPort` | OPTIONAL | — | — | YES | Trim, normalize |
| `quantity` | OPTIONAL | Unparseable decimal with non-zero expected | — | YES | Parse decimal; NULL if blank; QUARANTINE if clearly invalid |
| `quantityUnit` | OPTIONAL | — | — | YES | Normalize to code; preserve raw if unknown |
| `unitPrice` | OPTIONAL | — | — | YES | Parse decimal; NULL if blank |
| `currency` | OPTIONAL | Unknown currency in quantity-present context | — | YES | ISO 4217 lookup (text labels + numeric codes) |

**Core rules (invariants):**
1. Blank ≠ zero. Blank → NULL. Zero → `0.000000`.
2. Missing ≠ invalid. Missing optional field → ACCEPTED_NULL, not QUARANTINED.
3. Unknown ≠ guessed. Unknown country/currency → preserve raw, set code = NULL.
4. HS/PCT ambiguous (e.g. `6105.2`) → store as text `"6105.2"`, never round or truncate.
5. Derived/defaulted values have `ValueTreatment` tag in sourceRowEvidence metadata.
6. No AI entity matching. No speculative inference.

**Rule codes (used in TdrValidationIssue.ruleCode):**

| Code | Meaning |
|---|---|
| `DATE_UNPARSEABLE` | Date value cannot be parsed to ISO date |
| `HS_FLOAT_ARTIFACT` | HS code looks like float representation |
| `CURRENCY_UNKNOWN` | Currency not found in ISO 4217 lookup |
| `UNIT_UNKNOWN` | Unit not found in known unit table |
| `DECIMAL_PARSE_FAILURE` | Quantity or price cannot be parsed to decimal |
| `REQUIRED_FIELD_EMPTY` | A required field is blank |
| `SCHEMA_MISMATCH` | Incoming columns do not match mapping profile |
| `ENCODING_ERROR` | File encoding issue in row |

---

## L. SECURITY / TENANCY MODEL

### L.1 Guard Chain

```
APP_GUARD #1: JwtAuthGuard     — authentication (existing)
APP_GUARD #2: RolesGuard       — role authorization (existing)
APP_GUARD #3: TenantModuleGuard — TDR module enabled for tenant (NEW in Mega 2)
```

TenantModuleGuard:
- Reads `X-Tenant-Id` header or JWT `tenantId` claim
- Queries `TenantModule WHERE tenantId = ? AND moduleKey = 'TRADE_DATA_REFINERY' AND enabled = true`
- Returns 403 if not enabled
- Only applies to TDR routes (use `@SkipTenantModuleGuard()` decorator for non-TDR routes, or guard is module-scoped, not APP_GUARD — **decision: scope guard to TDR routes only via guard on controller, not as APP_GUARD**)

### L.2 TDR Role-Operation Matrix

| Operation | SUPER_ADMIN | TENANT_ADMIN | IMPORT_MANAGER | EXPORT_MANAGER | SALES_MANAGER | PROCUREMENT_MANAGER | ANALYST | VIEWER |
|---|---|---|---|---|---|---|---|---|
| Enable/disable TDR module | ✅ | — | — | — | — | — | — | — |
| Upload IMPORT file | ✅ | ✅ | ✅ | — | — | ✅ | — | — |
| Upload EXPORT file | ✅ | ✅ | — | ✅ | ✅ | — | — | — |
| View batch list | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View batch detail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review quarantine | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — |
| Approve quarantine correction | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | — |
| Replay batch | ✅ | ✅ | — | — | — | — | — | — |
| Cancel batch | ✅ | ✅ | — | — | — | — | — | — |
| Export records | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### L.3 Tenant Isolation Invariants

1. Every database query for TDR data includes `tenantId = currentTenantId` — no exceptions.
2. Resource ownership validation: every GET/PATCH on a batch, record, or job verifies `batch.tenantId === requestingTenantId`.
3. File storage keys are prefixed with `tenantId/` — cross-tenant access requires knowing another tenant's UUID.
4. Export operations validate `record.tenantId === requestingTenantId` for every row.
5. Audit events always include `tenantId`.

### L.4 Upload Safety

| Control | Mechanism |
|---|---|
| File type validation | Multer `fileFilter` — accept only `text/csv` and XLSX mime type |
| Byte size limit | `multer({ limits: { fileSize: maxBytes } })` — env-configured |
| Streaming (no full-file buffer) | `multer({ storage: diskStorage(...) })` — temp file, not memory buffer |
| Path traversal | Storage key sanitized: `encodeURIComponent(filename)`, no `..\` sequences |
| XLSX zip-bomb | File size check BEFORE parse, `exceljs` row limit |
| CSV formula injection (export) | Prefix cells starting with `=`, `+`, `-`, `@` with single quote in CSV export |
| XLSX formula execution | `exceljs` read-only mode — no formula evaluation |
| Storage key collision | Include UUID in key path |

---

## M. AUDIT / PRIVACY MODEL

### M.1 TDR Audit Event Taxonomy (16 events from TDR-P2-004)

| Category | Event | Action string | entity_type |
|---|---|---|---|
| Batch lifecycle | Batch created | `tdr.batch.created` | `tdr_batch` |
| Batch lifecycle | Batch processing started | `tdr.batch.processing_started` | `tdr_batch` |
| Batch lifecycle | Batch completed (READY) | `tdr.batch.completed` | `tdr_batch` |
| Batch lifecycle | Batch completed (REVIEW_REQUIRED) | `tdr.batch.review_required` | `tdr_batch` |
| Batch lifecycle | Batch failed | `tdr.batch.failed` | `tdr_batch` |
| Batch lifecycle | Batch cancelled | `tdr.batch.cancelled` | `tdr_batch` |
| Row validation | Validation issue created | `tdr.validation.issue_created` | `tdr_validation_issue` |
| Row validation | Row quarantined | `tdr.row.quarantined` | `tdr_record` |
| Row validation | Row rejected | `tdr.row.rejected` | `tdr_record` |
| Quarantine | Quarantine reviewed | `tdr.quarantine.reviewed` | `tdr_quarantine_review` |
| Replay | Batch replayed | `tdr.batch.replayed` | `tdr_batch` |
| Replay | Replay completed | `tdr.batch.replay_completed` | `tdr_batch` |
| Schema/Mapping | Mapping profile activated | `tdr.mapping.profile_activated` | `tdr_schema_mapping` |
| Schema/Mapping | Schema mismatch detected | `tdr.schema.mismatch_detected` | `tdr_source_file` |
| Module lifecycle | TDR module enabled | `tdr.module.enabled` | `tenant_module` |
| Module lifecycle | TDR module disabled | `tdr.module.disabled` | `tenant_module` |

### M.2 Safe Metadata Pattern for Audit Events

```typescript
// ALLOWED in audit metadata
{ tenantId, batchId, sourceFileId, acceptedRows, quarantinedRows, rejectedRows, 
  mappingVersion, validationVersion, ruleCode, rowNumber, contentHash }

// FORBIDDEN in audit metadata
// raw file content, raw row payload, NTN, CNIC, tax ID, 
// party names, addresses, emails, phone, financial values, 
// corrected values (use hash), credentials, secrets
```

### M.3 sanitizeMetadata Extension

In Mega 4, extend `SENSITIVE_KEYS` in `audit-event.type.ts` to add TDR-specific PII keys:

```typescript
'ntn', 'cnic', 'taxId', 'taxIdNormalized', 'partyName', 'address', 'email', 
'phone', 'correctionValue', 'rawContent', 'rawRow'
```

---

## N. PERFORMANCE / SCALE MODEL

### N.1 MVP Scale Targets

| Metric | MVP requirement |
|---|---|
| File size | Up to 500MB (configurable) |
| Row count | Up to 1,000,000 rows in a single batch |
| Memory per worker | Bounded — never load entire file into RAM |
| Chunk size | 500 rows |
| Persistence | createMany — no row-at-a-time |
| HTTP request | Returns 202 before processing completes |
| Worker concurrency | 1 worker loop (MVP — `LIMIT 1` in job poll) |
| Progress update | After each chunk (every 500 rows) |

### N.2 Strategic Scale Path

| Capability | MVP mechanism | Future mechanism |
|---|---|---|
| File parsing | csv-parser stream | Same (no change needed) |
| Bulk persistence | Prisma createMany | PostgreSQL COPY via staging table |
| Job queue | DB-backed TdrProcessingJob | BullMQ + Redis when horizontal scale needed |
| File storage | Local disk | S3/Object storage |
| Worker concurrency | Single worker | Worker pool (multiple instances) |
| Analytics | Direct table queries | Materialized views, pre-aggregation |
| Partitioning | None (MVP) | Range partition on (tenantId, tradeDate) |
| OLAP | None | External DWH when justified |

### N.3 Future Partition Candidates

| Table | Partition key | Estimated cardinality |
|---|---|---|
| TdrRecord | (tenantId, tradeDate) RANGE by month | 100M–500M rows |
| TdrSourceRow | (tenantId, batchId) | Same order as TdrRecord |
| TdrValidationIssue | (tenantId, createdAt) | 10–20% of TdrRecord |
| AuditLog | (tenantId, createdAt) | Already indexed — future candidate |

**Do NOT implement partitioning in MVP.** Document the candidates here for Mega 6 planning.

---

## O. MIGRATION / INDEX / PARTITION-READINESS PLAN

### O.1 Migration Order for Mega 1

```
Migration: tdr_mvp_data_foundation
Order:
1. Create enums: TradeDirection, BatchStatus, JobStatus, RowDisposition, IssueSeverity, IssueStatus, ReviewAction
2. Create TenantModule (FK → Tenant)
3. Create TdrSchemaMapping (FK → Tenant optional)
4. Create TdrSourceFile (FK → Tenant, FK → User for uploadedBy)
5. Create TdrBatch (FK → Tenant, FK → TdrSourceFile, self-ref replayOfBatchId)
6. Create TdrProcessingJob (FK → TdrBatch, FK → Tenant)
7. Create TdrRecord (FK → Tenant, FK → TdrBatch, FK → TdrSourceFile)
8. Create TdrSourceRow (FK → TdrBatch, FK → Tenant)
9. Create TdrValidationIssue (FK → TdrRecord, FK → TdrBatch, FK → Tenant)
10. Create TdrQuarantineReview (FK → TdrRecord, FK → Tenant, FK → User optional)
```

### O.2 Enum Creation Strategy (PostgreSQL via Prisma)

Prisma generates `CREATE TYPE "BatchStatus" AS ENUM (...)` for each enum. Enum creation must precede table creation. Prisma handles this automatically in migration generation — no manual ordering needed.

**Important:** Prisma enum values are case-sensitive. Use uppercase consistent with existing schema (`TenantType`, `TenantStatus` are uppercase).

### O.3 Index Design

| Index | Table | Columns | Type | Justification |
|---|---|---|---|---|
| IDX-1 | TenantModule | (tenantId, moduleKey) | UNIQUE | Module lookup |
| IDX-2 | TenantModule | (tenantId, moduleKey, enabled) | INDEX | Guard check |
| IDX-3 | TdrSourceFile | (tenantId, contentHash) | UNIQUE | Duplicate detection |
| IDX-4 | TdrSourceFile | (tenantId, uploadedAt) | INDEX | List sorting |
| IDX-5 | TdrBatch | (tenantId, processingFingerprintHash) | UNIQUE | Processing duplicate |
| IDX-6 | TdrBatch | (tenantId, status) | INDEX | Batch list by status |
| IDX-7 | TdrBatch | (tenantId, createdAt) | INDEX | Batch list by date |
| IDX-8 | TdrBatch | (sourceFileId) | INDEX | File → batches |
| IDX-9 | TdrProcessingJob | (status, leaseExpiresAt) | INDEX | Worker poll |
| IDX-10 | TdrProcessingJob | (batchId) | UNIQUE | One job per batch |
| IDX-11 | TdrRecord | (tenantId, batchId, rowDisposition) | INDEX | Primary query |
| IDX-12 | TdrRecord | (tenantId, tradeDate) | INDEX | Time-series |
| IDX-13 | TdrRecord | (tenantId, hsCodeNormalized, tradeDate) | INDEX | HS analytics |
| IDX-14 | TdrRecord | (tenantId, localPartyTaxIdNormalized) | INDEX | Party analytics |
| IDX-15 | TdrRecord | (batchId, sourceRowNumber) | UNIQUE | Lineage lookup |
| IDX-16 | TdrRecord | (tenantId, exportEligible) | INDEX | Export queue |
| IDX-17 | TdrSourceRow | (batchId, sourceRowNumber) | UNIQUE | Row lookup |
| IDX-18 | TdrValidationIssue | (batchId, severity, status) | INDEX | Batch summary |
| IDX-19 | TdrValidationIssue | (recordId) | INDEX | Record issues |
| IDX-20 | TdrQuarantineReview | (recordId) | INDEX | Record reviews |
| IDX-21 | TdrQuarantineReview | (batchId, action) | INDEX | Batch review summary |

### O.4 Rollback Safety

- All new tables are TDR-specific — rollback drops TDR tables only
- No existing tables modified in Mega 1
- Existing migrations are untouched
- Enum drops require CASCADE — document carefully in migration file
- Rollback plan: `DROP TABLE tdr_* CASCADE; DROP TYPE BatchStatus, ...`

### O.5 Test Migration Procedure

1. Run `npx prisma migrate dev --name tdr_mvp_data_foundation` in local dev
2. Verify with `npx prisma validate`
3. Run `prisma db pull` to confirm schema round-trips
4. Run `npm test` — 109/109 regression must still PASS
5. Write new Mega 1 DB integration tests (minimum 20 tests covering TDR models)

---

## P. FRONTEND / API CONTRACT BOUNDARY

### P.1 API Endpoints (defined in Mega 2, implemented in Mega 3/4)

| Method | Path | Description | Guards |
|---|---|---|---|
| POST | `/tdr/batches/upload` | Upload file, create batch | JWT + Roles + TenantModule |
| GET | `/tdr/batches` | List batches for tenant | JWT + TenantModule |
| GET | `/tdr/batches/:id` | Batch detail + progress | JWT + TenantModule |
| GET | `/tdr/batches/:id/records` | Paginated canonical records | JWT + TenantModule |
| GET | `/tdr/batches/:id/issues` | Validation issues for batch | JWT + TenantModule |
| GET | `/tdr/batches/:id/quarantine` | Quarantined records | JWT + TenantModule |
| POST | `/tdr/batches/:id/replay` | Intentional replay | JWT + Roles(TENANT_ADMIN, SUPER_ADMIN) + TenantModule |
| POST | `/tdr/batches/:id/cancel` | Cancel processing | JWT + Roles(TENANT_ADMIN, SUPER_ADMIN) + TenantModule |
| PATCH | `/tdr/records/:id/quarantine` | Submit quarantine review | JWT + Roles(IMPORT/EXPORT/TENANT_ADMIN) + TenantModule |
| GET | `/tdr/analytics/summary` | Basic analytics summary | JWT + TenantModule |
| GET | `/tdr/batches/:id/export` | CSV export of eligible records | JWT + Roles + TenantModule |

### P.2 Frontend Data Fetching Plan (Mega 5)

Frontend uses Next.js 16 App Router. Data fetching approach:
- **Server Components** for initial page load (GET /tdr/batches, /analytics/summary)
- **Client Components** with `useSWR` or polling for progress (GET /tdr/batches/:id)
- **Recommendation:** Add `swr` package in Mega 5 — lightweight, no heavy state manager needed for MVP
- **API client:** Simple typed fetch wrapper `lib/api.ts` with auth header injection

### P.3 Auth Integration (Mega 5)

Frontend needs JWT token management:
- Login state: store JWT access token in memory (not localStorage)
- Refresh token: httpOnly cookie (already implemented in backend)
- API calls: `Authorization: Bearer <token>` header
- Session expiry: intercept 401, attempt refresh, retry once

---

## Q. TEST ARCHITECTURE

### Q.1 Existing Test Foundation (109 tests)

| Suite | Tests | Type |
|---|---|---|
| auth.spec.ts | ~67 | Unit + integration |
| auth-rbac.spec.ts | ~42 | RBAC guards |
| p8-002-db-integration.spec.ts | ~9 | DB integration |
| test.utils.spec.ts | — | Utils |

### Q.2 New Test Requirements (Mega 1+)

| Mega | Test file | Test count (min) | Type |
|---|---|---|---|
| Mega 1 | `tdr-data-foundation.spec.ts` | 20 | DB integration — create/read/unique constraints for all TDR models |
| Mega 2 | `tdr-module.spec.ts` | 25 | Unit — TenantModuleGuard, batch/job API, status APIs |
| Mega 3 | `tdr-ingestion.spec.ts` | 30 | Integration — upload, hash, duplicate detection, job creation, worker processing |
| Mega 4 | `tdr-quality.spec.ts` | 30 | Unit + integration — mapping, normalization, validation, quarantine, export |
| Mega 5 | Frontend type-check + build | — | TSC + next build |
| Mega 6 | End-to-end + regression | 20+ | E2E acceptance |

**Total new tests target: 125+ (on top of 109 baseline = 234+ by Mega 6)**

### Q.3 Test Conventions (from existing codebase)

- Jest 29, ts-jest
- `TestingModule` from `@nestjs/testing`
- Mock PrismaService with `jest.spyOn` or manual mock in `test.module.ts`
- DB integration tests use real `toplineshop_dev` database
- Test files co-located in `src/testing/` or adjacent to module
- `npm test -- --forceExit` pattern already established

---

## R. FINAL 7-MEGA-PROMPT MAP

| Mega | Task ID | Purpose | Runtime changes | Tests | Commit |
|---|---|---|---|---|---|
| **0** | TDR-MVP-COMPRESS-PLAN-001 | Architecture + scope freeze | NONE | None | Governance/planning files only |
| **1** | TDR-MVP-DATA-FOUNDATION-001 | Prisma models, migration, constraints, indexes, DB tests | Prisma schema only | 20+ new DB tests | TDR schema + migration + tests |
| **2** | TDR-MVP-BACKEND-CORE-001 | TradeDataRefineryModule, TenantModule guard, RBAC, file/batch/job metadata APIs, status/progress APIs, background worker orchestration | Backend module, controllers, services, guards | 25+ new | Backend module files |
| **3** | TDR-MVP-INGESTION-ENGINE-001 | Safe upload, storage, hashing, duplicate detection, CSV/XLSX parsing, stream/chunk ingestion, source row evidence, bulk persistence, checkpoint, retry, recovery, replay | Backend ingestion service, storage adapter, parsers | 30+ new | Ingestion files + new packages |
| **4** | TDR-MVP-QUALITY-EXPORT-001 | Schema mapping, normalization, validation, row disposition, validation issues, quarantine review, correction lineage, audit events, export | Backend quality/export services | 30+ new | Quality/export files |
| **5** | TDR-MVP-FRONTEND-001 | Upload UI, batch list, batch detail, progress polling, validation summary, quarantine review UI, basic analytics, export | Frontend: API client, SWR hooks, updated TDR page | TSC + next build | Frontend files |
| **6** | TDR-MVP-FINAL-AUDIT-001 | End-to-end acceptance, security, tenant isolation, regression, large-file architecture test, backend + frontend verification, MVP PASS/BLOCKED declaration | None (test/audit only) | 20+ E2E tests | WDR + audit evidence |

**Expansion rule:** Do NOT add megas. If a mega becomes too large, scope it tighter — not split. The 6 implementation megas + 1 audit mega is the ceiling.

---

## S. MVP ACCEPTANCE MATRIX

| # | Criterion | Verified by |
|---|---|---|
| 1 | G1 remains PASS | G1 WDR (existing) |
| 2 | G2 remains PASS | G2 WDR (existing) |
| 3 | TenantModule enable/disable works | Mega 2 tests |
| 4 | Authentication enforced on all TDR routes | Mega 2 RBAC tests |
| 5 | RBAC enforced — correct role matrix | Mega 2 RBAC tests |
| 6 | Tenant isolation enforced — all queries scoped by tenantId | Mega 2/3 tests |
| 7 | Cross-tenant denial tests PASS | Mega 2/6 tests |
| 8 | CSV upload works | Mega 3 tests |
| 9 | XLSX upload works | Mega 3 tests |
| 10 | Async processing works — upload returns 202 before processing completes | Mega 3 tests |
| 11 | File evidence/hash retained (immutable TdrSourceFile) | Mega 3 tests |
| 12 | Duplicate file upload returns 409 | Mega 3 tests |
| 13 | Equivalent processing duplicate returns 409 | Mega 3 tests |
| 14 | Intentional replay creates new batch with new lineage | Mega 3/4 tests |
| 15 | Source row lineage preserved (batchId + sourceRowNumber UNIQUE) | Mega 3/4 tests |
| 16 | Mapping version locked at batch creation | Mega 3 tests |
| 17 | Parser version locked at batch creation | Mega 3 tests |
| 18 | Normalization version locked | Mega 4 tests |
| 19 | Validation version locked | Mega 4 tests |
| 20 | HS code stored as TEXT, not FLOAT | Mega 1 DB tests |
| 21 | Raw HS value preserved in sourceRowEvidence | Mega 4 tests |
| 22 | Decimal-safe quantity/price (NUMERIC(24,6)) | Mega 1 DB tests |
| 23 | Blank values → NULL (not zero) | Mega 4 tests |
| 24 | Normalization is deterministic (same input = same output) | Mega 4 tests |
| 25 | Validation issues retained with ruleCode | Mega 4 tests |
| 26 | Quarantine reviewable (TdrQuarantineReview workflow) | Mega 4/6 tests |
| 27 | Corrections retain lineage (correctionValueHash, not raw) | Mega 4 tests |
| 28 | Rejected rows retain reason codes | Mega 4 tests |
| 29 | Job retry/recovery works (lease expiry re-claim) | Mega 3 tests |
| 30 | Checkpointing works (resume from lastCheckpointRow) | Mega 3 tests |
| 31 | Bounded memory design verified (streaming, no full-file buffer) | Mega 3 code review |
| 32 | Audit privacy enforced (no PII in AuditLog metadata) | Mega 4/6 audit |
| 33 | CSV export safe (formula injection prevention) | Mega 4 tests |
| 34 | Internal export safe (tenantId isolation verified) | Mega 4 tests |
| 35 | Basic analytics works | Mega 5 + Mega 6 |
| 36 | Backend tests PASS (109+ regression, 125+ new) | All megas |
| 37 | Frontend TSC clean, next build PASS | Mega 5 |
| 38 | No unrelated diff in any governed commit | All megas (diff audit) |
| 39 | No secrets in any commit | All megas |
| 40 | Complete WDR for every mega | All megas |
| 41 | Mega 6 final audit PASS | Mega 6 |

---

## T. RISKS

| Risk ID | Risk | Severity | Mitigation |
|---|---|---|---|
| R-001 | XLSX zip-bomb causes OOM crash | HIGH | File size limit before parse, exceljs row limit, OS-level resource limits |
| R-002 | DB-backed job queue bottleneck at scale | MEDIUM | FOR UPDATE SKIP LOCKED is efficient; future BullMQ path is designed in |
| R-003 | Source file storage fills local disk | MEDIUM | Configurable size limits; storage abstraction makes S3 migration clean |
| R-004 | Very large createMany exceeds Postgres parameter limit (65535) | MEDIUM | Chunk size 500 rows × ~30 fields = ~15,000 params — within limit |
| R-005 | Frontend has no auth/session management | MEDIUM | Must be added in Mega 5; plan includes JWT in-memory + refresh cookie |
| R-006 | NTN/CNIC normalization incorrect for Pakistan tax IDs | LOW | Raw value always preserved; normalized column is OPTIONAL/ACCEPTED_NULL |
| R-007 | PermissionsGuard not registered as APP_GUARD | LOW | Not needed for TDR MVP — @Roles() is sufficient. FUTURE_TASK if fine-grained permissions needed |
| R-008 | TdrSourceRow at full volume (100M rows × JSONB) | HIGH | TdrSourceRow is OPT-IN per batch (default: disabled). Row evidence stored in TdrRecord.sourceRowEvidence only. |
| R-009 | Currency normalization mismatch between IMPORT/EXPORT | MEDIUM | Both ISO 4217 text and numeric lookups implemented; unknown currencies preserved |
| R-010 | Migration has blocking table lock during production deploy | MEDIUM | All TDR migrations create new tables — no ALTER on existing tables — non-blocking |

---

## U. OPEN PM DECISIONS

Only items that materially affect business scope, user behavior, commercial cost, or compliance:

| # | Decision needed | Default if not answered | Impact |
|---|---|---|---|
| PM-001 | Maximum upload file size (bytes) | 500MB | Affects infrastructure cost and UX |
| PM-002 | Retention policy for TdrRecord data | No auto-deletion in MVP | Affects storage cost at scale |
| PM-003 | Should TdrSourceRow storage be opt-in (default OFF) or always-on? | Opt-in (default OFF) | Always-on is ~3x storage cost at scale |
| PM-004 | Are quarantine corrections stored as-entered (PII risk) or hash-referenced (audit-only)? | Hash-referenced (RECOMMENDED) | PII compliance vs. audit completeness |
| PM-005 | Should Mega 5 frontend auth use in-memory JWT or localStorage? | In-memory (RECOMMENDED — more secure) | Security posture |

All other decisions are architectural and have been made above.

---

## V. FINAL MEGA 1 READINESS VERDICT

**READY FOR TDR-MVP-DATA-FOUNDATION-001**

Evidence:
- G1: PASS
- G2: PASS
- Backend regression: 109/109 PASS
- Architecture frozen: all 18 decisions made (AD-001 through AD-018)
- Data model frozen: 9 entities defined (TenantModule, TdrSchemaMapping, TdrSourceFile, TdrBatch, TdrProcessingJob, TdrRecord, TdrSourceRow, TdrValidationIssue, TdrQuarantineReview)
- Canonical shipment contract frozen: all fields typed, nullable policy set
- Enum strategy defined: 7 enums
- Migration order defined: 10 steps, safe FK order
- Index design frozen: 21 indexes justified
- Security model frozen: guard chain, role matrix, isolation invariants
- Audit model frozen: 16 event taxonomy, safe metadata contract
- Test architecture defined: 125+ new tests across Megas 1–6
- No fundamental schema decisions remain open
- No runtime code changed in Mega 0
- 5 Open PM decisions documented (non-blocking for Mega 1 — all have safe defaults)

**Mega 1 may begin after PM review and authorization of this document.**

Do NOT start Mega 1 without explicit PM go-ahead.
