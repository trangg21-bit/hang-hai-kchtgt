-- V20260804170000: Migrate approval_history to polymorphic ref_id / ref_type and status / approval_level / condition_status columns to SMALLINT
DO $$
BEGIN
    -- 1. Ensure ref_id column exists on approval_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ref_id') THEN
        ALTER TABLE public.approval_history ADD COLUMN ref_id UUID;
    END IF;

    -- 2. Ensure ref_type column exists on approval_history
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ref_type') THEN
        ALTER TABLE public.approval_history ADD COLUMN ref_type SMALLINT;
    END IF;

    -- 3. Populate ref_id and ref_type from legacy FK columns if present
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'vts_system_id') THEN
        UPDATE public.approval_history SET ref_id = vts_system_id, ref_type = 13 WHERE vts_system_id IS NOT NULL AND ref_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'radar_station_id') THEN
        UPDATE public.approval_history SET ref_id = radar_station_id, ref_type = 15 WHERE radar_station_id IS NOT NULL AND ref_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'navigation_channel_id') THEN
        UPDATE public.approval_history SET ref_id = navigation_channel_id, ref_type = 9 WHERE navigation_channel_id IS NOT NULL AND ref_id IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'ship_repair_facility_id') THEN
        UPDATE public.approval_history SET ref_id = ship_repair_facility_id, ref_type = 10 WHERE ship_repair_facility_id IS NOT NULL AND ref_id IS NULL;
    END IF;

    -- 4. Convert status in approval_history to SMALLINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'approval_history' 
          AND column_name = 'status' AND data_type IN ('character varying', 'text', 'varchar')
    ) THEN
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
                WHEN status::text ~ '^[0-9]+$' THEN status::text::smallint
                ELSE 0
            END
        );
    END IF;

    -- 5. Convert approval_level in approval_history to SMALLINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'approval_history' 
          AND column_name = 'approval_level' AND data_type IN ('character varying', 'text', 'varchar')
    ) THEN
        ALTER TABLE public.approval_history ALTER COLUMN approval_level TYPE SMALLINT USING (
            CASE
                WHEN approval_level::text = 'PROPOSED' OR approval_level::text = 'LEVEL_1' THEN 1
                WHEN approval_level::text = 'UNDER_REVIEW' OR approval_level::text = 'LEVEL_2' THEN 2
                WHEN approval_level::text = 'APPROVED' THEN 3
                WHEN approval_level::text ~ '^[0-9]+$' THEN approval_level::text::smallint
                ELSE 0
            END
        );
    END IF;

    -- 6. Convert vts_system.approval_status to SMALLINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'vts_system' 
          AND column_name = 'approval_status' AND data_type IN ('character varying', 'text', 'varchar')
    ) THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING (
            CASE
                WHEN approval_status::text = 'PROPOSED' THEN 0
                WHEN approval_status::text = 'UNDER_REVIEW' THEN 1
                WHEN approval_status::text = 'APPROVED' THEN 2
                WHEN approval_status::text = 'REJECTED' THEN 3
                WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::text::smallint
                ELSE 0
            END
        );
    END IF;

    -- 7. Convert vts_system.condition_status to SMALLINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'vts_system' 
          AND column_name = 'condition_status' AND data_type IN ('character varying', 'text', 'varchar')
    ) THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING (
            CASE
                WHEN condition_status::text = 'GOOD' THEN 0
                WHEN condition_status::text = 'DEGRADED' THEN 1
                WHEN condition_status::text = 'DAMAGED' THEN 2
                WHEN condition_status::text ~ '^[0-9]+$' THEN condition_status::text::smallint
                ELSE 0
            END
        );
    END IF;
END $$;

-- 8. Drop legacy unused table he_thong_vts
DROP TABLE IF EXISTS public.he_thong_vts CASCADE;
