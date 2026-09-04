-- V20260903162000: Drop redundant columns (station_name, station_code, unit_id) for coastal_station_lrit

DO $$
BEGIN
    -- 1. Đảm bảo dữ liệu từ các cột phụ được cập nhật đầy đủ sang cột chuẩn nếu còn NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'station_name'
    ) THEN
        UPDATE public.coastal_station_lrit 
        SET name = station_name 
        WHERE name IS NULL AND station_name IS NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'station_code'
    ) THEN
        UPDATE public.coastal_station_lrit 
        SET code = station_code 
        WHERE code IS NULL AND station_code IS NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'unit_id'
    ) THEN
        UPDATE public.coastal_station_lrit 
        SET org_unit_id = unit_id 
        WHERE org_unit_id IS NULL AND unit_id IS NOT NULL;
    END IF;

    -- 2. Xóa bỏ 3 cột dư thừa khỏi bảng coastal_station_lrit
    ALTER TABLE public.coastal_station_lrit 
        DROP COLUMN IF EXISTS station_name,
        DROP COLUMN IF EXISTS station_code,
        DROP COLUMN IF EXISTS unit_id;
END $$;
