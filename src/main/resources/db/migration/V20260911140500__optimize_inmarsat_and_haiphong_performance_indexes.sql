-- V20260911140000: Optimize Inmarsat and Haiphong/Hanoi coastal station performance indexes
-- Provide full indexes for sorting, filtering, code pattern matching, and unaccent trigram keyword search.

-- ==============================================================================
-- 1. Performance Indexes for coastal_station_inmarsat
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat') THEN
        -- 1.1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
        CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_created_at_desc
            ON public.coastal_station_inmarsat (created_at DESC);

        -- 1.2. B-Tree index on updated_at DESC (supports sorting and date-range filtering)
        CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_updated_at_desc
            ON public.coastal_station_inmarsat (updated_at DESC);

        -- 1.3. Pattern-ops index on code to accelerate prefix match and code uniqueness checks
        CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_code_pattern
            ON public.coastal_station_inmarsat (code text_pattern_ops);

        -- 1.4. Full GIN Trigram indexes using immutable_unaccent for keyword search
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
            CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_name_unaccent_trgm
                ON public.coastal_station_inmarsat USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_code_unaccent_trgm
                ON public.coastal_station_inmarsat USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_addr_unaccent_trgm
                ON public.coastal_station_inmarsat USING gin (public.immutable_unaccent(LOWER(location_address)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_services_unaccent_trgm
                ON public.coastal_station_inmarsat USING gin (public.immutable_unaccent(LOWER(services)) gin_trgm_ops);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping trigram indexes on coastal_station_inmarsat: %', SQLERRM;
END $$;


-- ==============================================================================
-- 2. Performance Indexes for coastal_station_haiphong (Đài TTXLTT Hà Nội / Hải Phòng)
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong') THEN
        -- 2.1. Full B-Tree index on created_at DESC (supports default sorting across all status tabs)
        CREATE INDEX IF NOT EXISTS idx_cs_haiphong_created_at_desc
            ON public.coastal_station_haiphong (created_at DESC);

        -- 2.2. B-Tree index on updated_at DESC (supports sorting and date-range filtering)
        CREATE INDEX IF NOT EXISTS idx_cs_haiphong_updated_at_desc
            ON public.coastal_station_haiphong (updated_at DESC);

        -- 2.3. Pattern-ops index on code to accelerate prefix match and code uniqueness checks
        CREATE INDEX IF NOT EXISTS idx_cs_haiphong_code_pattern
            ON public.coastal_station_haiphong (code text_pattern_ops);

        -- 2.4. Full GIN Trigram indexes using immutable_unaccent for keyword search
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
            CREATE INDEX IF NOT EXISTS idx_cs_haiphong_name_unaccent_trgm
                ON public.coastal_station_haiphong USING gin (public.immutable_unaccent(LOWER(name)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_haiphong_code_unaccent_trgm
                ON public.coastal_station_haiphong USING gin (public.immutable_unaccent(LOWER(code)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_haiphong_location_unaccent_trgm
                ON public.coastal_station_haiphong USING gin (public.immutable_unaccent(LOWER(location_address)) gin_trgm_ops);

            CREATE INDEX IF NOT EXISTS idx_cs_haiphong_coverage_unaccent_trgm
                ON public.coastal_station_haiphong USING gin (public.immutable_unaccent(LOWER(coverage_area)) gin_trgm_ops);
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Skipping trigram indexes on coastal_station_haiphong: %', SQLERRM;
END $$;
