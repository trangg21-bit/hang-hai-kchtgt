-- ==============================================================================
-- Migration: Fix gis_spatial_objects geometry_type = 0 to 1 (POINT)
-- Timestamp: 20260903201500
-- GisGeometryType enum: POINT(1), LINE(2), POLYGON(3)
-- Legacy seeders and migrations inserted 0 for POINT.
-- ==============================================================================

UPDATE public.gis_spatial_objects
SET geometry_type = 1
WHERE geometry_type = 0;
