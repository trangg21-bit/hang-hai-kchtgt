-- V44: Drop coefficient column from org_units (dead code — no business logic consumes it)

-- 1. Drop the check constraint (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_org_unit_coefficient_positive'
    ) THEN
        ALTER TABLE org_units DROP CONSTRAINT chk_org_unit_coefficient_positive;
    END IF;
END $$;

-- 2. Drop the column
ALTER TABLE org_units DROP COLUMN IF EXISTS coefficient;
