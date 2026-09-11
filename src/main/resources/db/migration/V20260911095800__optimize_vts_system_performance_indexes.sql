-- V20260911095800: Optimize VTS system performance indexes
-- Provide full (non-partial) indexes so queries on 'All' (approval_status IS NULL)
-- and 'Archived' (deleted_at IS NOT NULL) utilize index scans instead of sequential table scans.

-- 1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
CREATE INDEX IF NOT EXISTS idx_vts_system_created_at_all
    ON public.vts_system (created_at DESC);

-- 2. B-Tree indexes on port_id and province_id for fast sidebar filtering
CREATE INDEX IF NOT EXISTS idx_vts_system_port_id
    ON public.vts_system (port_id);

CREATE INDEX IF NOT EXISTS idx_vts_system_province_id
    ON public.vts_system (province_id);

-- 3. Pattern-ops index on code to accelerate prefix match and MAX(code) generation
CREATE INDEX IF NOT EXISTS idx_vts_system_code_pattern
    ON public.vts_system (code text_pattern_ops);

-- 4. Full GIN Trigram indexes using immutable_unaccent for keyword search across all tabs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        CREATE INDEX IF NOT EXISTS idx_vts_system_name_unaccent_trgm_all
            ON public.vts_system USING gin (public.immutable_unaccent(LOWER(system_name)) gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_vts_system_code_unaccent_trgm_all
            ON public.vts_system USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_vts_system_address_unaccent_trgm_all
            ON public.vts_system USING gin (public.immutable_unaccent(LOWER(address)) gin_trgm_ops);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping full unaccent trigram indexes: %', SQLERRM;
END $$;

-- 5. Composite index on vts_zone for fast duplicate code validation and system lookup
CREATE INDEX IF NOT EXISTS idx_vts_zone_system_code
    ON public.vts_zone (vts_system_id, LOWER(code));

