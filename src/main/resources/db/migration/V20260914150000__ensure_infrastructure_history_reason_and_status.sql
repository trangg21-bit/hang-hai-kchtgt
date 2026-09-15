-- Migration: Ensure reason column exists, status is VARCHAR(32), and changed_field is VARCHAR(1000)
-- Version: V20260914150000

ALTER TABLE public.infrastructure_history ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.infrastructure_history ADD COLUMN IF NOT EXISTS approval_level VARCHAR(32);
ALTER TABLE public.infrastructure_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Convert status to VARCHAR(32) if it is integer/smallint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'infrastructure_history'
          AND column_name = 'status'
          AND data_type IN ('integer', 'smallint')
    ) THEN
        ALTER TABLE public.infrastructure_history ALTER COLUMN status TYPE VARCHAR(32) USING status::text;
    END IF;
END $$;

-- Widen changed_field to VARCHAR(1000) if it is smaller
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'infrastructure_history'
          AND column_name = 'changed_field'
          AND (character_maximum_length IS NULL OR character_maximum_length < 1000)
    ) THEN
        ALTER TABLE public.infrastructure_history ALTER COLUMN changed_field TYPE VARCHAR(1000);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_infra_history_ref ON public.infrastructure_history(ref_type, ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_ref_id_date ON public.infrastructure_history(ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_infra_history_approved_by ON public.infrastructure_history(approved_by);
