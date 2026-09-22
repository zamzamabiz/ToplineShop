-- Add standardized filename and data period fields to tdr_source_files
ALTER TABLE "tdr_source_files"
  ADD COLUMN "standardized_filename" TEXT,
  ADD COLUMN "data_period_year"      SMALLINT,
  ADD COLUMN "data_period_month"     SMALLINT;

-- Concurrent-safe sequence table for TDR_V1 filename numbering
CREATE TABLE "tdr_filename_sequences" (
  "tenant_id"    TEXT         NOT NULL,
  "trade_type"   VARCHAR(3)   NOT NULL,
  "period_year"  SMALLINT     NOT NULL,
  "period_month" SMALLINT     NOT NULL DEFAULT 0,
  "next_seq"     INTEGER      NOT NULL DEFAULT 1,
  PRIMARY KEY ("tenant_id", "trade_type", "period_year", "period_month")
);
