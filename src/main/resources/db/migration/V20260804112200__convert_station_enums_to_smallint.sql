-- V20260804112200: Convert approval_status and condition_status to SMALLINT for station entities
DO $$
BEGIN
    -- vts_system
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'condition_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING CASE WHEN condition_status IS NULL OR condition_status::text = '' THEN 0 WHEN condition_status::text ~ '^[0-9]+$' THEN condition_status::integer::smallint ELSE 0 END;
    END IF;

    -- navigation_channel
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;

    -- dike_revetment
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;

    -- radar_station
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;

    -- ship_repair_facility
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;

    -- buoy_station
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'status' AND udt_name != 'int2') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN status TYPE SMALLINT USING CASE WHEN status IS NULL OR status::text = '' THEN 0 WHEN status::text ~ '^[0-9]+$' THEN status::integer::smallint ELSE 0 END;
    END IF;

    -- lighthouse_station
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'status' AND udt_name != 'int2') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN status TYPE SMALLINT USING CASE WHEN status IS NULL OR status::text = '' THEN 0 WHEN status::text ~ '^[0-9]+$' THEN status::integer::smallint ELSE 0 END;
    END IF;
END $$;
