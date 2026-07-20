-- Add indexes to gis_spatial_objects table to optimize search and spatial queries
CREATE INDEX IF NOT EXISTS idx_gis_spatial_ref_id_type ON public.gis_spatial_objects(ref_id, ref_type);
CREATE INDEX IF NOT EXISTS idx_gis_spatial_ref_id ON public.gis_spatial_objects(ref_id);
