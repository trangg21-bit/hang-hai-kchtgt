-- V20260819200000: Cập nhật bảng radar_station theo checklist M-003 Trạm radar
-- (F-056 Tạo mới / F-057 Cập nhật / F-060 Chi tiết / F-068 Danh sách)
-- Chỉ ADD COLUMN + backfill — non-destructive, không xóa/đổi kiểu cột hiện có.
-- Dialect: PostgreSQL (DO $$ / to_regclass / UUID / SMALLINT).

-- 1. Thêm các cột mới (nếu chưa tồn tại)
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS seaport_id UUID;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS vts_operation_center_id UUID;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS operating_unit_id UUID;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50);
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS quantity INTEGER;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS note VARCHAR(2000);

-- 2. Backfill mã radar cho các dòng cũ: 'RADAR-' + 4 số, theo thứ tự created_at
DO $$
DECLARE
    r RECORD;
    seq INT := 1;
BEGIN
    IF to_regclass('public.radar_station') IS NULL THEN
        RETURN;
    END IF;
    FOR r IN
        SELECT id
        FROM public.radar_station
        WHERE code IS NULL OR code = ''
        ORDER BY created_at ASC, id ASC
    LOOP
        UPDATE public.radar_station
        SET code = 'RADAR-' || LPAD(seq::text, 4, '0')
        WHERE id = r.id;
        seq := seq + 1;
    END LOOP;
END $$;

-- 3. NOT NULL + UNIQUE cho code
ALTER TABLE public.radar_station ALTER COLUMN code SET NOT NULL;

DO $$
BEGIN
    IF to_regclass('public.radar_station') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conname = 'uk_radar_station_code'
             AND conrelid = 'public.radar_station'::regclass
       ) THEN
        ALTER TABLE public.radar_station ADD CONSTRAINT uk_radar_station_code UNIQUE (code);
    END IF;
END $$;
