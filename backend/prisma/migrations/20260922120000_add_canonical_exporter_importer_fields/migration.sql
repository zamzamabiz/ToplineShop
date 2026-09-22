-- Migration: add_canonical_exporter_importer_fields
-- Adds explicit exporter/importer/port/data_source columns to tdr_records.
-- All columns are nullable — existing records keep NULL; new-format mappings populate them.
-- Old local_party/foreign_party columns are retained for backward compatibility.

ALTER TABLE "tdr_records"
  ADD COLUMN "exporter_id_raw"             TEXT,
  ADD COLUMN "exporter_name_raw"           TEXT,
  ADD COLUMN "exporter_name_normalized"    TEXT,
  ADD COLUMN "exporter_address_raw"        TEXT,
  ADD COLUMN "exporter_country_raw"        TEXT,
  ADD COLUMN "exporter_country_code"       CHAR(2),
  ADD COLUMN "importer_id_raw"             TEXT,
  ADD COLUMN "importer_name_raw"           TEXT,
  ADD COLUMN "importer_name_normalized"    TEXT,
  ADD COLUMN "importer_address_raw"        TEXT,
  ADD COLUMN "importer_country_raw"        TEXT,
  ADD COLUMN "importer_country_code"       CHAR(2),
  ADD COLUMN "port_of_loading_raw"         TEXT,
  ADD COLUMN "port_of_loading_normalized"  TEXT,
  ADD COLUMN "port_of_discharge_raw"       TEXT,
  ADD COLUMN "port_of_discharge_normalized" TEXT,
  ADD COLUMN "data_source_raw"             TEXT;

-- Indexes for analytics on exporter/importer country
CREATE INDEX "tdr_records_tenant_exporter_country_date_idx"
  ON "tdr_records" ("tenant_id", "exporter_country_code", "trade_date");

CREATE INDEX "tdr_records_tenant_importer_country_date_idx"
  ON "tdr_records" ("tenant_id", "importer_country_code", "trade_date");
