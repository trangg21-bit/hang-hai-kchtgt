-- Force convert approved_by to UUID for buoy_station and all station tables
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    BEGIN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
