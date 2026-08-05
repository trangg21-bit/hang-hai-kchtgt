-- Convert approval_status to INTEGER (int4) for all infrastructure entities matching ApprovalStatusConverter
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE public.berths ALTER COLUMN approval_status TYPE INTEGER USING approval_status::integer;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
