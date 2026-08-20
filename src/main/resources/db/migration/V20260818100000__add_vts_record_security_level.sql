ALTER TABLE vts_system
    ADD COLUMN IF NOT EXISTS security_level SMALLINT;

UPDATE vts_system
SET security_level = 0
WHERE security_level IS NULL;

ALTER TABLE vts_system
    ALTER COLUMN security_level SET DEFAULT 0;

ALTER TABLE vts_system
    ALTER COLUMN security_level SET NOT NULL;

ALTER TABLE vts_system
    DROP CONSTRAINT IF EXISTS ck_vts_system_security_level;

ALTER TABLE vts_system
    ADD CONSTRAINT ck_vts_system_security_level
    CHECK (security_level BETWEEN 0 AND 2);

CREATE INDEX IF NOT EXISTS idx_vts_system_org_security_active
    ON vts_system (org_unit_id, security_level)
    WHERE deleted_at IS NULL;
