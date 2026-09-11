-- V20260911133500: Optimize AIS system performance indexes
-- Provide full indexes for sorting, filtering, code pattern ops, and unaccent trigram keyword search.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ais_system') THEN
        -- 1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
        CREATE INDEX IF NOT EXISTS idx_ais_system_created_at_desc
            ON public.ais_system (created_at DESC);

        -- 2. B-Tree index on updated_at DESC (supports sorting and date-range filtering)
        CREATE INDEX IF NOT EXISTS idx_ais_system_updated_at_desc
            ON public.ais_system (updated_at DESC);

        -- 3. B-Tree index on condition_status for operational status filter and options lookup
        CREATE INDEX IF NOT EXISTS idx_ais_system_condition_status
            ON public.ais_system (condition_status);

        -- 4. B-Tree index on commissioning_year for sidebar filtering
        CREATE INDEX IF NOT EXISTS idx_ais_system_commissioning_year
            ON public.ais_system (commissioning_year);

        -- 5. Pattern-ops index on code to accelerate prefix match and MAX(code) generation
        CREATE INDEX IF NOT EXISTS idx_ais_system_code_pattern
            ON public.ais_system (code text_pattern_ops);

        -- 6. Full GIN Trigram indexes using immutable_unaccent for keyword search across all tabs
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
            CREATE INDEX IF NOT EXISTS idx_ais_system_name_unaccent_trgm
                ON public.ais_system USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_ais_system_code_unaccent_trgm
                ON public.ais_system USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_ais_system_model_unaccent_trgm
                ON public.ais_system USING gin (public.immutable_unaccent(LOWER(model)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_ais_system_manufacturer_unaccent_trgm
                ON public.ais_system USING gin (public.immutable_unaccent(LOWER(manufacturer)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_ais_system_location_unaccent_trgm
                ON public.ais_system USING gin (public.immutable_unaccent(LOWER(detailed_location)) gin_trgm_ops);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping index creation on ais_system: %', SQLERRM;
END $$;
