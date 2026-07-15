-- Create indexes on status and geometry_type to optimize viewport/status query speed
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_status ON public.gis_spatial_objects (status);
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_geom_type ON public.gis_spatial_objects (geometry_type);
