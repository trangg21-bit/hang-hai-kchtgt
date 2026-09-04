-- coastal_station_vts v?n ánh x? latitude/longitude trong entity và các lu?ng
-- CRUD, nhung V82 dã xóa hai c?t này khi chuy?n t?a d? sang kho GIS t?p trung.
-- Khi tra c?u KCHT v?i lo?i "T?t c?", Hibernate ch?n d? c?t entity và làm toàn
-- b? API l?i SQLState 42703 tru?c khi có th? tr? danh sách.

ALTER TABLE public.coastal_station_vts
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
