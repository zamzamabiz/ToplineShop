-- AlterTable
ALTER TABLE "tdr_export_jobs" ADD COLUMN     "expires_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tdr_source_files" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "retention_expires_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "tdr_export_jobs_status_expires_at_idx" ON "tdr_export_jobs"("status", "expires_at");

-- CreateIndex
CREATE INDEX "tdr_source_files_tenant_id_archived_at_idx" ON "tdr_source_files"("tenant_id", "archived_at");
