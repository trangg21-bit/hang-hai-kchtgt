-- Migration: Align transfer area technical fields structure with anchorages (Module M-026)
-- Convert current_water_depth, design_water_depth, bottom_elevation_design, max_vessel_dwt to VARCHAR(20)
-- Widen area to NUMERIC(28, 4) to prevent numeric field overflow on max length inputs

ALTER TABLE transfer_areas ALTER COLUMN area TYPE NUMERIC(28, 4);
ALTER TABLE transfer_areas ALTER COLUMN design_water_depth TYPE VARCHAR(20) USING regexp_replace(design_water_depth::text, '\.0+$', '');
ALTER TABLE transfer_areas ALTER COLUMN current_water_depth TYPE VARCHAR(20) USING regexp_replace(current_water_depth::text, '\.0+$', '');
ALTER TABLE transfer_areas ALTER COLUMN bottom_elevation_design TYPE VARCHAR(20) USING regexp_replace(bottom_elevation_design::text, '\.0+$', '');
ALTER TABLE transfer_areas ALTER COLUMN max_vessel_dwt TYPE VARCHAR(20) USING regexp_replace(max_vessel_dwt::text, '\.0+$', '');
