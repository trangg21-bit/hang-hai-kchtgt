-- V48: Add trigram search indexes and ref_id index to optimize search performance in gis_spatial_objects

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN Trigram indexes for LIKE text searching
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_name_trgm ON public.gis_spatial_objects USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_code_trgm ON public.gis_spatial_objects USING gin (code gin_trgm_ops);

-- Create BTREE index on ref_id to optimize freehand / KCHT-linked separation queries
CREATE INDEX IF NOT EXISTS idx_gis_spatial_objects_ref_id ON public.gis_spatial_objects (ref_id);
