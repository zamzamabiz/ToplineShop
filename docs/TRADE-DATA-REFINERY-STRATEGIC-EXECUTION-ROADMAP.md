# Trade Data Refinery
## Comprehensive Strategic Execution Plan

| Document control | Value |
|---|---|
| Repository | `zamzamabiz/ToplineShop` |
| Local repository reviewed | `E:\ToplineShop` |
| Stable branch | `master` |
| TDR integration branch | `codex/trade-data-refinery` |
| Plan version | 2.0 |
| Plan date | 2026-09-13 |
| Status | OWNER/PM APPROVED strategic execution roadmap |
| Authorization | User authorization recorded 2026-09-13 |
| CTO / governing AI | ChatGPT Luna |
| Execution and coding AI | Claude Code |
| Delivery protocol | `DISCUSS → DECIDE → EXECUTE → VERIFY/AUDIT → CLOSE → NEXT` |
| Governing source of truth | `src/project/projectRegistry.ts` |

---

## 1. Executive decision

Trade Data Refinery (TDR) will be developed as an optional, tenant-aware business module inside the ToplineShop modular SaaS platform. It will convert approved trade data into governed, validated, traceable, and analytics-ready records without weakening the marketplace, tenant isolation, security model, or current project governance.

The first production objective is a narrow, proven vertical slice:

> An authorized tenant uploads one approved CSV data set; the system preserves the original evidence, validates and normalizes each row, quarantines failures, publishes accepted records into a canonical model, exposes lineage and quality results, and reproduces the same outcome safely when replayed.

This roadmap is authorized as the governing TDR plan. Authorization permits CTO setup and preparation of the next bounded task; it does not waive ToplineShop safety gates. TDR implementation must not begin with database migrations, authentication changes, queues, object storage, external connectors, or analytical infrastructure. The repository is currently in ToplineShop Phase 8, which is blocked pending PM audit, and `TOPLINE-P8-002` remains unapproved. TDR therefore starts with governance registration and frontend proof. Backend and persistence work starts only after the platform security and database prerequisites are approved.

## 2. Critical audit of version 1.0

The first plan established useful principles but was not ready to execute. This revision closes the following gaps.

| Finding | Why it was unsafe or incomplete | Correction in version 2.0 |
|---|---|---|
| Generic architecture | It did not map to the actual Next.js, NestJS, Prisma, and PostgreSQL repository | Adds repository-specific placement and dependency boundaries |
| Incorrect execution order | It began with backend ingestion despite the mandatory frontend-first policy | Adds a UX proof and freeze gate before backend work |
| Missing platform blocker | It did not acknowledge blocked Phase 8 Auth/RBAC work | Adds a hard dependency and explicit stop gate |
| Undefined module boundary | It could become a parallel platform or tightly coupled marketplace feature | Defines TDR as an optional tenant module with isolated routes and services |
| Over-assumed infrastructure | Raw storage, queues, and analytics storage were described as selected | Separates MVP choices from deferred architecture decisions |
| Weak governance integration | It omitted the project registry, WDR process, PM audit, and exact-file staging rules | Embeds ToplineShop governance into every task and phase |
| No executable backlog | Phases lacked bounded task IDs, dependencies, effort, and evidence | Adds a dependency-ordered task sequence and milestone map |
| Unmeasurable quality goals | “Trusted” and “production-ready” lacked thresholds | Adds measurable reconciliation, lineage, idempotency, security, and recovery criteria |
| Incomplete data model | It listed domains but not ownership, states, identifiers, or tenant rules | Adds model boundaries, lifecycle states, and invariants |
| Missing operational design | Failure recovery, replay authority, retention, and incidents were underspecified | Adds operational controls, runbooks, metrics, alerts, and recovery gates |
| Missing decision register | Important choices could be silently assumed | Adds mandatory decisions that must be approved before implementation |

## 3. Repository baseline and constraints

### 3.1 Verified technical baseline

- Frontend: Next.js `16.3.4`, React `19.2.8`, TypeScript `5`, Tailwind CSS `4`.
- Backend: NestJS `11`, TypeScript `5.7`, Jest `29`.
- Data access: Prisma `6.19.3` with PostgreSQL.
- Existing backend domains: tenants, vendors, categories, products, audit, common infrastructure, testing utilities, and Prisma.
- Existing database baseline: Tenant, User, Membership, Vendor, Category, Product, and AuditLog models.
- Existing project state: Phase 8 is blocked; `TOPLINE-P8-002` is planned but not approved.
- Existing TDR branch: `codex/trade-data-refinery`, clean and tracking its remote branch.

### 3.2 Immutable project constraints

1. ToplineShop remains greenfield.
2. `shop.com` is strictly out of scope and must not be read, copied, imported, or used as a migration source.
3. Frontend behavior must be visually proved and frozen before deep backend implementation.
4. Only one governed task may execute at a time.
5. Every governed task requires a WDR and evidence.
6. PM audit is required before the next task begins.
7. `src/project/projectRegistry.ts` is the project-status source of truth.
8. No destructive database operation is permitted without explicit approval.
9. No credentials, source secrets, or sensitive payloads may enter Git.
10. Git must stage exact files only; bulk staging is forbidden.
11. Unexpected architecture, existing content, security scope, or destructive risk is a stop condition.

### 3.3 Strategic boundary

TDR must use platform capabilities rather than duplicate them.

| Capability | Platform ownership | TDR ownership |
|---|---|---|
| Tenant identity | Platform core | Consume tenant context; never create a parallel tenant model |
| User authentication | Platform core | Consume authenticated principal |
| Roles and permissions | Platform core | Define TDR permissions after platform RBAC exists |
| Audit infrastructure | Platform core | Emit TDR events through the approved audit service |
| Module enablement | Platform core | Register TDR and respect tenant enablement |
| Trade ingestion and refinement | — | TDR module |
| Canonical trade records | — | TDR module, tenant-scoped |
| Data-quality rules and findings | — | TDR module |
| Review, correction, quarantine, replay | — | TDR module |
| Marketplace publication | Marketplace | Optional downstream contract only |

## 4. Vision, outcomes, and success measures

### 4.1 Vision

Provide a dependable control plane for trade data so operational users can see what arrived, what failed, why it failed, what changed, who approved it, and what became publishable.

### 4.2 Business outcomes

- Reduce manual spreadsheet reconciliation and opaque data correction.
- Prevent invalid, duplicate, or cross-tenant data from entering trusted datasets.
- Establish a reusable source-to-canonical pipeline for future trade integrations.
- Make data quality measurable by source, batch, rule, and period.
- Give reviewers a controlled exception workflow with complete evidence.
- Provide trusted canonical records for future marketplace, ERP, reporting, and intelligence use cases.

### 4.3 MVP success measures

| Measure | MVP target |
|---|---|
| Tenant isolation | 100% pass on positive and negative authorization tests |
| Import accounting | Input rows = accepted + quarantined + rejected for every completed batch |
| Lineage | 100% of published records trace to source, batch, mapping version, and transformation result |
| Idempotency | Replaying the same source and idempotency key creates zero unintended duplicates |
| Determinism | Same input plus same mapping/rule versions yields the same normalized result |
| Rule explainability | Every failed rule has a code, severity, scope, and human-readable reason |
| Auditability | Every material state change includes actor, tenant, action, target, time, and correlation ID |
| Security | Zero open critical or high-severity release blockers |
| Recovery | Failed jobs resume or replay without manual database edits |
| Operability | Health, status, failures, throughput, latency, and quarantine metrics are observable |

Performance targets must be baselined with representative files during the vertical slice. No throughput promise is approved before evidence exists.

## 5. Scope

### 5.1 MVP scope

- Tenant-scoped TDR module registration and navigation.
- Frontend proof for overview, sources, import, batch detail, quarantine, comparison, lineage, and quality reporting.
- One approved CSV source profile using synthetic, non-sensitive sample data.
- File envelope validation and configurable size/row limits.
- Immutable import manifest and source checksum.
- Versioned source schema and mapping definition.
- Parsing, normalization, validation, deduplication, and classification.
- Batch and record state tracking.
- Quarantine review with authorized approve, reject, correct, and replay actions.
- Canonical product/trade-line publication for the selected vertical slice.
- Lineage, audit events, quality metrics, operational logs, and basic alerts.
- Automated unit, integration, contract, security, and end-to-end tests.
- Deployment, rollback, backup, and operational documentation for the approved environment.

### 5.2 Post-MVP scope

- Additional file profiles and source-specific mappings.
- Scheduled SFTP or API connectors.
- High-volume asynchronous processing.
- Reference-data stewardship and advanced entity resolution.
- Canonical documents such as purchase orders, invoices, shipments, receipts, or declarations.
- Governed export feeds and analytical projections.
- Source scorecards, anomaly detection, and quality trend analysis.
- Optional downstream marketplace or ERP publication workflows.

### 5.3 Explicitly out of scope until separately approved

- Scraping or importing from `shop.com`.
- Autonomous correction of prices, quantities, taxes, financial values, identities, or compliance attributes.
- Automated trading, purchasing, settlement, payment, or accounting decisions.
- A new authentication system or tenant model.
- A separate microservice estate for the MVP.
- Kafka, Redis, ClickHouse, object storage, workflow orchestration, or managed cloud services without an approved decision and demonstrated need.
- Destructive migration of existing marketplace data.
- Production ingestion of confidential customer data before security and retention approval.

## 6. Product surfaces and frontend-first proof

TDR frontend work uses mock data and inert actions until the UX freeze gate passes.

| Surface | Purpose | Required proof |
|---|---|---|
| TDR Overview | Show freshness, batch status, quality, quarantine, and source health | Empty, loading, healthy, warning, failed, and disabled-module states |
| Sources | List configured source profiles and owners | Search, filter, status, schema version, and last-run states |
| Source Detail | Show contract, mappings, schedules, and quality history | Version history and disabled edit controls before authorization |
| New Import | Select source profile and submit a file | Type/size errors, duplicate warning, confirmation, and safe cancellation |
| Batch Detail | Track counts and pipeline stage | Queued, processing, partial, completed, failed, cancelled, and replayed states |
| Quarantine Queue | Prioritize invalid or ambiguous records | Severity, reason, assignment, aging, filters, and bulk-action safeguards |
| Record Review | Compare original, normalized, corrected, and canonical values | Findings, lineage, reason capture, and unsaved-change protection |
| Lineage View | Explain origin and transformations | Source → batch → record → mapping/rules → canonical target |
| Quality Reports | Explain quality by batch, source, rule, and date | Reconciliation totals, trends, and export authorization |
| Settings | Display limits, retention, rules, and module state | Read-only defaults until separately authorized |

The UX freeze gate requires responsive desktop/tablet/mobile evidence, keyboard navigation, visible focus, color-independent statuses, accessible labels, error recovery, and explicit confirmation for material actions.

## 7. Target architecture

```text
Next.js TDR UI
  └─ tenant-aware TDR API client
       └─ NestJS /v1/tdr module
            ├─ source registry
            ├─ import orchestration
            ├─ parser and normalizer
            ├─ validation and quality rules
            ├─ quarantine and review
            ├─ canonical publication
            ├─ lineage and reconciliation
            └─ audit/observability adapters
                 └─ Prisma/PostgreSQL

Platform dependencies:
tenant context • authentication • RBAC • audit foundation • module registry
```

### 7.1 Repository placement proposal

This placement must be confirmed during architecture approval.

```text
src/
  app/tdr/                         # TDR frontend routes
  components/tdr/                  # TDR-specific components
  features/tdr/                    # state, mock contracts, adapters
  types/tdr.ts                     # frontend-facing contracts

backend/src/tdr/
  tdr.module.ts
  sources/
  imports/
  mappings/
  validation/
  quarantine/
  canonical/
  lineage/
  quality/
  common/

backend/prisma/
  schema.prisma                    # only through approved additive migrations
```

### 7.2 Architectural style

- Start as a modular monolith inside the existing NestJS service.
- Keep TDR domain services independent from transport and Prisma details.
- Use explicit application commands for import, review, replay, and publication.
- Keep transformations pure and versioned where practical.
- Use synchronous processing or a durable database job pattern only if measured file sizes permit it.
- Introduce a queue only after evidence shows the simpler pattern is insufficient.
- Keep analytical reads as PostgreSQL projections for MVP; add an analytical store only after measured need and approval.

### 7.3 Data zones

| Zone | Purpose | Mutability |
|---|---|---|
| Intake | Temporary receipt during validation | Short-lived and controlled |
| Raw evidence | Original content/reference, checksum, metadata, retention | Append-only |
| Working | Parsed and normalized candidate records | Versioned and rebuildable |
| Quarantine | Failed or ambiguous records plus findings | State transitions; evidence preserved |
| Canonical | Approved tenant-scoped trusted records | Controlled versioning; no silent overwrite |
| Serving | API views, aggregates, and quality projections | Rebuildable from canonical state |

For MVP, PostgreSQL content storage versus an external object store remains an explicit decision based on approved file limits, backup behavior, security, and deployment environment.

## 8. Capability modules

### 8.1 Module Control

Registers TDR as optional, controls tenant enablement, hides routes when disabled, and denies API access when unavailable.

### 8.2 Source Registry

Owns source profiles, owners, accepted formats, schema versions, mappings, limits, retention classification, and activation state.

### 8.3 Import Control

Creates batches, checks idempotency, validates envelopes, calculates checksums, records counts, coordinates processing, and exposes status.

### 8.4 Raw Evidence

Preserves original input and immutable metadata. Raw evidence is never edited through the application.

### 8.5 Schema and Mapping

Defines versioned columns, required fields, aliases, canonical targets, default policies, and compatibility rules.

### 8.6 Normalization

Standardizes whitespace, safe casing, identifiers, dates, decimals, currencies, units, and controlled reference values.

### 8.7 Validation and Quality

Runs envelope, structural, field, referential, business, duplicate, reconciliation, and freshness rules with stable codes and severities.

### 8.8 Quarantine and Review

Controls assignment, correction proposals, approval/rejection, reason capture, optimistic concurrency, and replay authorization.

### 8.9 Canonical Publication

Publishes eligible records, assigns stable identifiers, preserves source links, and prevents duplicate or cross-tenant publication.

### 8.10 Lineage and Reconciliation

Links canonical data to source evidence and transformation versions, and proves batch-level input/output accounting.

### 8.11 Quality Intelligence

Calculates completeness, validity, uniqueness, consistency, timeliness, and quarantine trends without changing source or canonical truth.

### 8.12 Operations

Provides health, metrics, safe retry/replay, alerting, retention jobs, support diagnostics, and runbooks.

## 9. Domain model and invariants

### 9.1 MVP aggregate candidates

Final names and fields require a schema decision record.

- `TdrSource`: tenant-owned source profile and lifecycle state.
- `TdrSourceSchemaVersion`: immutable source contract version.
- `TdrMappingVersion`: immutable mapping and normalization configuration.
- `TdrImportBatch`: one received payload and aggregate counts.
- `TdrRawArtifact`: immutable evidence reference, checksum, size, media type, and retention metadata.
- `TdrImportRecord`: one parsed source record and its processing state.
- `TdrValidationFinding`: rule result linked to batch, record, and optional field.
- `TdrCorrection`: proposed value change, reason, actor, and before/after evidence.
- `TdrReviewDecision`: approve, reject, or return decision with authority and reason.
- `TdrCanonicalRecord`: approved tenant-scoped trade entity for the vertical slice.
- `TdrLineageLink`: source-to-working-to-canonical relationship and version references.
- `TdrJobAttempt`: processing attempt, timestamps, outcome, and safe failure metadata.

### 9.2 Mandatory invariants

1. Every TDR business row carries `tenantId`; all reads and writes are tenant-scoped.
2. Tenant identity comes from trusted request context, never arbitrary request data.
3. Raw evidence is immutable after successful receipt.
4. A batch cannot publish before envelope validation succeeds.
5. A record with blocking findings cannot publish.
6. Corrections never replace raw values; they create attributable versions.
7. Mapping and rule versions used by a record cannot change retrospectively.
8. Batch counters reconcile exactly before completion.
9. Replay creates a new attempt and preserves previous attempts.
10. Publish, correction, review, replay, cancellation, and configuration changes emit audit events.
11. Canonical identifiers are stable and unique within their approved tenant/domain boundary.
12. Cross-tenant relationships are forbidden, including indirect references.

### 9.3 Lifecycle states

**Source:** `DRAFT → ACTIVE → PAUSED → RETIRED`

**Batch:** `RECEIVED → VALIDATING → PROCESSING → RECONCILING → COMPLETED`

Alternative batch states: `QUARANTINED`, `PARTIAL`, `FAILED`, `CANCELLED`.

**Record:** `RECEIVED → PARSED → NORMALIZED → VALIDATED → ELIGIBLE → PUBLISHED`

Alternative record states: `QUARANTINED`, `REJECTED`, `SUPERSEDED`.

**Review:** `UNASSIGNED → ASSIGNED → IN_REVIEW → APPROVED | REJECTED | RETURNED`

Every transition is validated in the service layer; clients request transitions but cannot set state directly.

## 10. Data quality framework

### 10.1 Rule classes

| Class | Examples | Default effect |
|---|---|---|
| Envelope | type, size, checksum, empty file, encoding | Reject batch or quarantine |
| Structural | header, column count, required column, row shape | Quarantine record or reject batch |
| Field | type, format, range, precision, allowed value | Quarantine record |
| Referential | vendor, product, currency, unit, country | Quarantine until resolved |
| Business | quantity/value relationships, date order, status compatibility | Quarantine or warning |
| Duplicate | repeated row, source key, conflicting natural key | Suppress exact duplicate or quarantine conflict |
| Reconciliation | input/output counts and control totals | Block completion |
| Freshness | overdue source or data outside expected period | Warning or alert |

### 10.2 Severity model

- `INFO`: explanatory; no publication impact.
- `WARNING`: suspicious but publishable under approved policy.
- `ERROR`: not publishable without correction or approved resolution.
- `FATAL`: batch cannot proceed safely.

### 10.3 Correction policy

- Deterministic formatting normalization may run automatically through an approved versioned rule.
- Ambiguous identity, financial, tax, quantity, currency, compliance, or relationship changes require review.
- Corrections store original, proposed, and final values plus reason, actor, time, and rule/mapping context.
- Bulk correction requires separate permission, preview, impact count, confirmation, and rollback strategy.

## 11. Security and privacy model

TDR backend activation depends on completion and approval of platform authentication and RBAC.

### 11.1 Proposed permissions

- `tdr.view`
- `tdr.source.manage`
- `tdr.import.create`
- `tdr.import.cancel`
- `tdr.quarantine.review`
- `tdr.correction.propose`
- `tdr.correction.approve`
- `tdr.replay.execute`
- `tdr.canonical.publish`
- `tdr.export.execute`
- `tdr.settings.manage`

These names remain candidates until the platform RBAC convention is approved.

### 11.2 Security controls

- Enforce tenant context and permissions on every route and service operation.
- Validate MIME type, extension, size, encoding, row count, and parser limits.
- Protect previews and exports against CSV formula injection.
- Never log raw rows, tokens, secrets, credentials, or sensitive exception contents.
- Sanitize file names and reject path traversal.
- Apply rate and concurrency limits after platform policy approval.
- Store credentials only through the approved secret mechanism.
- Use short-lived access paths if external artifact storage is selected.
- Define retention and deletion authority before real-data ingestion.
- Test cross-tenant access, forged identifiers, replay misuse, and malicious files.

## 12. API contract direction

Proposed REST boundary: `/v1/tdr`.

| Resource | Candidate operations |
|---|---|
| Sources | list, get, create, update, activate, pause, retire |
| Schema versions | list, get, create draft, validate, activate |
| Imports | create, list, get, cancel, replay |
| Records | list by batch, get detail, show lineage |
| Findings | filter, aggregate, get rule detail |
| Quarantine | list, assign, propose correction, approve, reject, return |
| Quality | batch summary, source scorecard, trend summary |
| Exports | request governed export, inspect status, retrieve safely |

Contract rules:

- Use existing ToplineShop response and error standards.
- Use approved pagination for large collections.
- Accept idempotency keys for import and replay commands.
- Use optimistic concurrency for configuration and review writes.
- Never expose storage paths, stack traces, or sensitive raw content in errors.
- Approve an API contract artifact before frontend wiring.

## 13. Workstreams

| Workstream | Purpose | Primary outputs |
|---|---|---|
| Governance and product | Control scope, ownership, decisions, and evidence | charter, registry, WDRs, decision records |
| UX and accessibility | Prove workflows before backend work | mock routes, states, visual evidence, freeze gate |
| Platform prerequisites | Complete tenant/auth/RBAC/module dependencies | approved platform contracts and gates |
| Data architecture | Define source, canonical, quality, and lineage contracts | schemas, mappings, invariants, migration plan |
| Processing | Build deterministic refinement | parser, normalizer, rules, reconciliation, replay |
| Exception operations | Make failures governable | quarantine, review, correction, audit |
| Integration | Connect approved UI, APIs, and downstream consumers | typed client, endpoints, publication adapter |
| Quality engineering | Prove correctness and safety | tests, fixtures, load evidence, security checks |
| Operations | Make TDR supportable | telemetry, alerts, runbooks, backup/restore |

## 14. Dependency-ordered execution roadmap

Effort classes are relative: `XS` one focused task, `S` small, `M` medium, `L` large. Each governed task runs independently and requires PM audit before the next task.

### Stage TDR-0 — Authorization and baseline

**Goal:** establish execution authority and remove dependency ambiguity.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P0-001 | PM audit and approval of this plan | Owner authorization | XS | **PASS — authorized 2026-09-13** |
| TDR-P0-002 | Register TDR module, phase, tasks, branch, risks, and decisions | TDR-P0-001 | S | Registry-driven dashboard reflects truthful state |
| TDR-P0-003 | Source/use-case discovery using synthetic examples | TDR-P0-002 | S | Approved MVP profile and prioritized journeys |
| TDR-P0-004 | Architecture and security decision register | TDR-P0-003 | S | Required decisions resolved or explicitly deferred |

**Hard gate G0:** **PASS for roadmap/governance work.** No backend or schema work before platform Auth/RBAC prerequisites are approved.

### Stage TDR-1 — Frontend workflow proof

**Goal:** satisfy frontend-first policy and freeze the operator experience.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P1-001 | Navigation, overview, and module-disabled states | G0 | S | Responsive browser and accessibility evidence |
| TDR-P1-002 | Sources and source-detail mock workflows | TDR-P1-001 | S | All source lifecycle states represented |
| TDR-P1-003 | Import and batch-detail mock workflows | TDR-P1-002 | M | Validation, progress, failure, cancellation, retry states |
| TDR-P1-004 | Quarantine and record-review mock workflows | TDR-P1-003 | M | Correction and decision safeguards demonstrated |
| TDR-P1-005 | Lineage and quality-reporting mock workflows | TDR-P1-004 | M | Reconciliation and lineage understood by users |
| TDR-P1-006 | TDR frontend freeze audit | TDR-P1-005 | S | Build/lint/browser/accessibility evidence; no backend claims |

**Hard gate G1:** no deep TDR backend implementation until the frontend freeze passes.

### Stage TDR-2 — Platform readiness

**Goal:** prove that platform core can safely host TDR.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P2-001 | Verify authentication and trusted tenant context | Approved ToplineShop Phase 8 work | S | Positive and negative tenant-context evidence |
| TDR-P2-002 | Verify RBAC permission and guard contract | TDR-P2-001 | S | Permission matrix and denial tests |
| TDR-P2-003 | Verify module-registry enablement | TDR-P2-002 | S | Disabled tenant cannot see or call TDR |
| TDR-P2-004 | Verify audit contract and sensitive-data policy | TDR-P2-003 | S | Sanitized events and tests |
| TDR-P2-005 | Platform readiness audit | TDR-P2-004 | XS | Prerequisites PASS or backend remains blocked |

**Hard gate G2:** no TDR migration if tenant context, RBAC, module control, or audit is incomplete.

### Stage TDR-3 — Data contract and persistence foundation

**Goal:** approve a minimal additive model before processing code.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P3-001 | Canonical MVP model and invariants | G1, G2 | M | Approved logical model and transitions |
| TDR-P3-002 | Source schema, mapping, and rule contract | TDR-P3-001 | M | Versioning and compatibility approved |
| TDR-P3-003 | Prisma schema and additive migration plan | TDR-P3-002 | M | Review, rollback, indexes, constraints |
| TDR-P3-004 | Apply migration in controlled environment | TDR-P3-003 | M | Validate/generate/migrate/test evidence |
| TDR-P3-005 | Persistence repositories and isolation tests | TDR-P3-004 | M | Cross-tenant negative tests and transaction behavior |

**Hard gate G3:** schema cannot freeze until constraints enforce invariants and migration recovery is demonstrated.

### Stage TDR-4 — First vertical slice

**Goal:** ingest one synthetic CSV profile end to end.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P4-001 | Source Registry API and service | G3 | M | Contract, validation, authorization, integration tests |
| TDR-P4-002 | Batch receipt, checksum, and idempotency | TDR-P4-001 | M | Duplicate replay creates no unintended records |
| TDR-P4-003 | CSV parser with resource controls | TDR-P4-002 | M | Encoding, malformed row, formula, size, row-limit tests |
| TDR-P4-004 | Deterministic normalization and mapping | TDR-P4-003 | M | Golden fixture tests |
| TDR-P4-005 | Core validation rules and findings | TDR-P4-004 | M | Rule-code and severity test matrix |
| TDR-P4-006 | Canonical publication and lineage | TDR-P4-005 | L | Published records reconcile and trace to source |
| TDR-P4-007 | Vertical-slice audit | TDR-P4-006 | S | End-to-end success and failure evidence |

**Milestone M1:** one tenant, one CSV profile, and one canonical record type operate end to end with synthetic data.

### Stage TDR-5 — Exception management

**Goal:** make invalid and ambiguous data operationally manageable.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P5-001 | Quarantine query and detail APIs | M1 | M | Tenant-safe filtering, pagination, detail tests |
| TDR-P5-002 | Assignment and review lifecycle | TDR-P5-001 | M | Concurrency, permission, audit tests |
| TDR-P5-003 | Correction proposal and approval | TDR-P5-002 | L | Before/after evidence and separation of duties |
| TDR-P5-004 | Safe replay and reconciliation | TDR-P5-003 | L | Prior attempts preserved; counts balance |
| TDR-P5-005 | Wire frozen quarantine UI to APIs | TDR-P5-004 | M | Browser E2E for review and recovery |
| TDR-P5-006 | Exception-management audit | TDR-P5-005 | S | Security, audit, usability, reconciliation PASS |

**Milestone M2:** authorized operators resolve and replay exceptions without database intervention.

### Stage TDR-6 — Quality intelligence and integration

**Goal:** make quality measurable and expose trusted outputs safely.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P6-001 | Batch and source quality projections | M2 | M | Metrics reconcile to findings |
| TDR-P6-002 | Wire overview, lineage, and quality UI | TDR-P6-001 | M | Browser E2E and accessible visualization evidence |
| TDR-P6-003 | Governed export contract | TDR-P6-002 | M | Authorization, injection, size, audit tests |
| TDR-P6-004 | Optional downstream publication contract | TDR-P6-003 | M | Ownership and failure-isolation tests |
| TDR-P6-005 | Quality and integration audit | TDR-P6-004 | S | No marketplace regression; totals and lineage PASS |

**Milestone M3:** users measure quality and consume approved canonical data through governed interfaces.

### Stage TDR-7 — Hardening and production readiness

**Goal:** prove supportability, security, recovery, and bounded scale.

| Task | Scope | Depends on | Effort | Exit evidence |
|---|---|---|---|---|
| TDR-P7-001 | Representative load and failure-mode tests | M3 | M | Throughput, latency, memory, and failure baseline |
| TDR-P7-002 | Observability, alerts, dashboards | TDR-P7-001 | M | Actionable alerts and correlation tracing |
| TDR-P7-003 | Retention, backup, restore, recovery | TDR-P7-002 | M | Restore drill and recovery evidence |
| TDR-P7-004 | Security and privacy review | TDR-P7-003 | M | Threat model; critical/high findings closed |
| TDR-P7-005 | Runbooks, support, release/rollback | TDR-P7-004 | S | Named ownership and tested procedures |
| TDR-P7-006 | Production readiness review | TDR-P7-005 | S | Cross-functional approval |

**Milestone M4:** TDR MVP is approved for controlled production use.

### Stage TDR-8 — Controlled expansion

Each source or domain follows: profile → contract → mapping → fixtures → quality baseline → UX impact → security review → rollout → scorecard. No source is added through an unrestricted generic parser.

## 15. Milestone dependency map

```text
Current Phase 8 PM audit
          |
          v
TDR G0 authorization
          |
          +-------------------+
          |                   |
          v                   v
 G1 frontend freeze     G2 platform readiness
          |                   |
          +---------+---------+
                    v
             G3 data foundation
                    |
                    v
          M1 first vertical slice
                    |
                    v
          M2 exception operations
                    |
                    v
          M3 quality + integration
                    |
                    v
          M4 production readiness
                    |
                    v
          controlled source expansion
```

## 16. Branch, pull request, and release strategy

### 16.1 Branch roles

- `master`: stable and releasable; never used for direct TDR development.
- `codex/trade-data-refinery`: TDR integration and release-candidate assembly branch.
- `feature/tdr-<task-id>-<slug>`: one governed implementation task.
- `fix/tdr-<task-id>-<slug>`: bounded defect correction.
- `audit/tdr-<task-id>-<slug>`: only if governance requires a separate audit branch.

### 16.2 Rules

1. Create each task branch from the verified TDR integration branch.
2. Use one task and one approved scope per branch.
3. Reconcile with integration before review; never force-push shared branches.
4. Stage exact files only.
5. Every PR links its task, WDR, acceptance criteria, evidence, migration impact, and rollback note.
6. Merge to TDR integration only after verification and PM audit requirements pass.
7. Promote to `master` only through an approved release PR after M4.
8. Remove task branches only after merge and evidence capture.
9. Record real commit hashes in WDR and project registry.

### 16.3 Required pull-request checks

- Frontend build and lint.
- Backend build and tests when backend scope changes.
- Prisma validation and migration checks when schema scope changes.
- Focused unit, integration, and E2E tests.
- `git diff --check`.
- Scope and secret review.
- WDR and registry consistency review.

## 17. Verification strategy

### 17.1 Test layers

- **Unit:** parsing, normalization, rules, transitions, counters, permissions.
- **Golden fixtures:** fixed input with exact normalized output and findings.
- **Property tests:** idempotency, determinism, boundaries, parser resilience where practical.
- **Repository integration:** Prisma constraints, transactions, tenant filtering, concurrency, job attempts.
- **API contract:** validation, shapes, errors, pagination, idempotency, authorization.
- **Security:** cross-tenant access, escalation, malicious files, traversal, CSV injection, sensitive logs, replay abuse.
- **Frontend component:** states, safeguards, keyboard access, error recovery.
- **End to end:** import → process → quarantine/review → publish → lineage → quality.
- **Performance:** representative files, concurrent imports, large queues, reports.
- **Recovery:** interruption, retry, replay, rollback, backup, restore.
- **Regression:** marketplace, admin, owner, vendors, categories, products, audit, health.

### 17.2 Evidence packet per task

Each WDR records:

- Approved scope and exclusions.
- Files changed and why.
- Commands and actual outcomes.
- Browser evidence for UI changes.
- Test counts and failures, including unrelated pre-existing failures.
- Database and migration impact.
- Security and tenant-isolation impact.
- Commit hash and PR reference.
- Limitations, residual risks, rollback, and next-task recommendation.

## 18. Operational model

### 18.1 Observability

Required identifiers: `requestId`, `correlationId`, `tenantId`, `sourceId`, `batchId`, `recordId` where applicable, and `attemptId`. Logs contain identifiers and safe summaries, not raw data.

Required metrics:

- batches received, completed, partial, failed, and cancelled;
- records received, accepted, quarantined, rejected, and published;
- processing latency and wait time;
- rule failures by code and severity;
- duplicate and replay rates;
- source freshness and schema drift;
- review queue age and resolution time;
- API errors, denials, and concurrency conflicts.

### 18.2 Alert candidates

- Reconciliation mismatch.
- Repeated fatal source failures.
- Batch stuck beyond its approved window.
- Unexpected quarantine-rate increase.
- Source freshness breach.
- Cross-tenant authorization anomaly.
- Storage or database capacity threshold.
- Backup or retention job failure.

### 18.3 Runbooks

- Failed batch diagnosis.
- Safe retry versus replay.
- Reconciliation mismatch response.
- Malicious or malformed file response.
- Source schema drift response.
- Incorrect correction or publication response.
- Tenant access incident response.
- Backup restore and service rollback.

## 19. Governance and responsibility model

| Activity | Accountable | Responsible | Consulted |
|---|---|---|---|
| Scope and priority | Product/PM owner | TDR product lead | Operations, data owners |
| Canonical semantics | Data owner | TDR data lead | Domain SMEs, engineering |
| Architecture | Technical owner | Lead engineer | Security, operations, data lead |
| Security and retention | Security/data owner | Security lead | Legal/compliance, engineering |
| UX freeze | Product owner | Frontend lead | Operators, accessibility reviewer |
| Rule approval | Data owner | Data-quality steward | Source owner, operations |
| Release approval | PM/Owner | Engineering lead | Security, QA, operations, data owner |
| Production operation | Operations owner | Support/on-call team | Engineering, data steward |

Named individuals must replace these role placeholders before M1.

## 20. Mandatory decisions before implementation

These decisions may not be silently assumed.

| ID | Decision | Required by | Recommended starting position |
|---|---|---|---|
| ADR-TDR-001 | MVP user and first use case | TDR-P0-003 | Operations reviewer processing supplier/product trade rows |
| ADR-TDR-002 | First source format and exact schema | TDR-P0-003 | Synthetic UTF-8 CSV with fixed headers |
| ADR-TDR-003 | Canonical MVP record type | TDR-P3-001 | Product-linked trade line, not a full document suite |
| ADR-TDR-004 | Raw artifact storage | TDR-P3-003 | Decide from file limits and deployment constraints |
| ADR-TDR-005 | Synchronous vs durable job processing | TDR-P4-002 | Start with the simplest measured safe option |
| ADR-TDR-006 | Duplicate identity and conflict policy | TDR-P3-002 | Suppress exact duplicate; quarantine conflict |
| ADR-TDR-007 | Automatic normalization boundaries | TDR-P3-002 | Deterministic non-material formatting only |
| ADR-TDR-008 | Review separation of duties | TDR-P5-002 | Material corrections require a distinct approver where feasible |
| ADR-TDR-009 | Retention and deletion | Before real data | No real data until approved |
| ADR-TDR-010 | Marketplace/ERP integration | TDR-P6-004 | Contract-only and disabled by default |
| ADR-TDR-011 | Performance and file limits | TDR-P4-003/P7-001 | Set from benchmark evidence |
| ADR-TDR-012 | Deployment and recovery objectives | TDR-P7-003 | Align with platform operations policy |

## 21. Risk register

| Risk | Severity | Early indicator | Control | Owner |
|---|---|---|---|---|
| TDR starts before platform security | Critical | Backend work proposed before G2 | Hard dependency and PM stop | PM/Technical owner |
| Cross-tenant data leakage | Critical | Query/service lacks trusted tenant scope | Service scoping, constraints, negative tests | Security/Backend |
| Silent corruption | Critical | Totals or lineage do not reconcile | Immutable evidence, versioning, reconciliation | Data lead |
| Overbuilt infrastructure | High | Queue/warehouse proposed without evidence | Modular monolith and ADR approval | Architecture owner |
| Unbounded processing | High | Memory spikes or long requests | Limits and load tests | Backend lead |
| Duplicate publication | High | Replay changes canonical counts | Keys, checksums, unique constraints | Backend/Data |
| Unsafe correction | High | Raw value overwritten or actor missing | Versioned corrections and audit | Data steward |
| Sensitive-data leakage | High | Raw rows in logs/errors | Sanitization tests and logging policy | Security |
| Governance drift | High | Registry, WDR, docs, Git disagree | Registry-first updates and PM audit | PM |
| Marketplace regression | Medium | Shared behavior breaks | Isolation and regression suite | Engineering |
| Schema drift | Medium | New or missing columns | Version detection and source pause | Source owner |
| Review backlog | Medium | Aging quarantine queue | Prioritization, scorecards, ownership | Operations |
| Analytics mistrust | Medium | Dashboard totals differ | Rebuildable projections and reconciliation | Data/QA |

## 22. Definition of ready

A TDR task is ready only when:

1. It is PM-approved and registered in `src/project/projectRegistry.ts`.
2. Dependencies and the previous PM audit are complete.
3. Scope, exclusions, exact files, acceptance criteria, and stop conditions are explicit.
4. Required architecture decisions are approved.
5. Test data is synthetic and contains no secrets or customer data.
6. Migration impact and rollback are known if database work is involved.
7. The task fits one governed execution unit.

## 23. Definition of done

A TDR task is done only when:

1. Approved scope is implemented without unrelated changes.
2. Acceptance criteria are demonstrated with evidence.
3. Applicable builds, lint, tests, visual checks, migrations, and security checks pass.
4. Tenant isolation and sensitive-data handling are explicitly verified.
5. Documentation remains within the project documentation budget.
6. The WDR records actual evidence and real commit hashes.
7. The project registry truthfully reflects status.
8. PM audit closes the task or records one bounded corrective task.

## 24. MVP release acceptance criteria

### Product and UX

- Users can understand batch health, findings, corrections, publication, lineage, and quality without database access.
- All required UI states are responsive and accessible.
- Destructive or material actions require confirmation and reason capture.

### Functional correctness

- The approved CSV profile completes end to end.
- Input/output counts reconcile exactly.
- Blocking findings prevent publication.
- Corrections and approvals preserve original evidence.
- Replay is idempotent and prior attempts remain visible.
- Canonical records and quality projections are reproducible.

### Data governance

- All published records have complete lineage.
- Source, schema, mapping, rule, and canonical versions are identifiable.
- Retention, deletion, export, and correction authority are approved.

### Security

- Every route and service action enforces tenant/module/permission controls.
- Cross-tenant and privilege-escalation tests pass.
- File abuse and CSV injection controls pass.
- No secrets or raw sensitive values appear in logs or errors.
- No critical or high release-blocking security finding remains open.

### Reliability and operations

- Representative load tests establish approved limits.
- Failed or stuck jobs are detectable and recoverable.
- Backup and restore are demonstrated for persisted TDR data.
- Alerts and runbooks are tested by the operating owner.
- Release and rollback procedures are approved.

### Regression and governance

- Existing marketplace, admin, owner, tenant, vendor, category, product, audit, and health behavior remains stable.
- Frontend and backend quality checks pass.
- WDRs, registry, branch state, commits, and release evidence reconcile.
- Product, PM, engineering, data, security, QA, and operations approvals are recorded.

## 25. Immediate execution sequence

The next action is governance, not implementation.

1. `TDR-P0-001` is owner-authorized and recorded as PASS on 2026-09-13.
2. Use the prepared bounded Claude Code prompt for `TDR-P0-002` only.
3. Register TDR truthfully in `src/project/projectRegistry.ts`; do not claim product implementation.
4. Complete source/use-case discovery with synthetic examples.
5. Resolve decisions needed for frontend proof.
6. Execute frontend tasks one at a time through the freeze gate.
7. Wait for the ToplineShop Phase 8 Auth/RBAC prerequisite to pass.
8. Begin schema/backend work only after G1 and G2 pass.

## 26. Next governed task specification

### TDR-P0-002 — Program Registration and Control Baseline

**Objective:** register the owner-approved Trade Data Refinery roadmap, module, branch, task sequence, risks, and next action in the canonical ToplineShop project controls without implementing product behavior.

**Allowed scope:** `src/project/projectRegistry.ts`, TDR roadmap/control documentation, TDR WDR, latest status summaries, and PM outbox prompt required for truthful governance registration.

**Forbidden scope:** no frontend product UI, backend behavior, packages, Prisma schema, migration, database operation, authentication, RBAC, source ingestion, external connector, deployment, `master` modification, or interaction with `shop.com`.

**Required outputs:**

- TDR is represented in the canonical registry without falsely changing ToplineShop Phase 8 status.
- `TDR-P0-001` is recorded as owner-authorized PASS.
- `TDR-P0-002` is the only active execution task.
- The next planned task is `TDR-P0-003`, but it remains unexecuted and subject to PM/CTO audit.
- Build, lint, diff, Git state, scope, and registry consistency are verified.
- A WDR records actual evidence and any blocker.

**Stop conditions:** any need to replace the current ToplineShop phase, weaken Phase 8 blocks, implement product behavior, make a destructive change, handle secrets, expand scope, or interact with `shop.com`.

---

## 27. Final strategic position

Trade Data Refinery should advance as a controlled ToplineShop module, not an independent data-platform program. The execution order is:

1. authorize and register;
2. prove the operator experience with mock data;
3. complete platform security prerequisites;
4. lock tenant-safe data contracts;
5. deliver one narrow vertical slice;
6. operationalize exception handling;
7. expose governed quality and outputs;
8. prove security, recovery, scale, and supportability;
9. expand one approved source at a time.

This sequence provides a practical path to begin work while protecting ToplineShop architecture, governance, marketplace behavior, tenant boundaries, and production safety.
