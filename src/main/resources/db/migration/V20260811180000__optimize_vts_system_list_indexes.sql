-- Optimize the VTS list endpoint.
-- The endpoint always excludes soft-deleted rows and sorts by created_at DESC.
-- These partial indexes avoid carrying deleted rows and match the optional filters.

CREATE INDEX IF NOT EXISTS idx_vts_system_active_created_at
    ON public.vts_system (created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_org_created_at
    ON public.vts_system (org_unit_id, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_approval_created_at
    ON public.vts_system (approval_status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_condition_created_at
    ON public.vts_system (condition_status, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_vts_system_active_org_condition_approval
    ON public.vts_system (org_unit_id, condition_status, approval_status)
    WHERE deleted_at IS NULL;

-- The keyword filter uses LOWER(column) LIKE '%keyword%'. B-tree indexes cannot
-- accelerate a leading wildcard; use trigram indexes when pg_trgm is available.
DO $$
BEGIN
    BEGIN
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pg_trgm extension is unavailable; skipping VTS keyword indexes';
    END;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS idx_vts_system_active_name_trgm
            ON public.vts_system USING gin (LOWER(system_name) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_vts_system_active_code_trgm
            ON public.vts_system USING gin (LOWER(code) gin_trgm_ops)
            WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_vts_system_active_address_trgm
            ON public.vts_system USING gin (LOWER(address) gin_trgm_ops)
            WHERE deleted_at IS NULL;
    END IF;
END $$;
