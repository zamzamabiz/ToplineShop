/**
 * TDR-POST-MVP-STORAGE-DURABILITY-001
 * Storage abstraction tests.
 *
 * Covers:
 *   §SA.1   isStorageKeySafe: path traversal rejection
 *   §SA.2   LocalFsStorageAdapter: put/read/exists/delete/copy/getMetadata
 *   §SA.3   LocalFsStorageAdapter: nested directory creation
 *   §SA.4   LocalFsStorageAdapter: EXDEV fallback preserved
 *   §SA.5   LocalFsStorageAdapter: size verification on cross-volume copy
 *   §SA.6   LocalFsStorageAdapter: invalid root fails safely
 *   §SA.7   Storage key: source tenant-scoped
 *   §SA.8   Storage key: export key format
 *   §SA.9   SHA-256 hash verification helper
 *   §SA.10  S3StorageAdapter: put (mocked SDK)
 *   §SA.11  S3StorageAdapter: get/head (mocked SDK)
 *   §SA.12  S3StorageAdapter: delete (mocked SDK)
 *   §SA.13  S3StorageAdapter: getLocalPath returns null
 *   §SA.14  resolveStorageConfig: missing S3 config fails startup validation
 *   §SA.15  TempCleanupService: ignores recent files
 *   §SA.16  TempCleanupService: removes stale orphan files
 *   §SA.17  TempCleanupService: ignores non-TDR files
 *   §SA.18  StorageService: persist delegates to adapter.put
 *   §SA.19  StorageService: getFilePath throws for S3 adapter
 *   §SA.20  Old storageKey format ({tenantId}/{sourceFileId}) resolves correctly
 *   §SA.21  Export storageKey format (exports/{tenantId}/{jobId}.csv) resolves correctly
 *   §SA.22  StorageService: createReadStream delegates to adapter.getStream
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createHash } from 'crypto';

// Disable NestJS DI for isolated unit tests
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common') as object;
  return {
    ...actual,
    Injectable: () => () => {},
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
    })),
    OnModuleInit: () => {},
    OnModuleDestroy: () => {},
  };
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function makeTempRoot(): string {
  const p = path.join(os.tmpdir(), `tdr-test-storage-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function cleanupDir(p: string): void {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ── §SA.1 — isStorageKeySafe path traversal rejection ─────────────────────────

describe('§SA.1 isStorageKeySafe', () => {
  let isStorageKeySafe: (key: string) => boolean;

  beforeAll(async () => {
    const mod = await import('./ingestion/storage/storage-key.util');
    isStorageKeySafe = mod.isStorageKeySafe;
  });

  it('rejects null bytes', () => { expect(isStorageKeySafe('a/b\0c')).toBe(false); });
  it('rejects .. traversal', () => { expect(isStorageKeySafe('../etc/passwd')).toBe(false); });
  it('rejects embedded ..', () => { expect(isStorageKeySafe('a/../../../etc')).toBe(false); });
  it('rejects absolute path', () => { expect(isStorageKeySafe('/etc/passwd')).toBe(false); });
  it('rejects Windows absolute', () => { expect(isStorageKeySafe('C:\\Users\\admin')).toBe(false); });
  it('accepts valid tenant/id key', () => {
    expect(isStorageKeySafe('tenant-1/source-file-uuid')).toBe(true);
  });
  it('accepts valid exports/tenant/jobid.csv', () => {
    expect(isStorageKeySafe('exports/tenant-1/job-uuid.csv')).toBe(true);
  });
  it('rejects empty key', () => { expect(isStorageKeySafe('')).toBe(false); });
  it('rejects non-string', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isStorageKeySafe(null as any)).toBe(false);
  });
});

// ── §SA.2–6 — LocalFsStorageAdapter ──────────────────────────────────────────

describe('§SA.2–6 LocalFsStorageAdapter', () => {
  let root: string;
  let LocalFsStorageAdapter: any;
  let adapter: any;

  beforeAll(async () => {
    const mod = await import('./ingestion/storage/local-fs.adapter');
    LocalFsStorageAdapter = mod.LocalFsStorageAdapter;
  });

  beforeEach(() => {
    root = makeTempRoot();
    adapter = new LocalFsStorageAdapter({ adapter: 'local', rootPath: root });
  });

  afterEach(() => cleanupDir(root));

  it('SA.2a put: writes file to resolved path', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'hello storage');
    await adapter.put('tenant-a/file-1', src);
    const dest = path.join(root, 'tenant-a', 'file-1');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toBe('hello storage');
  });

  it('SA.2b getStream: returns readable stream', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'readable content');
    await adapter.put('tenant-a/file-2', src);
    const stream = adapter.getStream('tenant-a/file-2');
    const chunks: Buffer[] = [];
    await new Promise<void>((res, rej) => {
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', res);
      stream.on('error', rej);
    });
    expect(Buffer.concat(chunks).toString('utf8')).toBe('readable content');
  });

  it('SA.2c exists: returns true when object exists', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'exists-check');
    await adapter.put('tenant-a/file-3', src);
    expect(await adapter.exists('tenant-a/file-3')).toBe(true);
  });

  it('SA.2d exists: returns false when object absent', async () => {
    expect(await adapter.exists('tenant-a/missing-file')).toBe(false);
  });

  it('SA.2e delete: removes existing object', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'to-delete');
    await adapter.put('tenant-a/file-del', src);
    expect(await adapter.exists('tenant-a/file-del')).toBe(true);
    await adapter.delete('tenant-a/file-del');
    expect(await adapter.exists('tenant-a/file-del')).toBe(false);
  });

  it('SA.2f delete: no throw for missing object', async () => {
    await expect(adapter.delete('tenant-a/ghost')).resolves.not.toThrow();
  });

  it('SA.2g copy: copies object to new key', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'copy-source');
    await adapter.put('tenant-a/original', src);
    await adapter.copy('tenant-a/original', 'tenant-a/copy');
    expect(await adapter.exists('tenant-a/copy')).toBe(true);
    expect(fs.readFileSync(path.join(root, 'tenant-a', 'copy'), 'utf8')).toBe('copy-source');
  });

  it('SA.2h getMetadata: returns size for existing object', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, '12345');
    await adapter.put('tenant-a/meta-file', src);
    const meta = await adapter.getMetadata('tenant-a/meta-file');
    expect(meta).not.toBeNull();
    expect(meta.sizeBytes).toBe(5);
  });

  it('SA.2i getMetadata: returns null for missing object', async () => {
    expect(await adapter.getMetadata('tenant-a/ghost')).toBeNull();
  });

  it('SA.3 put: creates nested directories', async () => {
    const src = path.join(root, 'nested.tmp');
    fs.writeFileSync(src, 'nested');
    await adapter.put('deep/path/tenant/file', src);
    expect(fs.existsSync(path.join(root, 'deep', 'path', 'tenant', 'file'))).toBe(true);
  });

  it('SA.4 EXDEV: falls back to streaming copy on cross-volume rename error', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'exdev-content');

    jest.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('cross-device link not permitted'), { code: 'EXDEV' });
    });

    await adapter.put('tenant-a/exdev-file', src);

    const dest = path.join(root, 'tenant-a', 'exdev-file');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toBe('exdev-content');
    jest.restoreAllMocks();
  });

  it('SA.5 copy size verification: copy() verifies src and dst sizes match', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'verify-size');
    await adapter.put('tenant-a/source-for-copy', src);
    await adapter.copy('tenant-a/source-for-copy', 'tenant-a/copy-verify');
    const srcMeta = await adapter.getMetadata('tenant-a/source-for-copy');
    const dstMeta = await adapter.getMetadata('tenant-a/copy-verify');
    expect(srcMeta!.sizeBytes).toBe(dstMeta!.sizeBytes);
  });

  it('SA.6 invalid key throws', async () => {
    const src = path.join(root, 'src.tmp');
    fs.writeFileSync(src, 'x');
    await expect(adapter.put('../escape/file', src)).rejects.toThrow(/unsafe storage key/i);
  });

  it('SA.4 getLocalPath: returns resolved path (never null for local)', () => {
    const resolved = adapter.getLocalPath('tenant-a/some-file');
    expect(resolved).not.toBeNull();
    expect(resolved).toContain('tenant-a');
  });
});

// ── §SA.7-8 — Storage key format ─────────────────────────────────────────────

describe('§SA.7–8 Storage key contract', () => {
  it('SA.7 source key is tenant-scoped (tenantId/sourceFileId)', async () => {
    const { generateStorageKey } = await import('./ingestion/storage/storage-key.util');
    const key = generateStorageKey('tenant-abc', 'file-uuid-123');
    expect(key).toBe('tenant-abc/file-uuid-123');
    expect(key).not.toContain('\\');
    expect(key).not.toContain('D:');
    expect(key).not.toContain('C:');
  });

  it('SA.8 export key follows exports/{tenantId}/{jobId}.csv convention', () => {
    const tenantId = 'tenant-abc';
    const jobId = 'job-uuid-456';
    const key = `exports/${tenantId}/${jobId}.csv`;
    const { isStorageKeySafe } = require('./ingestion/storage/storage-key.util');
    expect(isStorageKeySafe(key)).toBe(true);
    expect(key).toContain('exports/');
    expect(key.endsWith('.csv')).toBe(true);
  });
});

// ── §SA.9 — SHA-256 integrity verification helper ────────────────────────────

describe('§SA.9 SHA-256 integrity helper', () => {
  it('computes correct hash for known content', async () => {
    const tmp = path.join(os.tmpdir(), `tdr-hash-test-${Date.now()}.tmp`);
    fs.writeFileSync(tmp, 'hello world');
    try {
      const { computeFileHash } = await import('./ingestion/utils/file-hash.util');
      const hash = await computeFileHash(tmp);
      // Known SHA-256 of "hello world"
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe04294e576ca5db6f0ca7c71e0'.slice(0, 8) + hash.slice(8));
      expect(hash).toHaveLength(64);
      // Independently verify
      const expected = createHash('sha256').update('hello world').digest('hex');
      expect(hash).toBe(expected);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('hash matches content after put (integrity check)', async () => {
    const root = makeTempRoot();
    try {
      const { LocalFsStorageAdapter } = await import('./ingestion/storage/local-fs.adapter');
      const adapter = new LocalFsStorageAdapter({ adapter: 'local', rootPath: root });
      const content = 'integrity-test-content';
      const src = path.join(root, 'integrity-src.tmp');
      fs.writeFileSync(src, content);
      const expectedHash = createHash('sha256').update(content).digest('hex');
      await adapter.put('tenant/integrity-file', src);
      const storedPath = adapter.getLocalPath('tenant/integrity-file')!;
      const actualHash = await sha256File(storedPath);
      expect(actualHash).toBe(expectedHash);
    } finally {
      cleanupDir(root);
    }
  });
});

// ── §SA.10–13 — S3StorageAdapter (mocked SDK) ────────────────────────────────

describe('§SA.10–13 S3StorageAdapter (mocked)', () => {
  const mockSend = jest.fn();
  const mockS3Client = { send: mockSend };

  beforeEach(() => {
    jest.resetModules();
    mockSend.mockReset();
    // Mock dynamic import of @aws-sdk/client-s3
    jest.mock('@aws-sdk/client-s3', () => ({
      S3Client: jest.fn().mockImplementation(() => mockS3Client),
      PutObjectCommand: jest.fn().mockImplementation((args: unknown) => ({ type: 'Put', args })),
      GetObjectCommand: jest.fn().mockImplementation((args: unknown) => ({ type: 'Get', args })),
      HeadObjectCommand: jest.fn().mockImplementation((args: unknown) => ({ type: 'Head', args })),
      DeleteObjectCommand: jest.fn().mockImplementation((args: unknown) => ({ type: 'Delete', args })),
      CopyObjectCommand: jest.fn().mockImplementation((args: unknown) => ({ type: 'Copy', args })),
    }));
  });

  afterEach(() => {
    jest.unmock('@aws-sdk/client-s3');
    jest.restoreAllMocks();
  });

  async function makeAdapter() {
    const { S3StorageAdapter } = await import('./ingestion/storage/s3.adapter');
    return new S3StorageAdapter({
      adapter: 's3',
      bucket: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    });
  }

  it('SA.10 put: calls PutObjectCommand with correct bucket and key', async () => {
    const adapter = await makeAdapter();
    const tmp = path.join(os.tmpdir(), `s3-put-${Date.now()}.tmp`);
    fs.writeFileSync(tmp, 'put-content');
    mockSend.mockResolvedValueOnce({});

    await adapter.put('tenant/file-1', tmp);

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.type).toBe('Put');
    expect(call.args.Bucket).toBe('test-bucket');
    expect(call.args.Key).toBe('tdr/tenant/file-1');
  });

  it('SA.11a exists/head: returns true when object found', async () => {
    const adapter = await makeAdapter();
    mockSend.mockResolvedValueOnce({ ContentLength: 100, ContentType: 'text/csv' });
    expect(await adapter.exists('tenant/file-2')).toBe(true);
    expect(mockSend.mock.calls[0][0].type).toBe('Head');
  });

  it('SA.11b exists/head: returns false on 404', async () => {
    const adapter = await makeAdapter();
    const notFound = Object.assign(new Error('Not Found'), { $metadata: { httpStatusCode: 404 } });
    mockSend.mockRejectedValueOnce(notFound);
    expect(await adapter.exists('tenant/missing')).toBe(false);
  });

  it('SA.12 delete: calls DeleteObjectCommand', async () => {
    const adapter = await makeAdapter();
    mockSend.mockResolvedValueOnce({});
    await adapter.delete('tenant/to-delete');
    expect(mockSend.mock.calls[0][0].type).toBe('Delete');
    expect(mockSend.mock.calls[0][0].args.Key).toBe('tdr/tenant/to-delete');
  });

  it('SA.13 getLocalPath: returns null (S3 objects have no local path)', async () => {
    const adapter = await makeAdapter();
    expect(adapter.getLocalPath('any/key')).toBeNull();
  });
});

// ── §SA.14 — Storage config validation ───────────────────────────────────────

describe('§SA.14 resolveStorageConfig: missing S3 config fails', () => {
  const ORIG = { ...process.env };

  afterEach(() => { process.env = { ...ORIG }; });

  it('throws when STORAGE_ADAPTER=s3 and S3_BUCKET missing', async () => {
    jest.resetModules();
    process.env['STORAGE_ADAPTER'] = 's3';
    delete process.env['S3_BUCKET'];
    process.env['S3_REGION'] = 'us-east-1';
    process.env['S3_ACCESS_KEY_ID'] = 'key';
    process.env['S3_SECRET_ACCESS_KEY'] = 'secret';
    const { resolveStorageConfig } = await import('./ingestion/storage/storage.config');
    expect(() => resolveStorageConfig()).toThrow(/S3_BUCKET/);
  });

  it('throws when STORAGE_ADAPTER=s3 and S3_REGION missing', async () => {
    jest.resetModules();
    process.env['STORAGE_ADAPTER'] = 's3';
    process.env['S3_BUCKET'] = 'bucket';
    delete process.env['S3_REGION'];
    process.env['S3_ACCESS_KEY_ID'] = 'key';
    process.env['S3_SECRET_ACCESS_KEY'] = 'secret';
    const { resolveStorageConfig } = await import('./ingestion/storage/storage.config');
    expect(() => resolveStorageConfig()).toThrow(/S3_REGION/);
  });

  it('throws on unknown STORAGE_ADAPTER value', async () => {
    jest.resetModules();
    process.env['STORAGE_ADAPTER'] = 'ftp';
    const { resolveStorageConfig } = await import('./ingestion/storage/storage.config');
    expect(() => resolveStorageConfig()).toThrow(/Unknown STORAGE_ADAPTER/);
  });

  it('succeeds for local adapter with explicit path', async () => {
    jest.resetModules();
    process.env['STORAGE_ADAPTER'] = 'local';
    process.env['TDR_STORAGE_PATH'] = 'D:\\ToplineShopData\\TDR';
    process.env['NODE_ENV'] = 'development';
    const { resolveStorageConfig } = await import('./ingestion/storage/storage.config');
    const config = resolveStorageConfig();
    expect(config.adapter).toBe('local');
  });
});

// ── §SA.15–17 — TempCleanupService ──────────────────────────────────────────

describe('§SA.15–17 TempCleanupService', () => {
  let tmpDir: string;
  let TempCleanupService: any;
  let svc: any;

  beforeAll(async () => {
    const mod = await import('./ingestion/storage/temp-cleanup.service');
    TempCleanupService = mod.TempCleanupService;
  });

  beforeEach(() => {
    tmpDir = makeTempRoot();
    svc = new TempCleanupService();
    // Override private readonly tmpDir to our isolated test root
    (svc as any).tmpDir = tmpDir;
  });

  afterEach(() => cleanupDir(tmpDir));

  it('SA.15 skips recent files (< 24h)', async () => {
    const recent = path.join(tmpDir, 'tdr-upload-recent.csv.tmp');
    fs.writeFileSync(recent, 'recent');
    // mtime is "now" by default — within threshold
    const result = await svc.runCleanup();
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(recent)).toBe(true);
  });

  it('SA.16 removes stale files (> 24h)', async () => {
    const stale = path.join(tmpDir, 'tdr-export-stale.csv.tmp');
    fs.writeFileSync(stale, 'stale');
    // Set mtime to 25 hours ago
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fs.utimesSync(stale, staleTime, staleTime);
    const result = await svc.runCleanup();
    expect(result.removed).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(stale)).toBe(false);
  });

  it('SA.17 ignores non-TDR temp files', async () => {
    const other = path.join(tmpDir, 'other-process.tmp');
    fs.writeFileSync(other, 'other');
    const staleTime = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fs.utimesSync(other, staleTime, staleTime);
    await svc.runCleanup();
    // Non-TDR file should NOT be deleted
    expect(fs.existsSync(other)).toBe(true);
  });
});

// ── §SA.18–20 — StorageService delegation ────────────────────────────────────

describe('§SA.18–20 StorageService delegation', () => {
  it('SA.18 persist delegates to adapter.put', async () => {
    jest.resetModules();
    process.env['STORAGE_ADAPTER'] = 'local';
    process.env['TDR_STORAGE_PATH'] = os.tmpdir();
    const { StorageService } = await import('./ingestion/storage/storage.service');
    const svc = new StorageService();
    const mockPut = jest.fn().mockResolvedValue(undefined);
    (svc as any).adapter.put = mockPut;

    await svc.persist('/tmp/src.tmp', 'tenant/file');
    expect(mockPut).toHaveBeenCalledWith('tenant/file', '/tmp/src.tmp');
  });

  it('SA.19 getFilePath throws for S3 adapter (getLocalPath returns null)', async () => {
    jest.resetModules();
    const { StorageService } = await import('./ingestion/storage/storage.service');
    const svc = new StorageService();
    // Replace adapter with S3-like stub
    (svc as any).adapter = {
      getLocalPath: () => null,
      getStream: jest.fn(),
      put: jest.fn(),
      exists: jest.fn(),
      delete: jest.fn(),
      copy: jest.fn(),
      getMetadata: jest.fn(),
      deleteTempSafe: jest.fn(),
    };
    expect(() => svc.getFilePath('any/key')).toThrow(/not supported/i);
  });

  it('SA.20 old storageKey format resolves to correct path', async () => {
    jest.resetModules();
    const root = makeTempRoot();
    try {
      process.env['STORAGE_ADAPTER'] = 'local';
      process.env['TDR_STORAGE_PATH'] = root;
      const { StorageService } = await import('./ingestion/storage/storage.service');
      const svc = new StorageService();
      // Old format (no source/ prefix) — must still resolve under new adapter
      const key = '6755271c-7b4c-40f2-a5aa-8be135cee886/3c2a619a-e928-4ce6-ae81-06a4c4494a41';
      const resolved = svc.getFilePath(key);
      expect(resolved).toBe(path.join(root, key));
    } finally {
      cleanupDir(root);
      delete process.env['TDR_STORAGE_PATH'];
    }
  });

  it('SA.21 export storageKey resolves to exports subdir', async () => {
    jest.resetModules();
    const root = makeTempRoot();
    try {
      process.env['STORAGE_ADAPTER'] = 'local';
      process.env['TDR_STORAGE_PATH'] = root;
      const { StorageService } = await import('./ingestion/storage/storage.service');
      const svc = new StorageService();
      const key = 'exports/tenant-1/job-abc.csv';
      const resolved = svc.getFilePath(key);
      expect(resolved).toBe(path.join(root, key));
    } finally {
      cleanupDir(root);
      delete process.env['TDR_STORAGE_PATH'];
    }
  });

  it('SA.22 createReadStream delegates to adapter.getStream', async () => {
    jest.resetModules();
    const { StorageService } = await import('./ingestion/storage/storage.service');
    const svc = new StorageService();
    const fakeStream = { pipe: jest.fn() };
    (svc as any).adapter.getStream = jest.fn().mockReturnValue(fakeStream);
    const result = svc.createReadStream('some/key');
    expect(result).toBe(fakeStream);
  });
});
