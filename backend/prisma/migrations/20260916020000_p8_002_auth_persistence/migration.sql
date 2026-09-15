-- TOPLINE-P8-002: Auth Persistence Data Model Foundation (forward-only additive)
--
-- Scope:
--   1. New enum SessionRevocationReason
--   2. Nullable password_hash column on users (deferred hashing behavior to P8-003)
--   3. Nullable ip_address and user_agent columns on audit_logs (request context)
--   4. New sessions table for revocable refresh-token persistence
--      (HMAC-SHA256 digest only; never a raw refresh token)
--
-- Safety contract:
--   - All operations are ADDITIVE (CREATE TYPE, ADD COLUMN, CREATE TABLE,
--     CREATE INDEX, ADD CONSTRAINT FOREIGN KEY).
--   - No DROP, TRUNCATE, destructive ALTER, rename, seed, or data rewrite.
--   - Existing initial migration 20260907172636_init_core_schema is NOT modified.

-- CreateEnum
CREATE TYPE "SessionRevocationReason" AS ENUM (
    'USER_LOGOUT',
    'USER_INITIATED',
    'ADMIN_REVOKED',
    'REFRESH_ROTATION',
    'REFRESH_REUSE_DETECTED',
    'EXPIRED',
    'REPLACED'
);

-- AlterTable: users
-- Nullable: credential storage is opt-in; hashing algorithm/behavior is P8-003.
ALTER TABLE "users" ADD COLUMN "password_hash" VARCHAR(255);

-- AlterTable: audit_logs
-- Nullable: callers (P8-003 audit redaction/events) populate when known.
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" VARCHAR(45);
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" TEXT;

-- CreateTable: sessions
-- One revocable session per (user, device). Multiple devices per user allowed.
-- Stores ONLY the HMAC-SHA256 digest of the refresh token.
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "device_id" VARCHAR(128) NOT NULL,
    "refresh_token_digest" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_reason" "SessionRevocationReason",
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Enforces "one revocable session per user/device" at the DB layer.
CREATE UNIQUE INDEX "sessions_user_id_device_id_key" ON "sessions"("user_id", "device_id");

-- CreateIndex
-- Defense-in-depth uniqueness invariant for `refresh_token_digest`.
-- The refresh-token HOT PATH in P8-003 is by `sessionId` (UUID PK lookup),
-- NOT by digest. See WDR §"Forward-Looking P8-003 Refresh-Token Contract".
CREATE UNIQUE INDEX "sessions_refresh_token_digest_key" ON "sessions"("refresh_token_digest");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_tenant_id_idx" ON "sessions"("tenant_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
