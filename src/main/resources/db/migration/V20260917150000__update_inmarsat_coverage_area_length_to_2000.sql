-- ==============================================================================
-- Migration: Update coastal_station_inmarsat coverage_area length to VARCHAR(2000)
-- Timestamp: 20260917150000
-- ==============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'coastal_station_inmarsat' 
          AND column_name = 'coverage_area'
    ) THEN
        ALTER TABLE public.coastal_station_inmarsat 
            ALTER COLUMN coverage_area TYPE VARCHAR(2000);
    END IF;
END $$;
