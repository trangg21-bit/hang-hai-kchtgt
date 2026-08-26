-- V20260822160000: Drop legacy GIS columns from vts_operation_center (coordinates are unified in gis_spatial_objects)
ALTER TABLE public.vts_operation_center DROP COLUMN IF EXISTS geometry_type;
ALTER TABLE public.vts_operation_center DROP COLUMN IF EXISTS coordinates;
ALTER TABLE public.vts_operation_center DROP COLUMN IF EXISTS coordinate_system;
ALTER TABLE public.vts_operation_center DROP COLUMN IF EXISTS display_rule;
ALTER TABLE public.vts_operation_center DROP COLUMN IF EXISTS symbol_id;
