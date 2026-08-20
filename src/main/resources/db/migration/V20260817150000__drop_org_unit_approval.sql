-- TRI-1786950754582-5a51: remove org-unit approval flow.
-- Drops the approval-status column, approved_at, and the status index from org_units.
-- operational_status (Sử dụng/Không sử dụng) is KEPT.
DROP INDEX IF EXISTS idx_org_units_status;
ALTER TABLE org_units DROP COLUMN IF EXISTS status;
ALTER TABLE org_units DROP COLUMN IF EXISTS approved_at;
