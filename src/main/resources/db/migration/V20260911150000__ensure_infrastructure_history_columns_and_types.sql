-- Ensure infrastructure_history table and all required columns exist with standard types

CREATE TABLE IF NOT EXISTS infrastructure_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id UUID NOT NULL,
    ref_type VARCHAR(64) NOT NULL,
    approval_level VARCHAR(32),
    status VARCHAR(32) NOT NULL,
    approved_by UUID,
    approved_date TIMESTAMP,
    reason TEXT,
    changed_field VARCHAR(1000),
    previous_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS approval_level VARCHAR(32);
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS changed_field VARCHAR(1000);
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS previous_value TEXT;
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS new_value TEXT;
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE IF EXISTS infrastructure_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'infrastructure_history' AND column_name = 'ref_type'
               AND data_type <> 'character varying') THEN
    ALTER TABLE infrastructure_history ALTER COLUMN ref_type TYPE VARCHAR(64) USING ref_type::text;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'infrastructure_history' AND column_name = 'status'
               AND data_type <> 'character varying') THEN
    ALTER TABLE infrastructure_history ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_infra_history_ref ON infrastructure_history(ref_type, ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_ref_id_date ON infrastructure_history(ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_approved_by ON infrastructure_history(approved_by);
