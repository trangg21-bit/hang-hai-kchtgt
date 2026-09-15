-- V20260915160000__make_gis_spatial_objects_code_unique_active_only.sql
-- Drop full unique constraint on gis_spatial_objects.code that prevented re-adding location coordinates to soft-deleted entities
ALTER TABLE public.gis_spatial_objects DROP CONSTRAINT IF EXISTS gis_spatial_objects_code_key;

-- Re-create unique index only on active (non-deleted) records
DROP INDEX IF EXISTS public.uk_gis_spatial_objects_code_active;
CREATE UNIQUE INDEX uk_gis_spatial_objects_code_active ON public.gis_spatial_objects (code) WHERE deleted_at IS NULL;
