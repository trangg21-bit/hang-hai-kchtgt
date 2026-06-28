-- V18: Add materialized path fields and indexes to org_units table (F-003)
-- Migration: Add path, level, scopeId, sortOrder, coefficient, approvedAt, description columns

ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS path VARCHAR(500) DEFAULT '';
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS level INT DEFAULT 0;
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS scope_id BIGINT DEFAULT 0;
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS coefficient NUMERIC(5,2);
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE IF EXISTS org_units ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing enum values if they still use old values
-- OrgUnitType: DEPARTMENT→CUC, DIVISION→CHI_CUC, TEAM→CANG_VU, STATION→TCT
-- OrgUnitStatus: ACTIVE→APPROVED, INACTIVE→DELETED, PENDING_APPROVAL→PENDING
-- Handle any rows that have the old enum values

-- Create indexes for materialized path performance
CREATE INDEX IF NOT EXISTS idx_org_units_path ON org_units(path);
CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_type_status ON org_units(unit_type, status);
CREATE INDEX IF NOT EXISTS idx_org_units_level ON org_units(level);

-- Add check constraint for coefficient > 0 (if supported by DB)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_org_unit_coefficient_positive'
    ) THEN
        ALTER TABLE org_units ADD CONSTRAINT chk_org_unit_coefficient_positive CHECK (coefficient IS NULL OR coefficient > 0);
    END IF;
END $$;

-- Backfill materialized path for existing rows (if any exist with no path)
-- This walks the adjacency tree to compute paths
DO $$
DECLARE
    root RECORD;
    child RECORD;
BEGIN
    -- Update root units (no parent)
    FOR root IN SELECT id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LOOP
        UPDATE org_units
        SET path = '/' || id::text || '/', level = 1, scope_id = 0
        WHERE id = root.id AND (path IS NULL OR path = '');
    END LOOP;

    -- Iteratively update children until no more rows need updating
    -- This is a simple iterative approach for max depth 3
    FOR child IN SELECT id, parent_id FROM org_units
        WHERE parent_id IS NOT NULL AND deleted_at IS NULL
        AND (path IS NULL OR path = '' OR level = 0)
    LOOP
        UPDATE org_units
        SET path = (SELECT path FROM org_units WHERE id = child.parent_id) || child.id::text || '/',
            level = (SELECT level FROM org_units WHERE id = child.parent_id) + 1,
            scope_id = (SELECT scope_id FROM org_units WHERE id = child.parent_id)
        WHERE id = child.id;
    END LOOP;
END $$;
