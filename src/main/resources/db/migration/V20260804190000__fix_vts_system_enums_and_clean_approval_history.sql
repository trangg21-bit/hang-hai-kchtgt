-- V20260804190000: Convert vts_system and other infrastructure status columns to SMALLINT and drop legacy columns from approval_history

DO $$
DECLARE
    tbl_name TEXT;
    tbls TEXT[] := ARRAY[
        'vts_system', 'radar_station', 'ship_repair_facility', 'navigation_channel', 'dike_revetment',
        'buoy_station', 'lighthouse_station', 'coastal_station_cospas_sarsat', 'coastal_station_haiphong',
        'coastal_station_inmarsat', 'coastal_station_lrit', 'coastal_station_vts', 'beacon_light', 'buoy',
        'berth', 'pier', 'ports', 'dry_ports', 'water_zones'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tbls
    LOOP
        -- approval_status -> SMALLINT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name 
              AND column_name = 'approval_status' AND data_type IN ('character varying', 'text', 'varchar')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN approval_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN approval_status TYPE SMALLINT USING (
                    CASE
                        WHEN approval_status::text = ''PROPOSED'' THEN 0
                        WHEN approval_status::text = ''APPROVED_LEVEL_1'' THEN 1
                        WHEN approval_status::text = ''APPROVED'' THEN 2
                        WHEN approval_status::text = ''REJECTED_LEVEL_1'' THEN 3
                        WHEN approval_status::text = ''REJECTED_LEVEL_2'' THEN 4
                        WHEN approval_status::text = ''REJECTED'' THEN 5
                        WHEN approval_status::text = ''REQUEST_CHANGE'' THEN 6
                        WHEN approval_status::text = ''DRAFT'' THEN 7
                        WHEN approval_status::text ~ ''^[0-9]+$'' AND approval_status::text::bigint <= 32767 THEN approval_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;

        -- condition_status -> SMALLINT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name 
              AND column_name = 'condition_status' AND data_type IN ('character varying', 'text', 'varchar')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN condition_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN condition_status TYPE SMALLINT USING (
                    CASE
                        WHEN condition_status::text = ''GOOD'' THEN 0
                        WHEN condition_status::text = ''WARNING'' THEN 1
                        WHEN condition_status::text = ''DAMAGE'' THEN 2
                        WHEN condition_status::text = ''DEGRADED'' THEN 3
                        WHEN condition_status::text = ''UNDER_MAINTENANCE'' THEN 4
                        WHEN condition_status::text = ''REPAIRED'' THEN 5
                        WHEN condition_status::text = ''PENDING_REPAIR'' THEN 6
                        WHEN condition_status::text ~ ''^[0-9]+$'' AND condition_status::text::bigint <= 32767 THEN condition_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;

        -- operational_status -> SMALLINT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = tbl_name 
              AND column_name = 'operational_status' AND data_type IN ('character varying', 'text', 'varchar')
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN operational_status DROP DEFAULT', tbl_name);
            EXECUTE format('
                ALTER TABLE public.%I ALTER COLUMN operational_status TYPE SMALLINT USING (
                    CASE
                        WHEN operational_status::text = ''OPERATIONAL'' OR operational_status::text = ''ACTIVE'' THEN 0
                        WHEN operational_status::text = ''NON_OPERATIONAL'' OR operational_status::text = ''INACTIVE'' THEN 1
                        WHEN operational_status::text = ''UNDER_MAINTENANCE'' THEN 2
                        WHEN operational_status::text ~ ''^[0-9]+$'' AND operational_status::text::bigint <= 32767 THEN operational_status::text::smallint
                        ELSE 0
                    END
                )
            ', tbl_name);
        END IF;
    END LOOP;

    -- Ensure ref_id and ref_type exist on approval_history and populate them from legacy columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approval_history') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ref_id') THEN
            ALTER TABLE public.approval_history ADD COLUMN ref_id UUID;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ref_type') THEN
            ALTER TABLE public.approval_history ADD COLUMN ref_type SMALLINT;
        END IF;

        -- Copy legacy FK data to ref_id / ref_type (InfrastructureType ordinals)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'luong_hang_hai_id') THEN
            UPDATE public.approval_history SET ref_id = luong_hang_hai_id, ref_type = 6 WHERE luong_hang_hai_id IS NOT NULL AND ref_id IS NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'navigation_channel_id') THEN
            UPDATE public.approval_history SET ref_id = navigation_channel_id, ref_type = 6 WHERE navigation_channel_id IS NOT NULL AND ref_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'co_sua_chua_id') THEN
            UPDATE public.approval_history SET ref_id = co_sua_chua_id, ref_type = 7 WHERE co_sua_chua_id IS NOT NULL AND ref_id IS NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ship_repair_facility_id') THEN
            UPDATE public.approval_history SET ref_id = ship_repair_facility_id, ref_type = 7 WHERE ship_repair_facility_id IS NOT NULL AND ref_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'tram_radar_id') THEN
            UPDATE public.approval_history SET ref_id = tram_radar_id, ref_type = 12 WHERE tram_radar_id IS NOT NULL AND ref_id IS NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'radar_station_id') THEN
            UPDATE public.approval_history SET ref_id = radar_station_id, ref_type = 12 WHERE radar_station_id IS NOT NULL AND ref_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'he_thong_vts_id') THEN
            UPDATE public.approval_history SET ref_id = he_thong_vts_id, ref_type = 10 WHERE he_thong_vts_id IS NOT NULL AND ref_id IS NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'vts_system_id') THEN
            UPDATE public.approval_history SET ref_id = vts_system_id, ref_type = 10 WHERE vts_system_id IS NOT NULL AND ref_id IS NULL;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'de_ke_id') THEN
            UPDATE public.approval_history SET ref_id = de_ke_id, ref_type = 5 WHERE de_ke_id IS NOT NULL AND ref_id IS NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'dike_revetment_id') THEN
            UPDATE public.approval_history SET ref_id = dike_revetment_id, ref_type = 5 WHERE dike_revetment_id IS NOT NULL AND ref_id IS NULL;
        END IF;

        -- Convert status column to SMALLINT in approval_history
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'approval_history' 
              AND column_name = 'status' AND data_type IN ('character varying', 'text', 'varchar')
        ) THEN
            ALTER TABLE public.approval_history ALTER COLUMN status DROP DEFAULT;
            ALTER TABLE public.approval_history ALTER COLUMN status TYPE SMALLINT USING (
                CASE
                    WHEN status::text = 'CREATED' THEN 0
                    WHEN status::text = 'PROPOSED' THEN 1
                    WHEN status::text = 'UNDER_REVIEW' THEN 2
                    WHEN status::text = 'APPROVED' THEN 3
                    WHEN status::text = 'REJECTED' THEN 4
                    WHEN status::text = 'UPDATED' THEN 5
                    WHEN status::text = 'DELETED' THEN 6
                    WHEN status::text = 'ATTACHMENT_UPLOADED' THEN 7
                    WHEN status::text = 'ATTACHMENT_DELETED' THEN 8
                    WHEN status::text ~ '^[0-9]+$' AND status::text::bigint <= 32767 THEN status::text::smallint
                    ELSE 0
                END
            );
        END IF;

        -- Drop legacy extra columns from approval_history
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS luong_hang_hai_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS co_sua_chua_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS tram_radar_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS he_thong_vts_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS de_ke_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS vts_system_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS radar_station_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS ship_repair_facility_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS navigation_channel_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS dike_revetment_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS buoy_station_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS lighthouse_station_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS coastal_station_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS beacon_light_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS buoy_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS berth_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS port_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS result;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS approver;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS approved_level_1;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS approved_level_2;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS target_id;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS target_type;
        ALTER TABLE public.approval_history DROP COLUMN IF EXISTS action;
    END IF;
END $$;
