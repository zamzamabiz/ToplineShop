-- Migration: add_record_quality_metadata
-- Adds per-record quality metadata columns to tdr_records:
--   data_source_normalized  — normalized alias for data_source_raw (e.g. Pak_Customs → Pakistan Customs)
--   missing_fields          — JSON array of required field names that were blank
--   missing_fields_count    — cardinality of missing_fields array (0 when none)
--   data_quality_status     — READY | INCOMPLETE | REVIEW_REQUIRED | ERROR
--   confidence_score        — HIGH | MEDIUM | LOW | UNKNOWN
-- All columns are backward-compatible: existing rows receive safe defaults.

ALTER TABLE "tdr_records"
  ADD COLUMN "data_source_normalized"  TEXT,
  ADD COLUMN "missing_fields"          JSONB,
  ADD COLUMN "missing_fields_count"    INTEGER    NOT NULL DEFAULT 0,
  ADD COLUMN "data_quality_status"     VARCHAR(20) NOT NULL DEFAULT 'READY',
  ADD COLUMN "confidence_score"        VARCHAR(10) NOT NULL DEFAULT 'UNKNOWN';
