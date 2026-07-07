-- V26: Change unit_id type from BIGINT/Long to UUID for alignment with org_units primary key
ALTER TABLE point_objects DROP COLUMN IF EXISTS unit_id;
ALTER TABLE point_objects ADD COLUMN unit_id UUID;

ALTER TABLE line_objects DROP COLUMN IF EXISTS unit_id;
ALTER TABLE line_objects ADD COLUMN unit_id UUID;

ALTER TABLE polygon_objects DROP COLUMN IF EXISTS unit_id;
ALTER TABLE polygon_objects ADD COLUMN unit_id UUID;

ALTER TABLE beacon_light DROP COLUMN IF EXISTS unit_id;
ALTER TABLE beacon_light ADD COLUMN unit_id UUID;

ALTER TABLE buoy DROP COLUMN IF EXISTS unit_id;
ALTER TABLE buoy ADD COLUMN unit_id UUID;

ALTER TABLE nha_tram_phao DROP COLUMN IF EXISTS unit_id;
ALTER TABLE nha_tram_phao ADD COLUMN unit_id UUID;

ALTER TABLE nha_tram_den DROP COLUMN IF EXISTS unit_id;
ALTER TABLE nha_tram_den ADD COLUMN unit_id UUID;

ALTER TABLE coastal_station_vts DROP COLUMN IF EXISTS unit_id;
ALTER TABLE coastal_station_vts ADD COLUMN unit_id UUID;

ALTER TABLE coastal_station_lrit DROP COLUMN IF EXISTS unit_id;
ALTER TABLE coastal_station_lrit ADD COLUMN unit_id UUID;

ALTER TABLE coastal_station_inmarsat DROP COLUMN IF EXISTS unit_id;
ALTER TABLE coastal_station_inmarsat ADD COLUMN unit_id UUID;

ALTER TABLE coastal_station_haiphong DROP COLUMN IF EXISTS unit_id;
ALTER TABLE coastal_station_haiphong ADD COLUMN unit_id UUID;

ALTER TABLE coastal_station_cospas_sarsat DROP COLUMN IF EXISTS unit_id;
ALTER TABLE coastal_station_cospas_sarsat ADD COLUMN unit_id UUID;
