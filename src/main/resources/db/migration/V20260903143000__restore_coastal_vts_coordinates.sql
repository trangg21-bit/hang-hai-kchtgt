-- coastal_station_vts vẫn ánh xạ latitude/longitude trong entity và các luồng
-- CRUD, nhưng V82 đã xóa hai cột này khi chuyển tọa độ sang kho GIS tập trung.
-- Khi tra cứu KCHT với loại "Tất cả", Hibernate chọn đủ cột entity và làm toàn
-- bộ API lỗi SQLState 42703 trước khi có thể trả danh sách.

ALTER TABLE public.coastal_station_vts
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Khôi phục giá trị hiển thị/CRUD từ POINT trong kho GIS khi có thể. Tọa độ GIS
-- tập trung vẫn là nguồn dùng để vẽ bản đồ; hai cột này giữ tương thích entity.
WITH point_coordinates AS (
    SELECT
        spatial.id,
        spatial.ref_id,
        regexp_match(
            spatial.coordinates,
            '^[[:space:]]*POINT[[:space:]]*[(][[:space:]]*([+-]?[0-9]+[.]?[0-9]*)[[:space:]]+([+-]?[0-9]+[.]?[0-9]*)[[:space:]]*[)]',
            'i'
        ) AS coordinate_parts
    FROM public.gis_spatial_objects spatial
    WHERE spatial.deleted_at IS NULL
      AND spatial.coordinates IS NOT NULL
)
UPDATE public.coastal_station_vts station
SET longitude = COALESCE(station.longitude, point.coordinate_parts[1]::DOUBLE PRECISION),
    latitude = COALESCE(station.latitude, point.coordinate_parts[2]::DOUBLE PRECISION)
FROM point_coordinates point
WHERE point.coordinate_parts IS NOT NULL
  AND (station.spatial_id = point.id OR station.id = point.ref_id)
  AND (station.longitude IS NULL OR station.latitude IS NULL);
