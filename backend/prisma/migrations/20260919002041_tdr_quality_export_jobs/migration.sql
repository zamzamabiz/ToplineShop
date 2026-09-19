-- CreateTable
CREATE TABLE "tdr_quality_jobs" (
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
    "worker_instance_id" TEXT,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_quality_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_export_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "trade_direction" "TradeDirection",
    "filter_config" JSONB NOT NULL,
    "row_limit" INTEGER NOT NULL DEFAULT 100000,
    "row_count" INTEGER,
    "storage_key" TEXT,
    "content_hash" CHAR(64),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "leased_at" TIMESTAMP(3),
    "lease_expires_at" TIMESTAMP(3),
    "lease_duration_ms" INTEGER NOT NULL DEFAULT 600000,
    "last_heartbeat_at" TIMESTAMP(3),
    "worker_instance_id" TEXT,
    "error_code" VARCHAR(50),
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tdr_quality_jobs_batch_id_key" ON "tdr_quality_jobs"("batch_id");

-- CreateIndex
CREATE INDEX "tdr_quality_jobs_status_lease_expires_at_idx" ON "tdr_quality_jobs"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "tdr_quality_jobs_tenant_id_status_idx" ON "tdr_quality_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_export_jobs_status_lease_expires_at_idx" ON "tdr_export_jobs"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "tdr_export_jobs_tenant_id_status_idx" ON "tdr_export_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_export_jobs_tenant_id_created_at_idx" ON "tdr_export_jobs"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "tdr_quality_jobs" ADD CONSTRAINT "tdr_quality_jobs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "tdr_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_quality_jobs" ADD CONSTRAINT "tdr_quality_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_export_jobs" ADD CONSTRAINT "tdr_export_jobs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_export_jobs" ADD CONSTRAINT "tdr_export_jobs_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
