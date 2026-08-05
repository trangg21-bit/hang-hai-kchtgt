-- Convert approval_status and operational_status to SMALLINT for all infrastructure entities
DO $$
BEGIN
    -- 1. vts_system
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.vts_system ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 2. dike_revetment
    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.dike_revetment ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3. navigation_channel
    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.navigation_channel ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 4. ship_repair_facility
    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.ship_repair_facility ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 5. radar_station
    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.radar_station ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 6. berths
    BEGIN
        ALTER TABLE public.berths ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.berths ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 7. beacon_light
    BEGIN
        ALTER TABLE public.beacon_light ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.beacon_light ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 8. buoy_station
    BEGIN
        ALTER TABLE public.buoy_station ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE upper(trim(approval_status::text))
                WHEN 'CREATED' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'UNDER_REVIEW' THEN 2 WHEN 'APPROVED' THEN 3 WHEN 'REJECTED' THEN 4 WHEN 'UPDATED' THEN 5 WHEN 'DELETED' THEN 6 ELSE CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint ELSE 0 END END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN
        ALTER TABLE public.buoy_station ALTER COLUMN operational_status TYPE SMALLINT USING (
            CASE WHEN operational_status::text ~ '^[0-9]+$' THEN operational_status::text::smallint ELSE 0 END
        );
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
