-- Convert all approver_level1, approver_level2, approved_by columns in infrastructure tables to UUID
DO $$
BEGIN
    -- dike_revetment
    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- navigation_channel
    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- vts_system
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- ship_repair_facility
    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- radar_station
    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- berths
    BEGIN
        ALTER TABLE public.berths ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.berths ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.berths ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
