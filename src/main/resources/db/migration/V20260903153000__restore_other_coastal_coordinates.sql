-- Khôi phục cột tọa độ cho các đài thông tin duyên hải còn lại
-- Tương tự như V20260903143000, do V82 đã xóa các cột này khỏi database
-- nhưng code Java vẫn đang map @Column dẫn tới lỗi SQLState 42703 khi search.

ALTER TABLE public.coastal_station_inmarsat
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_lrit
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_haiphong
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
