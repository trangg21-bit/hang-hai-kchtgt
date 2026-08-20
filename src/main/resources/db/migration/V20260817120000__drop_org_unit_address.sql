-- The province/city is stored as org_units.province (integer ID).
-- Keep only detail_address for the optional physical address.
ALTER TABLE org_units DROP COLUMN IF EXISTS address;
