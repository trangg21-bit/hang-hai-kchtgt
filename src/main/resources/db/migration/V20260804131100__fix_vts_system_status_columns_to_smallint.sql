-- Convert vts_system condition_status and approval_status columns to SMALLINT to match EnumType.ORDINAL in VtsSystem.java
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'condition_status' AND data_type = 'character varying') THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING (CASE WHEN condition_status = 'OPERATIONAL' THEN 0 WHEN condition_status = 'UNDER_REPAIR' THEN 1 WHEN condition_status = 'DEGRADED' THEN 2 WHEN condition_status = 'INACTIVE' THEN 3 WHEN condition_status ~ '^[0-9]+$' THEN condition_status::smallint ELSE 0 END);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approval_status' AND data_type = 'character varying') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING (CASE WHEN approval_status = 'DRAFT' THEN 0 WHEN approval_status = 'PROPOSED' THEN 1 WHEN approval_status = 'UNDER_REVIEW' THEN 2 WHEN approval_status = 'APPROVED' THEN 3 WHEN approval_status = 'REJECTED' THEN 4 WHEN approval_status ~ '^[0-9]+$' THEN approval_status::smallint ELSE 0 END);
    END IF;
END $$;
