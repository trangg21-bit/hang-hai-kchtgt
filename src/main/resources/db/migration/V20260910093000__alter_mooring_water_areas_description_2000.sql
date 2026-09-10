-- Migration: Tăng độ dài trường description trong bảng mooring_water_areas lên VARCHAR(2000)
ALTER TABLE mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
ALTER TABLE IF EXISTS storm_shelter_mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
ALTER TABLE IF EXISTS transfer_area_mooring_water_areas ALTER COLUMN description TYPE VARCHAR(2000);
