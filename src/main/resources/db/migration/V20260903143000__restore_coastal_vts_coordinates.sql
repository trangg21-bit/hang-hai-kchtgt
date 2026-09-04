-- coastal_station_vts van anh xa latitude/longitude trong entity va cac luong
-- CRUD, nhung V82 da xoa hai cot nay khi chuyen toa do sang kho GIS tap trung.
-- Khi tra cuu KCHT voi loai Tat ca, Hibernate chon du cot entity va lam toan
-- bo API loi SQLState 42703 truoc khi co the tra danh sach.

ALTER TABLE public.coastal_station_vts
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
