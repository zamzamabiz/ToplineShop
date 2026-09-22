-- Drop the old unique index that does not include trade_direction.
-- This prevents creating a second TDR_V1 row (EXPORT vs IMPORT) with the same
-- scopeKey+profileId+version because the direction was absent from the key.
DROP INDEX "tdr_schema_mappings_scope_key_profile_id_version_key";

-- Add the corrected unique constraint that includes trade_direction.
-- A mapping profile is uniquely identified by scope + name + version + direction.
CREATE UNIQUE INDEX "tdr_schema_mappings_scope_key_profile_id_version_trade_direction_key"
  ON "tdr_schema_mappings"("scope_key", "profile_id", "version", "trade_direction");
