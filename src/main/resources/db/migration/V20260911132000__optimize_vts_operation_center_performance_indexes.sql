-- V20260911132000: Optimize VTS operation center performance indexes
-- Provide full indexes for sorting, filtering, code pattern ops, and unaccent trigram keyword search.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vts_operation_center') THEN
        -- 1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
        CREATE INDEX IF NOT EXISTS idx_vts_op_center_created_at_desc
            ON public.vts_operation_center (created_at DESC);

        -- 2. B-Tree index on updated_at DESC (supports sorting and date-range filtering)
        CREATE INDEX IF NOT EXISTS idx_vts_op_center_updated_at_desc
            ON public.vts_operation_center (updated_at DESC);

        -- 3. B-Tree index on port_id for fast sidebar filtering
        CREATE INDEX IF NOT EXISTS idx_vts_op_center_port_id
            ON public.vts_operation_center (port_id);

        -- 4. B-Tree index on condition_status for operational filter and options lookup
        CREATE INDEX IF NOT EXISTS idx_vts_op_center_condition_status
            ON public.vts_operation_center (condition_status);

        -- 5. Pattern-ops index on code to accelerate prefix match and MAX(code) generation
        CREATE INDEX IF NOT EXISTS idx_vts_op_center_code_pattern
            ON public.vts_operation_center (code text_pattern_ops);

        -- 6. Full GIN Trigram indexes using immutable_unaccent for keyword search across all tabs
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
            CREATE INDEX IF NOT EXISTS idx_vts_op_center_name_unaccent_trgm
                ON public.vts_operation_center USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_vts_op_center_code_unaccent_trgm
                ON public.vts_operation_center USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_vts_op_center_location_unaccent_trgm
                ON public.vts_operation_center USING gin (public.immutable_unaccent(LOWER(detailed_location)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_vts_op_center_coverage_unaccent_trgm
                ON public.vts_operation_center USING gin (public.immutable_unaccent(LOWER(coverage)) gin_trgm_ops);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping index creation on vts_operation_center: %', SQLERRM;
END $$;
