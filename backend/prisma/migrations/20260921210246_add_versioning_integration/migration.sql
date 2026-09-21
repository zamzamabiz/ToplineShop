-- CreateEnum
CREATE TYPE "DeletionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WebhookDeliveryStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED', 'EXHAUSTED');

-- AlterTable
ALTER TABLE "tdr_source_files" ADD COLUMN     "logical_dataset_id" TEXT,
ADD COLUMN     "replacement_reason" TEXT,
ADD COLUMN     "supersedes_source_file_id" TEXT,
ADD COLUMN     "version_number" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "tdr_source_deletion_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_file_id" TEXT NOT NULL,
    "requested_by_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "DeletionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "review_note" TEXT,

    CONSTRAINT "tdr_source_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_api_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key_prefix" VARCHAR(16) NOT NULL,
    "key_hash" CHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "scopes" TEXT[],
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "tdr_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "event_types" TEXT[],
    "signing_secret" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdr_webhook_delivery_attempts" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "max_attempts" INTEGER NOT NULL DEFAULT 3,
    "status" "WebhookDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "status_code" INTEGER,
    "error_message" TEXT,
    "next_retry_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tdr_webhook_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tdr_source_deletion_requests_tenant_id_status_idx" ON "tdr_source_deletion_requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_source_deletion_requests_source_file_id_idx" ON "tdr_source_deletion_requests"("source_file_id");

-- CreateIndex
CREATE UNIQUE INDEX "tdr_api_keys_key_hash_key" ON "tdr_api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "tdr_api_keys_tenant_id_revoked_at_idx" ON "tdr_api_keys"("tenant_id", "revoked_at");

-- CreateIndex
CREATE INDEX "tdr_webhook_subscriptions_tenant_id_enabled_idx" ON "tdr_webhook_subscriptions"("tenant_id", "enabled");

-- CreateIndex
CREATE INDEX "tdr_webhook_delivery_attempts_subscription_id_status_idx" ON "tdr_webhook_delivery_attempts"("subscription_id", "status");

-- CreateIndex
CREATE INDEX "tdr_webhook_delivery_attempts_tenant_id_status_idx" ON "tdr_webhook_delivery_attempts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "tdr_webhook_delivery_attempts_next_retry_at_status_idx" ON "tdr_webhook_delivery_attempts"("next_retry_at", "status");

-- CreateIndex
CREATE INDEX "tdr_source_files_tenant_id_logical_dataset_id_idx" ON "tdr_source_files"("tenant_id", "logical_dataset_id");

-- AddForeignKey
ALTER TABLE "tdr_source_files" ADD CONSTRAINT "tdr_source_files_supersedes_source_file_id_fkey" FOREIGN KEY ("supersedes_source_file_id") REFERENCES "tdr_source_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_deletion_requests" ADD CONSTRAINT "tdr_source_deletion_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_deletion_requests" ADD CONSTRAINT "tdr_source_deletion_requests_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "tdr_source_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_deletion_requests" ADD CONSTRAINT "tdr_source_deletion_requests_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_source_deletion_requests" ADD CONSTRAINT "tdr_source_deletion_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_api_keys" ADD CONSTRAINT "tdr_api_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_api_keys" ADD CONSTRAINT "tdr_api_keys_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_webhook_subscriptions" ADD CONSTRAINT "tdr_webhook_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_webhook_delivery_attempts" ADD CONSTRAINT "tdr_webhook_delivery_attempts_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tdr_webhook_subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tdr_webhook_delivery_attempts" ADD CONSTRAINT "tdr_webhook_delivery_attempts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
