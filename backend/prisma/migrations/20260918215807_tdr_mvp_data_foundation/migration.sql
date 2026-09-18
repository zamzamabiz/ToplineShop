-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('RECEIVED', 'QUEUED', 'PROCESSING', 'REVIEW_REQUIRED', 'READY', 'PARTIAL', 'FAILED', 'CANCELLED', 'EXPORTING', 'EXPORTED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'LEASED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RowDisposition" AS ENUM ('ACCEPTED', 'QUARANTINED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IssueSeverity" AS ENUM ('WARNING', 'ERROR', 'BLOCKING');

-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'REVIEWED', 'SUPPRESSED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVE', 'REJECT', 'CORRECT');

-- CreateTable
CREATE TABLE "tenant_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module_key" VARCHAR(50) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "enabled_at" TIMESTAMP(3),
    "enabled_by_id" TEXT,
    "configuration" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_schema_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "scope_key" VARCHAR(36) NOT NULL,
    "profile_id" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "trade_direction" "TradeDirection" NOT NULL,
    "source_schema_fingerprint" CHAR(64),
    "mapping_config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tdr_schema_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_source_files" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "file_size_bytes" BIGINT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_hash" CHAR(64) NOT NULL,
    "trade_direction" "TradeDirection" NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tdr_source_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_file_id" TEXT NOT NULL,
    "mapping_id" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'RECEIVED',
    "trade_direction" "TradeDirection" NOT NULL,
    "mapping_version" VARCHAR(100) NOT NULL,
    "parser_version" VARCHAR(100) NOT NULL,
    "normalization_version" VARCHAR(100) NOT NULL,
    "validation_version" VARCHAR(100) NOT NULL,
    "processing_fingerprint_hash" CHAR(64) NOT NULL,
    "replay_of_batch_id" TEXT,
    "replay_reason" TEXT,
    "processing_config" JSONB,
    "store_source_rows" BOOLEAN NOT NULL DEFAULT false,
    "total_source_rows" INTEGER,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "accepted_rows" INTEGER NOT NULL DEFAULT 0,
    "quarantined_rows" INTEGER NOT NULL DEFAULT 0,
    "rejected_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_chunks" INTEGER NOT NULL DEFAULT 0,
    "last_checkpoint_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_processing_jobs" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "leased_at" TIMESTAMP(3),
    "lease_expires_at" TIMESTAMP(3),
    "lease_duration_ms" INTEGER NOT NULL DEFAULT 300000,
    "last_heartbeat_at" TIMESTAMP(3),
    "last_checkpoint_row" INTEGER NOT NULL DEFAULT 0,
    "worker_instance_id" TEXT,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "error_stack" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_file_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "source_row_number" INTEGER NOT NULL,
    "row_hash" CHAR(64) NOT NULL,
    "trade_direction" "TradeDirection" NOT NULL,
    "trade_date" DATE,
    "hs_code_raw" TEXT,
    "hs_code_normalized" TEXT,
    "hs_chapter" CHAR(2),
    "product_description_raw" TEXT,
    "product_description_normalized" TEXT,
    "local_party_tax_id_raw" TEXT,
    "local_party_tax_id_normalized" TEXT,
    "local_party_name_raw" TEXT,
    "local_party_name_normalized" TEXT,
    "local_party_address_raw" TEXT,
    "local_party_country_code" CHAR(2),
    "foreign_party_name_raw" TEXT,
    "foreign_party_name_normalized" TEXT,
    "foreign_party_address_raw" TEXT,
    "foreign_party_country_raw" TEXT,
    "foreign_party_country_code" CHAR(2),
    "origin_port_raw" TEXT,
    "origin_port_normalized" TEXT,
    "quantity_raw" TEXT,
    "quantity_normalized" DECIMAL(24,6),
    "quantity_unit_raw" TEXT,
    "quantity_unit_code" VARCHAR(20),
    "unit_price_raw" TEXT,
    "unit_price_normalized" DECIMAL(24,6),
    "currency_raw" TEXT,
    "currency_code" CHAR(3),
    "source_schema_signature" TEXT NOT NULL,
    "mapping_version" VARCHAR(100) NOT NULL,
    "parser_version" VARCHAR(100) NOT NULL,
    "normalization_version" VARCHAR(100) NOT NULL,
    "validation_version" VARCHAR(100) NOT NULL,
    "row_disposition" "RowDisposition" NOT NULL,
    "quarantine_review_required" BOOLEAN NOT NULL DEFAULT false,
    "export_eligible" BOOLEAN NOT NULL DEFAULT false,
    "exported_at" TIMESTAMP(3),
    "source_row_evidence" JSONB,
    "value_treatment_meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_source_rows" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_row_number" INTEGER NOT NULL,
    "raw_content" JSONB NOT NULL,
    "row_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tdr_source_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_validation_issues" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "field_name" VARCHAR(100),
    "rule_code" VARCHAR(50) NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "raw_value" TEXT,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_validation_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_quarantine_reviews" (
    "id" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "action" "ReviewAction" NOT NULL,
    "correction_field_name" VARCHAR(100),
    "correction_payload" JSONB,
    "correction_value_hash" CHAR(64),
    "correction_note" TEXT,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tdr_quarantine_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_modules_tenant_id_module_key_enabled_idx" ON "tenant_modules"("tenant_id", "module_key", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_modules_tenant_id_module_key_key" ON "tenant_modules"("tenant_id", "module_key");

-- CreateIndex
CREATE INDEX "tdr_schema_mappings_source_schema_fingerprint_idx" ON "tdr_schema_mappings"("source_schema_fingerprint");

-- CreateIndex
CREATE INDEX "tdr_schema_mappings_tenant_id_trade_direction_active_idx" ON "tdr_schema_mappings"("tenant_id", "trade_direction", "active");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_schema_mappings_scope_key_profile_id_version_key" ON "tdr_schema_mappings"("scope_key", "profile_id", "version");

-- CreateIndex
CREATE INDEX "tdr_source_files_tenant_id_uploaded_at_idx" ON "tdr_source_files"("tenant_id", "uploaded_at");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_source_files_tenant_id_content_hash_key" ON "tdr_source_files"("tenant_id", "content_hash");

-- CreateIndex
CREATE INDEX "tdr_batches_processing_fingerprint_hash_idx" ON "tdr_batches"("processing_fingerprint_hash");

-- CreateIndex
CREATE INDEX "tdr_batches_tenant_id_status_idx" ON "tdr_batches"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_batches_tenant_id_created_at_idx" ON "tdr_batches"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "tdr_batches_source_file_id_idx" ON "tdr_batches"("source_file_id");

-- CreateIndex
CREATE INDEX "tdr_batches_tenant_id_trade_direction_status_idx" ON "tdr_batches"("tenant_id", "trade_direction", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_processing_jobs_batch_id_key" ON "tdr_processing_jobs"("batch_id");

-- CreateIndex
CREATE INDEX "tdr_processing_jobs_status_lease_expires_at_idx" ON "tdr_processing_jobs"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "tdr_processing_jobs_tenant_id_status_idx" ON "tdr_processing_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_records_tenant_id_batch_id_row_disposition_idx" ON "tdr_records"("tenant_id", "batch_id", "row_disposition");

-- CreateIndex
CREATE INDEX "tdr_records_tenant_id_trade_date_idx" ON "tdr_records"("tenant_id", "trade_date");

-- CreateIndex
CREATE INDEX "tdr_records_tenant_id_hs_code_normalized_trade_date_idx" ON "tdr_records"("tenant_id", "hs_code_normalized", "trade_date");

-- CreateIndex
CREATE INDEX "tdr_records_tenant_id_local_party_tax_id_normalized_idx" ON "tdr_records"("tenant_id", "local_party_tax_id_normalized");

-- CreateIndex
CREATE INDEX "tdr_records_tenant_id_export_eligible_idx" ON "tdr_records"("tenant_id", "export_eligible");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_records_batch_id_source_row_number_key" ON "tdr_records"("batch_id", "source_row_number");

-- CreateIndex
CREATE INDEX "tdr_source_rows_tenant_id_row_hash_idx" ON "tdr_source_rows"("tenant_id", "row_hash");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_source_rows_batch_id_source_row_number_key" ON "tdr_source_rows"("batch_id", "source_row_number");

-- CreateIndex
CREATE INDEX "tdr_validation_issues_batch_id_severity_status_idx" ON "tdr_validation_issues"("batch_id", "severity", "status");

-- CreateIndex
CREATE INDEX "tdr_validation_issues_record_id_idx" ON "tdr_validation_issues"("record_id");

-- CreateIndex
CREATE INDEX "tdr_validation_issues_tenant_id_rule_code_idx" ON "tdr_validation_issues"("tenant_id", "rule_code");

-- CreateIndex
CREATE INDEX "tdr_quarantine_reviews_record_id_idx" ON "tdr_quarantine_reviews"("record_id");

-- CreateIndex
CREATE INDEX "tdr_quarantine_reviews_batch_id_action_idx" ON "tdr_quarantine_reviews"("batch_id", "action");

-- CreateIndex
CREATE INDEX "tdr_quarantine_reviews_tenant_id_applied_at_idx" ON "tdr_quarantine_reviews"("tenant_id", "applied_at");

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_enabled_by_id_fkey" FOREIGN KEY ("enabled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_schema_mappings" ADD CONSTRAINT "tdr_schema_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_files" ADD CONSTRAINT "tdr_source_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_files" ADD CONSTRAINT "tdr_source_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_batches" ADD CONSTRAINT "tdr_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_batches" ADD CONSTRAINT "tdr_batches_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "tdr_source_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_batches" ADD CONSTRAINT "tdr_batches_mapping_id_fkey" FOREIGN KEY ("mapping_id") REFERENCES "tdr_schema_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_batches" ADD CONSTRAINT "tdr_batches_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_batches" ADD CONSTRAINT "tdr_batches_replay_of_batch_id_fkey" FOREIGN KEY ("replay_of_batch_id") REFERENCES "tdr_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_processing_jobs" ADD CONSTRAINT "tdr_processing_jobs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_processing_jobs" ADD CONSTRAINT "tdr_processing_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_records" ADD CONSTRAINT "tdr_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_records" ADD CONSTRAINT "tdr_records_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "tdr_source_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_records" ADD CONSTRAINT "tdr_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_rows" ADD CONSTRAINT "tdr_source_rows_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_rows" ADD CONSTRAINT "tdr_source_rows_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_validation_issues" ADD CONSTRAINT "tdr_validation_issues_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "tdr_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_validation_issues" ADD CONSTRAINT "tdr_validation_issues_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_validation_issues" ADD CONSTRAINT "tdr_validation_issues_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_quarantine_reviews" ADD CONSTRAINT "tdr_quarantine_reviews_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "tdr_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_quarantine_reviews" ADD CONSTRAINT "tdr_quarantine_reviews_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_quarantine_reviews" ADD CONSTRAINT "tdr_quarantine_reviews_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_quarantine_reviews" ADD CONSTRAINT "tdr_quarantine_reviews_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
