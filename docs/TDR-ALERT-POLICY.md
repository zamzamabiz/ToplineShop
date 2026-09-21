# TDR Alert Policy

Trade Data Refinery-Bushra — Alert Matrix v1.0  
Date: 2026-09-22

---

## Severity Definitions

| Severity | Response SLA | Description |
|----------|-------------|-------------|
| P0 | Immediate (on-call page) | Data loss, auth bypass, service down |
| P1 | 15 minutes (on-call page) | Degraded processing, export failures, DB unreachable |
| P2 | 2 hours (business hours) | Elevated error rates, cleanup lag, performance degradation |

---

## P0 Alerts — Critical / Data Loss Risk

| Alert | Metric | Condition | Action |
|-------|--------|-----------|--------|
| DB Connection Lost | `tdr_db_readiness_total{result="fail"}` | rate > 0 for 2 min | Restart service; check DATABASE_URL; check PG server |
| Auth Endpoint Down | HTTP 5xx on `/auth/*` | rate > 5/min for 1 min | Check JWT config; check auth module; restart |
| Storage Write Failure | `tdr_storage_ops_total{op="put",result="failure"}` | rate > 0 for 1 min | Check S3/local mount; check disk space; check IAM |
| Job Queue Stuck (ingestion) | `tdr_job_events_total{job_type="processing",label="leased"}` | = 0 for 30 min with pending > 0 | Check worker thread; restart backend |
| Export Download 500 | HTTP 5xx on `GET /tdr/exports/*/download` | any occurrence | Check export storage; check job status |

---

## P1 Alerts — Degraded Service

| Alert | Metric | Condition | Action |
|-------|--------|-----------|--------|
| High Job Failure Rate | `tdr_job_events_total{label="failed"}` | rate > 3/min for 5 min | Check error logs; check mapping profiles; check DB |
| Export Cleanup Failure | `tdr_export_cleanup_total{result="failure"}` | any increment | Check storage adapter; check file permissions |
| DB Readiness Failing | `tdr_db_readiness_total{result="fail"}` | rate > 0 for 5 min | Check PG connection pool; check DATABASE_URL |
| Lease Reclaim Spike | `tdr_job_events_total{label="lease_reclaim"}` | rate > 5/min | Worker stall; check heartbeat; check max-attempts config |
| Temp Cleanup Errors | `tdr_temp_cleanup_runs_total` + errors > 0 | 3 consecutive runs with errors | Check tmpdir permissions; check disk space |

---

## P2 Alerts — Monitoring / Performance

| Alert | Metric | Condition | Action |
|-------|--------|-----------|--------|
| Elevated 4xx Rate | `tdr_http_requests_total{status_class="4xx"}` | rate > 20/min for 10 min | Check client behavior; check auth expiry; check rate limits |
| HTTP P99 Latency | `tdr_http_duration_p99_ms` | > 2000ms for 10 min | Check DB query plans; check N+1 queries; check storage I/O |
| Export Cleanup Lag | Time since last `tdr_export_cleanup_total` increment | > 2 hours | Cleanup timer may have stalled; restart backend |
| Storage Delete Failure | `tdr_storage_ops_total{op="delete",result="failure"}` | > 3 in 1 hour | Check storage permissions; check orphaned files |
| Quality Job Backlog | Quality PENDING count | > 100 for 30 min | Scale workers; check lease duration; check error rate |

---

## No-Alert Conditions (expected behavior)

- Single `tdr_export_cleanup_total{result="failure"}` during deployment restart — normal
- `tdr_job_events_total{label="lease_reclaim"}` = 0 — healthy (no stale leases)
- `tdr_http_requests_total{status_class="4xx"}` baseline from validation errors — expected

---

## Metrics Endpoint

`GET /metrics` — Prometheus text format, no-cache.  
**PRODUCTION NOTE:** Protect at network/proxy layer. Not publicly reachable.  
No credentials, PII, or trade data are present in this endpoint.
