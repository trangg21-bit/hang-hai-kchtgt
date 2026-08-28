-- Bổ sung hai cột GIS đã có trong entity/DTO nhưng bị thiếu trong schema thực tế.
-- Đây là nguyên nhân làm truy vấn KCHT "Tất cả" dừng tại LRIT với SQLState 42703.

ALTER TABLE public.coastal_station_lrit
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

ALTER TABLE public.coastal_station_haiphong
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

-- Backfill tọa độ POINT cũ từ kho GIS tập trung khi bản ghi có spatial_id/ref_id.
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
UPDATE public.coastal_station_lrit station
SET longitude = COALESCE(station.longitude, point.coordinate_parts[1]::NUMERIC(10, 6)),
    latitude = COALESCE(station.latitude, point.coordinate_parts[2]::NUMERIC(10, 6))
FROM point_coordinates point
WHERE point.coordinate_parts IS NOT NULL
  AND (station.spatial_id = point.id OR station.id = point.ref_id)
  AND (station.longitude IS NULL OR station.latitude IS NULL);

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
UPDATE public.coastal_station_haiphong station
SET longitude = COALESCE(station.longitude, point.coordinate_parts[1]::NUMERIC(10, 6)),
    latitude = COALESCE(station.latitude, point.coordinate_parts[2]::NUMERIC(10, 6))
FROM point_coordinates point
WHERE point.coordinate_parts IS NOT NULL
  AND (station.spatial_id = point.id OR station.id = point.ref_id)
  AND (station.longitude IS NULL OR station.latitude IS NULL);
