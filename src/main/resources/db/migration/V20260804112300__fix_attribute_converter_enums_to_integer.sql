-- V20260804112300: Convert approval_status to INTEGER for entities using AttributeConverter
DO $$
BEGIN
    -- dike_revetment
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment' AND column_name = 'approval_status' AND udt_name != 'int4') THEN
        ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE INTEGER USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer ELSE 0 END;
    END IF;

    -- navigation_channel
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'approval_status' AND udt_name != 'int4') THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE INTEGER USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer ELSE 0 END;
    END IF;

    -- radar_station
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station' AND column_name = 'approval_status' AND udt_name != 'int4') THEN
        ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE INTEGER USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer ELSE 0 END;
    END IF;

    -- ship_repair_facility
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility' AND column_name = 'approval_status' AND udt_name != 'int4') THEN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE INTEGER USING CASE WHEN approval_status IS NULL OR approval_status::text = '' THEN 0 WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer ELSE 0 END;
    END IF;
END $$;
