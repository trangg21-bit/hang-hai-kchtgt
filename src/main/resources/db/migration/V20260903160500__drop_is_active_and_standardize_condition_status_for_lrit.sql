-- V20260903160500: Drop is_active and standardize condition_status for coastal_station_lrit

-- 1. Xóa cột thừa is_active khỏi bảng coastal_station_lrit
ALTER TABLE public.coastal_station_lrit DROP COLUMN IF EXISTS is_active;

-- 2. Đảm bảo cột condition_status là SMALLINT (0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE, 3=UNDER_CONSTRUCTION)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'coastal_station_lrit' 
          AND column_name = 'condition_status' 
          AND data_type IN ('character varying', 'text', 'character')
    ) THEN
        ALTER TABLE public.coastal_station_lrit 
            ALTER COLUMN condition_status TYPE SMALLINT 
            USING (
                CASE 
                    WHEN condition_status = 'OPERATIONAL' THEN 0
                    WHEN condition_status = 'STOPPED' OR condition_status = 'NOT_OPERATIONAL' THEN 1
                    WHEN condition_status = 'MAINTENANCE' THEN 2
                    WHEN condition_status = 'UNDER_CONSTRUCTION' THEN 3
                    WHEN condition_status ~ '^[0-9]+$' THEN condition_status::SMALLINT
                    ELSE 0
                END
            );
    END IF;

    -- Backfill dữ liệu nếu còn NULL
    UPDATE public.coastal_station_lrit 
    SET condition_status = 0 
    WHERE condition_status IS NULL;
END $$;
