-- Khoi phuc cot toa do cho cac dai thong tin duyen hai con lai
-- Tuong tu nhu V20260903143000, do V82 da xoa cac cot nay khoi database
-- nhung code Java van dang map @Column dan toi loi SQLState 42703 khi search.

ALTER TABLE public.coastal_station_inmarsat
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_lrit
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.coastal_station_haiphong
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
