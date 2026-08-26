-- V20260825150000: Fix VTS system code unique constraint to support soft-delete
DO $$
BEGIN
    -- Drop old table-wide constraints if exist
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vts_system_code_key'
    ) THEN
        ALTER TABLE public.vts_system DROP CONSTRAINT vts_system_code_key;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_vts_system_code'
    ) THEN
        ALTER TABLE public.vts_system DROP CONSTRAINT uk_vts_system_code;
    END IF;

    -- Create partial unique index on active (non-deleted) records only
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vts_system_code_active_unique'
    ) THEN
        CREATE UNIQUE INDEX idx_vts_system_code_active_unique
        ON public.vts_system (LOWER(code))
        WHERE deleted_at IS NULL;
    END IF;
END $$;
