# #TLS Data Refinery: Strategic Charter and Sol Review Brief

Status: proposed for owner approval. Authorizes planning only.

## 1. Assignment to Sol

Critically review this charter. Produce the approved strategy, identify unresolved decisions, and prepare bounded execution mega-prompts. Preserve #FDD, #123, TLS compatibility, rapid delivery, and strict token discipline. Treat prior model recommendations and data findings as inputs requiring validation, not established architecture or approval.

## 2. Vision, Mission, and Customers

Vision: make international trade records useful, trustworthy, and accessible to businesses worldwide.

Mission: convert heterogeneous trade data into traceable market intelligence and actionable commercial opportunities.

Initial customers are the owner's businesses and invited trade analysts. Later customers include exporters, importers, distributors, manufacturers, sourcing teams, and trade advisers. Measure success through reliable publication, useful buyer discovery, repeat analyst use, and accepted CRM opportunities.

## 3. Product and Deployment Boundaries

Data Refinery is a TLS module with a future independently deployable SaaS configuration. Maintain one codebase and business model, with explicit interfaces for identity, tenancy, billing, storage, and CRM. TLS supplies these services when integrated; standalone deployment supplies approved equivalents. Do not fork the product or build both configurations immediately. Independent deployment must eventually pass its own integration tests.

Reuse the approved TLS frontend stack, design system, and conventions. Obtain a current architecture handoff from the main governance team before implementation. Historical discussion does not establish current phase approval.

## 4. Mandatory #FDD and #123

Apply DISCUSS -> DECIDE -> EXECUTE -> VERIFY/AUDIT -> CLOSE -> NEXT to every bounded work package.

Enforce DESIGN -> VISUAL PROOF -> OWNER APPROVAL -> FRONTEND FREEZE -> BACKEND -> INTEGRATION -> VERIFICATION. Freeze the complete agreed release workflow, not every future feature. Changes after freeze require an impact note and updated acceptance evidence.

Visually prove navigation, source registration, upload/mapping, progress/retry, quality review, search/filter/pagination, record details, company/HS/country/port views, charts/drill-down, saved searches, export, alerts, and CRM handoff. Explicitly label later-release demonstrations. Include responsive layouts and loading, empty, denied-access, and error states. Never load millions of rows into the browser.

Before freeze, permit only bounded feasibility experiments with stated questions, datasets, resource limits, and results. They must not establish a production backend or permanent schema. Mock screens prove frontend behavior only. Include the FDD gate and evidence in every phase, prompt, contract, WDR, and audit.

## 5. Scope and Priorities

First release: one complete workflow from January CSV upload through mapping, quality review, publication, paginated search, record lineage, and five dashboards: monthly activity, HS analysis, buyers/sellers, destinations, and comparable quantities/values. Include basic saved searches and controlled export.

Next: all 36 files, source mapping templates, reviewed company aliases, and evidence-based opportunity shortlists. Then CRM integration, alerts, subscriptions, and standalone deployment.

Defer native mobile apps, forecasting, contact enrichment, unrestricted dashboard builders, automated outreach, and broad global source coverage. Keep browser layouts responsive for later mobile use.

## 6. Evidence and Data Corrections

The owner reports 36 files covering 18 months, normally 200,000-400,000 records each, with continuing additions and a future 50-100 million record target.

The earlier January profile reports 177,076 rows and 17 columns. Exporter/importer counts represent distinct names, not verified companies. The 3,747 repeated rows are duplicate candidates; identical trade lines may be legitimate. The prior application's crash cause remains unknown without diagnostics.

Revalidate HS classifications before publishing chapter statistics: preserve codes as text, leading zeros, country-specific extensions, and classification edition. The previous 83-chapter count is unverified because codes such as `701.9` may have lost leading zeros. Support source-country schedules and special/reserved chapter handling.

Investigate currency code 998, ambiguous dates, unusual prices, and units before conversion. Apparent encoding damage may originate in reading or display; preserve original bytes. Quantity multiplied by unit price is a candidate calculated value until valuation meaning is confirmed. Label rankings and trends as applying to the available dataset, not the entire world market.

## 7. Data Model and Refinery Contract

Separate source files, processing runs, source rows, canonical trade lines, optional shipment groups, parties/aliases, reference mappings, and published dataset versions. Generate stable record IDs; preserve file ID, original row number, provider identifiers, rule version, and lineage. A hash detects content repetition but does not establish shipment identity.

Keep raw originals and versioned normalized fields. Store unfamiliar columns as source extensions until mapped. Represent multiple containers and parties as related records when required. Scope bill-of-lading references by source and relevant context; do not assume global uniqueness.

Support changing source columns, date formats, currencies, decimal separators, units, languages, and HS revisions through versioned mappings. Never sum incompatible units or mixed currencies. Preserve original values and normalization provenance.

Pipeline: register -> upload -> fingerprint -> map -> validate -> normalize -> review -> reconcile -> publish. Checkpoint background jobs, make retries idempotent, quarantine exceptions, and publish complete versions atomically. Reconcile every input row to an outcome. Retain amendment and rollback history.

## 8. Technology Decision

Candidate architecture: existing TLS application stack; transactional metadata store compatible with TLS, with PostgreSQL a candidate; ClickHouse for analytical serving; Parquet and object storage for datasets; bounded background workers; DuckDB for profiling and feasibility work.

Sol must validate this shortlist against the approved TLS stack, maintained releases, commercial license suitability, deployment effort, and measured workload before selecting versions. Object-storage implementation remains open. Use one analytical serving engine initially; avoid adding multiple BI/search systems without a demonstrated need. Keep required production workflows independent of paid AI APIs; development-agent subscriptions are separate expenses.

Prefer commercially suitable open-source dependencies and portable deployment. Hosting, domain, storage, and optional external service costs must be budgeted explicitly. Windows development and Linux hosting are candidates to confirm with the team.

## 9. Tenancy, Global Use, and CRM

Enforce tenancy and dataset entitlements from the first real backend. Distinguish platform-licensed shared data from private tenant uploads. Apply authorization to queries, caches, exports, files, background jobs, and CRM handoffs. Platform support access must be explicit and audited.

Support Unicode, configurable display formats, explicit date interpretation, currency/unit metadata, and documented geographic/data coverage. Phase additional languages according to demand.

CRM receives reviewed company identity, opportunity reason, source evidence, freshness, and optional explainable score. Use a versioned, retry-safe interface with duplicate prevention. CRM unavailability must not block refinery operation.

## 10. Performance and Operations

Design toward 100 million records; claim only tested capacity. Use bounded-memory processing, bulk ingestion, server-side queries, cursor pagination, asynchronous exports, and query/resource limits. Choose partitions and sort order through benchmarks; avoid automatically partitioning by every tenant or company.

Provisional pilot targets: filtered pages within two seconds and standard dashboards within five seconds at the 95th percentile with ten concurrent analyst sessions on declared hardware. Sol must validate these targets and set upload throughput, memory, recovery, and storage budgets.

Test representative distributions at 1M and 10M early after backend authorization; test 50M/100M before offering those capacities. Synthetic data must include realistic diversity and skew. Record warm/cold queries, failures, concurrency, hardware, and cost. Verify backups by restoring them.

## 11. Roadmap and Mega-Prompt Packages

| Package | Scope | Exit evidence |
| --- | --- | --- |
| MP-00 | Charter, release scope, data dictionary, contracts, risks, owner decisions | Approved boundaries |
| MP-01 | Complete release frontend with realistic fixtures | Visual evidence for agreed workflows |
| MP-02 | Frontend audit, bounded feasibility findings, freeze | Owner approval recorded; architectural blockers closed |
| MP-03 | Secure single-source backend and January integration | Reconciliation, retry safety, lineage, authorization tests, usable dashboards |
| MP-04 | Multi-file processing and internal pilot | Files accounted for, mapping exceptions reviewed, 10M benchmark and restore evidence |
| MP-05 | Controlled customer SaaS and CRM integration | Entitlements, export limits, tenant-isolation evidence, repeat-safe handoff |
| MP-06 | Higher capacity and standalone deployment | Measured 50M/100M capacity and independently tested deployment |

These are planning packages, not guaranteed prompt counts. Split into bounded execution tasks where needed. Estimate delivery ranges after MP-02 using team capacity and feasibility results. The urgent milestone is the internal pilot.

## 12. Team Contract and Governance

The owner approves business scope, release gates, and material trade-offs. Sol prepares strategy and routine reviews; Luna prepares bounded prompts and summaries; implementers deliver code and evidence; a separate reviewer checks high-risk changes. AI role names do not confer independent business authority.

The Trade team owns its approved module surface and worker components. Shared authentication, TLS governance, other modules, and global design changes require designated approval. Propose `/data-refinery` and child routes for central confirmation.

Use isolated branches, small reviewed changes, and frequent integration. Parallelize only work with stable contracts and separate ownership. Record approved status through the canonical TLS registry; standalone reporting should use an adapter. Use established WDR conventions after main-thread confirmation.

## 13. Strict Token-Saving and Daily Direction

Maintain one compact context pack: charter version, contracts, current task, approved scope, decisions, blockers, evidence references, and next action. Target approximately 1,500 tokens for routine handoffs; expand when correctness requires it.

Every mega-prompt contains objective, dependencies, allowed files, exclusions, acceptance tests, stop conditions, and required WDR output. Read referenced changes and relevant evidence. Summarize logs and datasets; never paste millions of records. Reuse decisions and templates; report deltas instead of regenerating the strategy.

Use deterministic parsers and reference mappings for bulk data. Apply AI selectively to unresolved cases with provenance and review. Token savings must not remove relevant code inspection, verification, or contradictory evidence.

Daily: review the compact WDR, choose the next unblocked task, execute, verify, record evidence, and prepare the next handoff. Escalate blocked tasks after two evidence-based attempts. Conduct milestone reviews instead of repeatedly re-auditing unchanged work.

## 14. Approval and Definition of Done

Owner decisions: first users, pilot scope, source usage rights, unresolved field meanings, hardware/hosting budget, and standalone commercialization timing. Carry unknowns explicitly; they must not silently become defaults.

An internal pilot is done when authorized users can publish, search, analyze, and trace the agreed dataset; retries do not double-count; access controls work; failures are recoverable; and measured performance meets approved limits. Commercial readiness additionally requires customer entitlements, operating ownership, support procedures, and release evidence.

Sol's next output: critical corrections, finalized charter, decision register, realistic delivery range, and executable MP-00 followed by proposed MP-01. Begin frontend implementation only after applicable approval. Preserve backend work behind the #FDD freeze gate.
