-- Ensure VTS enum columns use the ordinal SMALLINT representation expected by JPA.
-- This migration is idempotent because some environments already applied the
-- equivalent schema change under an older migration number.
DO $$
DECLARE
    column_type TEXT;
    schema_name TEXT := current_schema();
BEGIN
    IF to_regclass('vts_system') IS NULL THEN
        RETURN;
    END IF;

    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = schema_name
      AND table_name = 'vts_system'
      AND column_name = 'condition_status';

    IF column_type IN ('character varying', 'text') THEN
        ALTER TABLE vts_system ALTER COLUMN condition_status DROP DEFAULT;
        ALTER TABLE vts_system
            ALTER COLUMN condition_status TYPE SMALLINT
            USING CASE UPPER(TRIM(condition_status::text))
                WHEN 'GOOD' THEN 0
                WHEN 'TOT' THEN 0
                WHEN 'TỐT' THEN 0
                WHEN 'OPERATIONAL' THEN 0
                WHEN 'DEGRADED' THEN 1
                WHEN 'XUONG_CAP' THEN 1
                WHEN 'XUỐNG CẤP' THEN 1
                WHEN 'DAMAGED' THEN 2
                WHEN 'HU_HONG' THEN 2
                WHEN 'HƯ HỎNG' THEN 2
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                ELSE 0
            END::SMALLINT;
    END IF;

    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = schema_name
      AND table_name = 'vts_system'
      AND column_name = 'approval_status';

    IF column_type IN ('character varying', 'text') THEN
        ALTER TABLE vts_system ALTER COLUMN approval_status DROP DEFAULT;
        ALTER TABLE vts_system
            ALTER COLUMN approval_status TYPE SMALLINT
            USING CASE UPPER(TRIM(approval_status::text))
                WHEN 'PROPOSED' THEN 0
                WHEN 'UNDER_REVIEW' THEN 1
                WHEN 'APPROVED' THEN 2
                WHEN 'REJECTED' THEN 3
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                ELSE 0
            END::SMALLINT;
    END IF;
END $$;
