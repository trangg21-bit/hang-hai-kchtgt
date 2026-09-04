-- Khôi ph?c c?t t?a d? cho các dài thông tin duyên h?i còn l?i
-- Tuong t? nhu V20260903143000, do V82 dã xóa các c?t này kh?i database
-- nhung code Java v?n dang map @Column d?n t?i l?i SQLState 42703 khi search.

ALTER TABLE public.coastal_station_inmarsat
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_lrit
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_haiphong
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
