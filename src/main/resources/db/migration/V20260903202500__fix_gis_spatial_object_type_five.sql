-- ==============================================================================
-- Migration: Fix gis_spatial_objects object_type = 5 to 14 (POINT_OTHER)
-- Timestamp: 20260903202500
-- GisSpatialObjectType: POINT_OTHER has value = 14 (ordinal = 5)
-- Legacy seeders and migrations inserted ordinal 5 instead of value 14.
-- ==============================================================================

UPDATE public.gis_spatial_objects
SET object_type = 14
WHERE object_type = 5;
