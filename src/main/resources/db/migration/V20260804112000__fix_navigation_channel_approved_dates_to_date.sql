-- V20260804112000: Alter approved_date_level1 and approved_date_level2 to DATE for navigation_channel
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;
END $$;
