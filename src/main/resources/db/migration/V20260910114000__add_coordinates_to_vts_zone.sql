-- ==============================================================================
-- Migration: Add GIS coordinates and spatial reference to vts_zone table
-- Timestamp: 20260910114000
-- ==============================================================================

ALTER TABLE public.vts_zone ADD COLUMN IF NOT EXISTS geometry_type SMALLINT;
ALTER TABLE public.vts_zone ADD COLUMN IF NOT EXISTS coordinates TEXT;
ALTER TABLE public.vts_zone ADD COLUMN IF NOT EXISTS spatial_id UUID;

COMMENT ON COLUMN public.vts_zone.geometry_type IS 'Loại đối tượng hình học GIS: 1 (POINT), 2 (LINE), 3 (POLYGON)';
COMMENT ON COLUMN public.vts_zone.coordinates IS 'Tọa độ hình học dạng chuỗi chuẩn WKT';
COMMENT ON COLUMN public.vts_zone.spatial_id IS 'Khóa ngoại liên kết tới bảng gis_spatial_objects (nếu có)';
