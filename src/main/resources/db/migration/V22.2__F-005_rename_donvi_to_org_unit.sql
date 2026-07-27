-- F-005: Rename don_vi column to org_unit in access_logs (for existing DBs that have don_vi).
ALTER TABLE access_logs RENAME COLUMN don_vi TO org_unit;
ALTER INDEX IF EXISTS idx_donvi_createdat RENAME TO idx_orgunit_createdat;
