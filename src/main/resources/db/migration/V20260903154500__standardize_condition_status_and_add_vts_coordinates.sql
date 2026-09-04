-- V20260903153000: Bổ sung tọa độ latitude/longitude cho coastal_station_vts và chuẩn hóa condition_status

-- 1. Bổ sung 2 cột latitude/longitude cho bảng coastal_station_vts (đã có trong Java entity nhưng thiếu trong schema sau V82)
ALTER TABLE public.coastal_station_vts
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

-- Backfill tọa độ POINT từ kho GIS tập trung (gis_spatial_objects) khi bản ghi có spatial_id hoặc ref_id
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
    WHERE spatial.coordinates IS NOT NULL
)
UPDATE public.coastal_station_vts station
SET longitude = COALESCE(station.longitude, point_coordinates.coordinate_parts[1]::NUMERIC(10, 6)),
    latitude = COALESCE(station.latitude, point_coordinates.coordinate_parts[2]::NUMERIC(10, 6))
FROM point_coordinates
WHERE point_coordinates.coordinate_parts IS NOT NULL
  AND (station.spatial_id = point_coordinates.id OR station.id = point_coordinates.ref_id)
  AND (station.longitude IS NULL OR station.latitude IS NULL);

-- 2. Chuẩn hóa dữ liệu condition_status: chuyển 'NOT_OPERATIONAL' về mã chuẩn 'STOPPED' (chỉ chạy khi cột còn là kiểu chuỗi)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coastal_station_inmarsat' 
          AND column_name = 'condition_status' 
          AND data_type IN ('character varying', 'text', 'character')
    ) THEN
        UPDATE public.coastal_station_inmarsat
        SET condition_status = 'STOPPED'
        WHERE condition_status = 'NOT_OPERATIONAL';
    END IF;
END $$;
