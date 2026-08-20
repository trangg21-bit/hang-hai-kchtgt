-- Drop unique constraint and column for org_units.code
ALTER TABLE org_units DROP CONSTRAINT IF EXISTS org_units_code_key;
DROP INDEX IF EXISTS idx_org_units_code;
DROP INDEX IF EXISTS org_units_code_key;
ALTER TABLE org_units DROP COLUMN IF EXISTS code;

-- Drop legacy address column (province ID and detail_address are retained)
ALTER TABLE org_units DROP COLUMN IF EXISTS address;
