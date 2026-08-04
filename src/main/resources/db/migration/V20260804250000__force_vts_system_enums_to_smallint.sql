-- V20260804250000: Ensure condition_status, approval_status, operational_status across all infrastructure tables are strictly SMALLINT

DO $$
DECLARE
    tbl_name TEXT;
    tbls TEXT[] := ARRAY[
        'vts_system', 'radar_station', 'ship_repair_facility', 'navigation_channel', 'dike_revetment',
        'buoy_station', 'lighthouse_station', 'coastal_station_cospas_sarsat', 'coastal_station_haiphong',
        'coastal_station_inmarsat', 'coastal_station_lrit', 'coastal_station_vts', 'beacon_light', 'buoy',
        'berth', 'pier', 'ports', 'dry_ports', 'water_zones', 'piers', 'gis_spatial_objects'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tbls
    LOOP
        -- approval_status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'approval_status' 
              AND data_type NOT IN ('smallint', 'integer')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN approval_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN approval_status TYPE SMALLINT USING (
                    CASE
                        WHEN approval_status::text = ''PROPOSED'' THEN 0
                        WHEN approval_status::text = ''UNDER_REVIEW'' OR approval_status::text = ''APPROVED_LEVEL_1'' THEN 1
                        WHEN approval_status::text = ''APPROVED'' THEN 2
                        WHEN approval_status::text = ''REJECTED'' OR approval_status::text = ''REJECTED_LEVEL_1'' OR approval_status::text = ''REJECTED_LEVEL_2'' THEN 3
                        WHEN approval_status::text = ''REQUEST_CHANGE'' THEN 4
                        WHEN approval_status::text = ''DRAFT'' THEN 5
                        WHEN approval_status::text ~ ''^[0-9]+$'' AND approval_status::text::bigint <= 32767 THEN approval_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;

        -- condition_status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'condition_status' 
              AND data_type NOT IN ('smallint', 'integer')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN condition_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN condition_status TYPE SMALLINT USING (
                    CASE
                        WHEN condition_status::text = ''GOOD'' THEN 0
                        WHEN condition_status::text = ''DEGRADED'' OR condition_status::text = ''WARNING'' THEN 1
                        WHEN condition_status::text = ''DAMAGED'' OR condition_status::text = ''DAMAGE'' THEN 2
                        WHEN condition_status::text = ''UNUSABLE'' THEN 3
                        WHEN condition_status::text = ''UNDER_MAINTENANCE'' THEN 4
                        WHEN condition_status::text ~ ''^[0-9]+$'' AND condition_status::text::bigint <= 32767 THEN condition_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;

        -- operational_status
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'operational_status' 
              AND data_type NOT IN ('smallint', 'integer')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN operational_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN operational_status TYPE SMALLINT USING (
                    CASE
                        WHEN operational_status::text = ''OPERATIONAL'' OR operational_status::text = ''ACTIVE'' THEN 0
                        WHEN operational_status::text = ''NON_OPERATIONAL'' OR operational_status::text = ''INACTIVE'' THEN 1
                        WHEN operational_status::text ~ ''^[0-9]+$'' AND operational_status::text::bigint <= 32767 THEN operational_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;
    END LOOP;
END $$;
