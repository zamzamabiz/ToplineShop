/**
 * TDR-POST-MVP-OPERATIONS-OBSERVABILITY-001
 * §28 backend tests: metrics, correlation ID, request logger, instrumentation
 */

import { MetricsService } from './common/metrics/metrics.service';
import { CorrelationIdMiddleware, REQUEST_ID_HEADER } from './common/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

// ── MetricsService unit tests ─────────────────────────────────────────────────

describe('MetricsService', () => {
  let svc: MetricsService;

  beforeEach(() => {
    svc = new MetricsService();
  });

  // M.1 — initial snapshot has all zeroes
  it('M.1 initial snapshot is all zero', () => {
    const snap = svc.getSnapshot();
    expect(snap.dbReadinessOk).toBe(0);
    expect(snap.dbReadinessFail).toBe(0);
    expect(snap.tempCleanupRuns).toBe(0);
    expect(snap.exportCleanupSuccess).toBe(0);
    expect(snap.exportCleanupFailure).toBe(0);
    expect(snap.httpSampleCount).toBe(0);
  });

  // M.2 — recordHttpRequest accumulates
  it('M.2 recordHttpRequest increments httpRequests counter', () => {
    svc.recordHttpRequest('GET', '2xx', 10);
    svc.recordHttpRequest('GET', '2xx', 20);
    svc.recordHttpRequest('POST', '4xx', 5);
    const snap = svc.getSnapshot();
    expect(snap.httpRequests['GET:2xx']).toBe(2);
    expect(snap.httpRequests['POST:4xx']).toBe(1);
  });

  // M.3 — recordJobEvent accumulates
  it('M.3 recordJobEvent increments job counters', () => {
    svc.recordJobEvent('ingestion' as never, 'leased');
    svc.recordJobEvent('quality', 'completed');
    svc.recordJobEvent('export', 'failed');
    const snap = svc.getSnapshot();
    expect((snap.jobEvents as Record<string, number>)['ingestion:leased']).toBe(1);
    expect((snap.jobEvents as Record<string, number>)['quality:completed']).toBe(1);
    expect((snap.jobEvents as Record<string, number>)['export:failed']).toBe(1);
  });

  // M.4 — recordStorageOp accumulates
  it('M.4 recordStorageOp tracks op and result', () => {
    svc.recordStorageOp('put', 'success');
    svc.recordStorageOp('put', 'failure');
    const snap = svc.getSnapshot();
    expect((snap.storageOps as Record<string, number>)['put:success']).toBe(1);
    expect((snap.storageOps as Record<string, number>)['put:failure']).toBe(1);
  });

  // M.5 — recordLifecycleOp accumulates
  it('M.5 recordLifecycleOp tracks archive/restore/source_download', () => {
    svc.recordLifecycleOp('archive');
    svc.recordLifecycleOp('restore');
    svc.recordLifecycleOp('source_download');
    const snap = svc.getSnapshot();
    expect((snap.lifecycleOps as Record<string, number>)['archive']).toBe(1);
    expect((snap.lifecycleOps as Record<string, number>)['restore']).toBe(1);
    expect((snap.lifecycleOps as Record<string, number>)['source_download']).toBe(1);
  });

  // M.6 — recordExportCleanup success path
  it('M.6 recordExportCleanup success increments success and binaries', () => {
    svc.recordExportCleanup('success', 3);
    const snap = svc.getSnapshot();
    expect(snap.exportCleanupSuccess).toBe(1);
    expect(snap.exportCleanupBinariesDeleted).toBe(3);
    expect(snap.exportCleanupFailure).toBe(0);
  });

  // M.7 — recordExportCleanup failure path
  it('M.7 recordExportCleanup failure increments failure only', () => {
    svc.recordExportCleanup('failure');
    const snap = svc.getSnapshot();
    expect(snap.exportCleanupFailure).toBe(1);
    expect(snap.exportCleanupSuccess).toBe(0);
  });

  // M.8 — recordTempCleanup
  it('M.8 recordTempCleanup accumulates runs/removed/errors', () => {
    svc.recordTempCleanup(5, 0);
    svc.recordTempCleanup(2, 1);
    const snap = svc.getSnapshot();
    expect(snap.tempCleanupRuns).toBe(2);
    expect(snap.tempCleanupRemoved).toBe(7);
    expect(snap.tempCleanupErrors).toBe(1);
  });

  // M.9 — recordDbReadiness
  it('M.9 recordDbReadiness accumulates ok and fail separately', () => {
    svc.recordDbReadiness(true);
    svc.recordDbReadiness(true);
    svc.recordDbReadiness(false);
    const snap = svc.getSnapshot();
    expect(snap.dbReadinessOk).toBe(2);
    expect(snap.dbReadinessFail).toBe(1);
  });

  // M.10 — toPrometheus emits valid Prometheus text
  it('M.10 toPrometheus produces valid text format with HELP and TYPE lines', () => {
    svc.recordHttpRequest('GET', '2xx', 15);
    svc.recordJobEvent('quality', 'completed');
    svc.recordLifecycleOp('archive');
    svc.recordExportCleanup('success', 1);
    svc.recordTempCleanup(1, 0);
    svc.recordDbReadiness(true);

    const text = svc.toPrometheus();
    expect(text).toContain('# HELP tdr_http_requests_total');
    expect(text).toContain('# TYPE tdr_http_requests_total counter');
    expect(text).toContain('method="GET"');
    expect(text).toContain('# HELP tdr_job_events_total');
    expect(text).toContain('job_type="quality"');
    expect(text).toContain('# HELP tdr_lifecycle_ops_total');
    expect(text).toContain('op="archive"');
    expect(text).toContain('# HELP tdr_db_readiness_total');
    expect(text.endsWith('\n')).toBe(true);
  });

  // M.11 — toPrometheus does not contain secrets
  it('M.11 toPrometheus output contains no credential-like strings', () => {
    const text = svc.toPrometheus();
    // No Authorization, Cookie, password, secret, token patterns
    expect(text.toLowerCase()).not.toContain('authorization');
    expect(text.toLowerCase()).not.toContain('cookie');
    expect(text.toLowerCase()).not.toContain('password');
    expect(text.toLowerCase()).not.toContain('secret');
    expect(text.toLowerCase()).not.toContain('database_url');
  });

  // M.12 — http duration sample cap at 1000
  it('M.12 httpDurationBuckets capped at 1000 samples', () => {
    for (let i = 0; i < 1100; i++) {
      svc.recordHttpRequest('GET', '2xx', i);
    }
    const snap = svc.getSnapshot();
    expect(snap.httpSampleCount).toBeLessThanOrEqual(1000);
  });
});

// ── CorrelationIdMiddleware unit tests ────────────────────────────────────────

describe('CorrelationIdMiddleware', () => {
  let mw: CorrelationIdMiddleware;
  let next: jest.Mock;

  const makeReq = (headerValue?: string | string[]) => ({
    headers: headerValue !== undefined ? { [REQUEST_ID_HEADER]: headerValue } : {},
  });

  const makeRes = () => {
    const headers: Record<string, string> = {};
    return {
      setHeader: jest.fn((k: string, v: string) => { headers[k] = v; }),
      _headers: headers,
    };
  };

  beforeEach(() => {
    mw = new CorrelationIdMiddleware();
    next = jest.fn();
  });

  // CI.1 — generates UUID when no header
  it('CI.1 generates UUID when X-Request-ID is absent', () => {
    const req = makeReq() as never;
    const res = makeRes() as never;
    mw.use(req, res, next);
    const id = (req as never as { requestId: string }).requestId;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(next).toHaveBeenCalled();
  });

  // CI.2 — uses valid inbound ID
  it('CI.2 uses valid inbound X-Request-ID', () => {
    const req = makeReq('my-correlation-id-123') as never;
    const res = makeRes() as never;
    mw.use(req, res, next);
    expect((req as never as { requestId: string }).requestId).toBe('my-correlation-id-123');
  });

  // CI.3 — rejects header with newline (injection attempt)
  it('CI.3 rejects header containing newline character', () => {
    const req = makeReq('valid-id\r\nX-Injected: bad') as never;
    const res = makeRes() as never;
    mw.use(req, res, next);
    const id = (req as never as { requestId: string }).requestId;
    // Should be replaced with a UUID, not the injected value
    expect(id).not.toContain('\r');
    expect(id).not.toContain('\n');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  // CI.4 — rejects header exceeding 128 chars
  it('CI.4 rejects X-Request-ID longer than 128 chars', () => {
    const req = makeReq('a'.repeat(129)) as never;
    const res = makeRes() as never;
    mw.use(req, res, next);
    const id = (req as never as { requestId: string }).requestId;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  // CI.5 — sets response header
  it('CI.5 sets X-Request-ID on the response', () => {
    const req = makeReq('my-req-id') as never;
    const res = makeRes();
    mw.use(req, res as never, next);
    expect(res.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'my-req-id');
  });

  // CI.6 — handles array header (takes first element)
  it('CI.6 accepts valid first element of array header', () => {
    const req = makeReq(['valid-id', 'second']) as never;
    const res = makeRes() as never;
    mw.use(req, res, next);
    expect((req as never as { requestId: string }).requestId).toBe('valid-id');
  });
});

// ── RequestLoggerMiddleware unit tests ────────────────────────────────────────

describe('RequestLoggerMiddleware', () => {
  let metrics: MetricsService;
  let mw: RequestLoggerMiddleware;

  const makeReq = (method = 'GET', url = '/api/tdr/batches') => ({
    method,
    originalUrl: url,
    url,
    headers: {},
    requestId: 'test-req-id',
  });

  const makeRes = (statusCode = 200) => {
    const listeners: Record<string, (() => void)[]> = {};
    return {
      statusCode,
      on: jest.fn((event: string, fn: () => void) => { (listeners[event] ??= []).push(fn); }),
      emit: (event: string) => listeners[event]?.forEach(fn => fn()),
    };
  };

  beforeEach(() => {
    metrics = new MetricsService();
    mw = new RequestLoggerMiddleware(metrics);
  });

  // RL.1 — calls next immediately
  it('RL.1 calls next immediately', () => {
    const next = jest.fn();
    mw.use(makeReq() as never, makeRes() as never, next);
    expect(next).toHaveBeenCalled();
  });

  // RL.2 — records HTTP metric on finish
  it('RL.2 records HTTP metric when response finishes', () => {
    const spy = jest.spyOn(metrics, 'recordHttpRequest');
    const next = jest.fn();
    const res = makeRes(200);
    mw.use(makeReq() as never, res as never, next);
    res.emit('finish');
    expect(spy).toHaveBeenCalledWith('GET', '2xx', expect.any(Number));
  });

  // RL.3 — sanitizes query string from path
  it('RL.3 does not log query string', () => {
    const logSpy = jest.spyOn((mw as never as { logger: { log: jest.Mock } }).logger, 'log');
    const next = jest.fn();
    const res = makeRes(200);
    mw.use(makeReq('GET', '/api/tdr/batches?token=SECRET&x=y') as never, res as never, next);
    res.emit('finish');
    const logArg = logSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(logArg.path).toBe('/api/tdr/batches');
    expect(String(logArg.path)).not.toContain('token');
    expect(String(logArg.path)).not.toContain('SECRET');
  });

  // RL.4 — 5xx maps to correct status class
  it('RL.4 5xx status maps to 5xx class in metrics', () => {
    const spy = jest.spyOn(metrics, 'recordHttpRequest');
    const next = jest.fn();
    const res = makeRes(500);
    mw.use(makeReq('POST', '/api/tdr/batches') as never, res as never, next);
    res.emit('finish');
    expect(spy).toHaveBeenCalledWith('POST', '5xx', expect.any(Number));
  });
});
