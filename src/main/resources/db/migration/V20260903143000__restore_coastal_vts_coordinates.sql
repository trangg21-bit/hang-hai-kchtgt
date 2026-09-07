-- coastal_station_vts vẫn ánh xạ latitude/longitude trong entity và các luồng
-- CRUD, nhưng V82 đã xóa hai cột này khi chuyển tọa độ sang kho GIS tập trung.
-- Khi tra cứu KCHT với loại "Tất cả", Hibernate chọn đủ cột entity và làm toàn
-- bộ API lỗi SQLState 42703 trước khi có thể trả danh sách.

ALTER TABLE public.coastal_station_vts
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
