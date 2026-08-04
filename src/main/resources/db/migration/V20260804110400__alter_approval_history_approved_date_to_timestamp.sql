-- V20260804110400: Alter schema types (approved_date -> TIMESTAMP, approved_by -> UUID)
DO $$
BEGIN
    -- 1. approval_history.approved_date -> TIMESTAMP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    END IF;

    -- 2. buoy_station.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 3. lighthouse_station.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 4. coastal_station_cospas_sarsat.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 5. coastal_station_vts.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 6. coastal_station_lrit.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 7. coastal_station_haiphong.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    -- 8. coastal_station_inmarsat.approved_by -> UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;
