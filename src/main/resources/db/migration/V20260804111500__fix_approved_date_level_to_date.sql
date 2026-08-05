-- V20260804111500: Revert approved_date_level1 and approved_date_level2 to DATE type
DO $$
BEGIN
    -- Fix approved_date_level1 and approved_date_level2 to DATE for all entities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level1' AND udt_name != 'date') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level1 TYPE DATE USING approved_date_level1::date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approved_date_level2' AND udt_name != 'date') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_date_level2 TYPE DATE USING approved_date_level2::date;
    END IF;
END $$;
