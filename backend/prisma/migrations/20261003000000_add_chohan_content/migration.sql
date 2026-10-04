CREATE TABLE "chohan_site_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "theme_key" VARCHAR(50) NOT NULL DEFAULT 'mint-executive',
    "primary_color" VARCHAR(20) NOT NULL DEFAULT '#0f5b55',
    "accent_color" VARCHAR(20) NOT NULL DEFAULT '#ee765d',
    "canvas_color" VARCHAR(20) NOT NULL DEFAULT '#f5f1e7',
    "draft_json" JSONB,
    "published_json" JSONB,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chohan_site_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chohan_gallery_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "image_url" TEXT NOT NULL,
    "alt_text" TEXT NOT NULL,
    "caption" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chohan_gallery_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chohan_content_revisions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "payload" JSONB NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chohan_content_revisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chohan_company_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chohan_company_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chohan_media_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" VARCHAR(255),
    "mime_type" VARCHAR(100) NOT NULL,
    "alt_text" VARCHAR(255) NOT NULL,
    "caption" TEXT,
    "rights_note" VARCHAR(600),
    "expires_at" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "chohan_media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chohan_site_configs_tenant_id_key" ON "chohan_site_configs"("tenant_id");
CREATE UNIQUE INDEX "chohan_content_revisions_config_id_revision_key" ON "chohan_content_revisions"("config_id", "revision");
CREATE INDEX "chohan_content_revisions_tenant_id_status_created_at_idx" ON "chohan_content_revisions"("tenant_id", "status", "created_at");
CREATE INDEX "chohan_site_configs_status_idx" ON "chohan_site_configs"("status");
CREATE INDEX "chohan_gallery_items_tenant_id_status_sort_order_idx" ON "chohan_gallery_items"("tenant_id", "status", "sort_order");
CREATE INDEX "chohan_company_events_tenant_id_status_starts_at_idx" ON "chohan_company_events"("tenant_id", "status", "starts_at");
CREATE INDEX "chohan_media_assets_tenant_id_status_created_at_idx" ON "chohan_media_assets"("tenant_id", "status", "created_at");

ALTER TABLE "chohan_site_configs" ADD CONSTRAINT "chohan_site_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_site_configs" ADD CONSTRAINT "chohan_site_configs_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chohan_content_revisions" ADD CONSTRAINT "chohan_content_revisions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_content_revisions" ADD CONSTRAINT "chohan_content_revisions_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "chohan_site_configs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_content_revisions" ADD CONSTRAINT "chohan_content_revisions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_content_revisions" ADD CONSTRAINT "chohan_content_revisions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chohan_gallery_items" ADD CONSTRAINT "chohan_gallery_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_company_events" ADD CONSTRAINT "chohan_company_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_media_assets" ADD CONSTRAINT "chohan_media_assets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chohan_media_assets" ADD CONSTRAINT "chohan_media_assets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
