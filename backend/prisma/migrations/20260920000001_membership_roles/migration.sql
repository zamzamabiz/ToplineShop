-- AlterTable: Add tenant-scoped roles array to memberships (ARCH-ROLE-001)
-- Additive only. Existing rows default to empty roles array.
ALTER TABLE "memberships" ADD COLUMN "roles" TEXT[] NOT NULL DEFAULT '{}';
