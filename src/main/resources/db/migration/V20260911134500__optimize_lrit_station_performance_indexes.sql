-- V20260911134500: Optimize LRIT coastal station performance indexes
-- Provide comprehensive indexes for sorting, filtering, code pattern matching, and unaccent trigram keyword search.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit') THEN
        -- 1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_created_at_desc
            ON public.coastal_station_lrit (created_at DESC);

        -- 2. B-Tree index on updated_at DESC (supports sorting and date-range filtering)
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_updated_at_desc
            ON public.coastal_station_lrit (updated_at DESC);

        -- 3. B-Tree index on org_unit_id for DataScope filtering
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_org_unit_id
            ON public.coastal_station_lrit (org_unit_id);

        -- 4. B-Tree index on operating_org_id for sidebar management filter
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_operating_org_id
            ON public.coastal_station_lrit (operating_org_id);

        -- 5. B-Tree index on province_id for sidebar location filter
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_province_id
            ON public.coastal_station_lrit (province_id);

        -- 6. B-Tree index on condition_status for operational status filter and options lookup
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_condition_status
            ON public.coastal_station_lrit (condition_status);

        -- 7. B-Tree index on terminal_id for specific LRIT equipment filter
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_terminal_id
            ON public.coastal_station_lrit (terminal_id);

        -- 8. Pattern-ops index on code to accelerate prefix match and code uniqueness checks
        CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_code_pattern
            ON public.coastal_station_lrit (code text_pattern_ops);

        -- 9. Full GIN Trigram indexes using immutable_unaccent for keyword search across all tabs
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
            CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_name_unaccent_trgm
                ON public.coastal_station_lrit USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_code_unaccent_trgm
                ON public.coastal_station_lrit USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_location_unaccent_trgm
                ON public.coastal_station_lrit USING gin (public.immutable_unaccent(LOWER(location_address)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_services_unaccent_trgm
                ON public.coastal_station_lrit USING gin (public.immutable_unaccent(LOWER(services_provided)) gin_trgm_ops);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping index creation on coastal_station_lrit: %', SQLERRM;
END $$;
