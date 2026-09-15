-- ============================================================
-- P8-002 Auth Persistence Data Model and Migration Safety Foundation
-- Date: 2026-09-16
-- Status: ARTIFACT ONLY — NOT APPLIED
-- This file was prepared for PM/CTO review during TOPLINE-P8-002.
-- Do NOT apply via prisma migrate dev, prisma migrate deploy,
-- prisma db push, or any direct SQL execution until PM approves.
-- ============================================================

-- Additive assessment: all statements below are additive only.
-- No DROP, no TRUNCATE, no ALTER COLUMN DROP NOT NULL,
-- no ALTER COLUMN TYPE, no destructive constraint removal.
-- All new columns are nullable (TEXT) — no impact on existing rows.
-- The sessions table is brand new — no existing data affected.

-- ------------------------------------------------------------
-- 1. AlterTable: add password_hash to users
-- ------------------------------------------------------------
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;

-- ------------------------------------------------------------
-- 2. AlterTable: add ip_address and user_agent to audit_logs
-- ------------------------------------------------------------
ALTER TABLE "audit_logs" ADD COLUMN "ip_address" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN "user_agent" TEXT;

-- ------------------------------------------------------------
-- 3. CreateTable: sessions (new; P8-002 sole owner)
-- ------------------------------------------------------------
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------
-- 4. CreateIndex
-- ------------------------------------------------------------
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
CREATE INDEX "sessions_tenant_id_idx" ON "sessions"("tenant_id");
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- ------------------------------------------------------------
-- 5. AddForeignKey
-- ------------------------------------------------------------
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- ROLLBACK (for reference — apply in reverse if migration must
-- be undone; requires PM approval before execution):
--
-- ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_tenant_id_fkey";
-- ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_fkey";
-- DROP INDEX IF EXISTS "sessions_expires_at_idx";
-- DROP INDEX IF EXISTS "sessions_tenant_id_idx";
-- DROP INDEX IF EXISTS "sessions_user_id_idx";
-- DROP INDEX IF EXISTS "sessions_token_hash_key";
-- DROP TABLE IF EXISTS "sessions";
-- ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "user_agent";
-- ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "ip_address";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";
-- ============================================================
