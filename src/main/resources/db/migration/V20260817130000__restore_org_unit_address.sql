-- Temporarily restore the legacy/general address column for compatibility.
-- province remains the integer province/city ID and detail_address remains the
-- detailed physical address field.
ALTER TABLE org_units ADD COLUMN IF NOT EXISTS address VARCHAR(500);
