-- Store org unit province/city as the integer ID from the shared provinces catalogue.
-- Existing textual values are converted where they can be matched safely; unmatched
-- legacy values become NULL instead of being written into an integer column.

ALTER TABLE org_units ADD COLUMN province_id_migration INTEGER;

UPDATE org_units ou
SET province_id_migration = p.id
FROM provinces p
WHERE lower(trim(regexp_replace(ou.province, '^(tp\.|tỉnh|thành phố)\s*', '', 'i')))
    = lower(trim(regexp_replace(p.name, '^(tỉnh|thành phố)\s*', '', 'i')));

UPDATE org_units
SET province_id_migration = CAST(trim(province) AS INTEGER)
WHERE province_id_migration IS NULL
  AND province ~ '^\s*[0-9]+\s*$';

-- The previous form incorrectly stored the selected province name in address.
-- Recover only rows where address is exactly a province label, then clear the
-- duplicated value because address is reserved for a physical address.
UPDATE org_units ou
SET province_id_migration = p.id
FROM provinces p
WHERE ou.province_id_migration IS NULL
  AND lower(trim(regexp_replace(ou.address, '^(tp\.|tỉnh|thành phố)\s*', '', 'i')))
      = lower(trim(regexp_replace(p.name, '^(tỉnh|thành phố)\s*', '', 'i')));

UPDATE org_units ou
SET address = NULL
FROM provinces p
WHERE ou.province_id_migration = p.id
  AND lower(trim(regexp_replace(ou.address, '^(tp\.|tỉnh|thành phố)\s*', '', 'i')))
      = lower(trim(regexp_replace(p.name, '^(tỉnh|thành phố)\s*', '', 'i')));

ALTER TABLE org_units DROP COLUMN province;
ALTER TABLE org_units RENAME COLUMN province_id_migration TO province;

ALTER TABLE org_units
    ADD CONSTRAINT fk_org_units_province
    FOREIGN KEY (province) REFERENCES provinces(id);

CREATE INDEX IF NOT EXISTS idx_org_units_province ON org_units (province);
