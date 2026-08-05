-- Migration: Refactor approval_history to polymorphic (ref_id UUID, ref_type INT/SMALLINT)
-- and convert status column to SMALLINT (integer ordinal)
-- Maps to InfrastructureType enum ordinals:
-- DIKE_REVETMENT = 5
-- NAVIGATION_CHANNEL = 6
-- SHIP_REPAIR_FACILITY = 7
-- VTS_SYSTEM = 10
-- RADAR_STATION = 12

-- 1. Add ref_id and ref_type to approval_history, drop NOT NULL on approved_by, and alter approved_date to TIMESTAMP
ALTER TABLE public.approval_history 
    ADD COLUMN IF NOT EXISTS ref_id UUID,
    ADD COLUMN IF NOT EXISTS ref_type SMALLINT;
ALTER TABLE public.approval_history 
    ALTER COLUMN approved_by DROP NOT NULL;
ALTER TABLE public.approval_history 
    ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;

-- 2. Migrate existing data in approval_history
UPDATE public.approval_history 
SET ref_id = vts_system_id, ref_type = 10 
WHERE vts_system_id IS NOT NULL AND ref_id IS NULL;

UPDATE public.approval_history 
SET ref_id = ship_repair_facility_id, ref_type = 7 
WHERE ship_repair_facility_id IS NOT NULL AND ref_id IS NULL;

UPDATE public.approval_history 
SET ref_id = radar_station_id, ref_type = 12 
WHERE radar_station_id IS NOT NULL AND ref_id IS NULL;

UPDATE public.approval_history 
SET ref_id = navigation_channel_id, ref_type = 6 
WHERE navigation_channel_id IS NOT NULL AND ref_id IS NULL;

-- 3. Convert status column from VARCHAR to SMALLINT if it's currently varchar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'approval_history' 
        AND column_name = 'status' AND data_type LIKE '%char%'
    ) THEN
        ALTER TABLE public.approval_history 
            ALTER COLUMN status TYPE SMALLINT 
            USING (
                CASE upper(trim(status))
                    WHEN 'CREATED' THEN 0
                    WHEN 'PROPOSED' THEN 1
                    WHEN 'UNDER_REVIEW' THEN 2
                    WHEN 'APPROVED' THEN 3
                    WHEN 'REJECTED' THEN 4
                    WHEN 'UPDATED' THEN 5
                    WHEN 'DELETED' THEN 6
                    WHEN 'ATTACHMENT_UPLOADED' THEN 7
                    WHEN 'ATTACHMENT_DELETED' THEN 8
                    ELSE CASE WHEN status ~ '^[0-9]+$' THEN status::smallint ELSE 0 END
                END
            );
    END IF;
END $$;

-- 4. Migrate data from dike_revetment_approval_history if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history') THEN
        INSERT INTO public.approval_history (
            id, ref_id, ref_type, approval_level, status, approved_by, approved_date, reason
        )
        SELECT 
            id, dike_revetment_id, 5, approval_level, 
            CASE upper(trim(status))
                WHEN 'CREATED' THEN 0
                WHEN 'PROPOSED' THEN 1
                WHEN 'UNDER_REVIEW' THEN 2
                WHEN 'APPROVED' THEN 3
                WHEN 'REJECTED' THEN 4
                WHEN 'UPDATED' THEN 5
                WHEN 'DELETED' THEN 6
                WHEN 'ATTACHMENT_UPLOADED' THEN 7
                WHEN 'ATTACHMENT_DELETED' THEN 8
                ELSE CASE WHEN status ~ '^[0-9]+$' THEN status::smallint ELSE 0 END
            END,
            CASE WHEN approver ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver::uuid ELSE NULL END, 
            approval_date::timestamp, reason
        FROM public.dike_revetment_approval_history
        ON CONFLICT (id) DO NOTHING;

        DROP TABLE public.dike_revetment_approval_history;
    END IF;
END $$;

-- 5. Drop legacy per-entity columns
ALTER TABLE public.approval_history 
    DROP COLUMN IF EXISTS vts_system_id,
    DROP COLUMN IF EXISTS ship_repair_facility_id,
    DROP COLUMN IF EXISTS radar_station_id,
    DROP COLUMN IF EXISTS navigation_channel_id;

-- 6. Create index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_approval_history_ref ON public.approval_history (ref_type, ref_id);
