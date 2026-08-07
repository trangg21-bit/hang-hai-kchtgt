-- V80: Remove QUARANTINE (value 2) from water_zone_type and renumber
-- Existing records with water_zone_type = 2 are set to NULL (no documentary basis for a correct type)
-- Then shift: 3→2, 4→3, 5→4, 6→5, 7→6

UPDATE water_zones SET water_zone_type = NULL WHERE water_zone_type = 2;
UPDATE water_zones SET water_zone_type = 2 WHERE water_zone_type = 3;
UPDATE water_zones SET water_zone_type = 3 WHERE water_zone_type = 4;
UPDATE water_zones SET water_zone_type = 4 WHERE water_zone_type = 5;
UPDATE water_zones SET water_zone_type = 5 WHERE water_zone_type = 6;
UPDATE water_zones SET water_zone_type = 6 WHERE water_zone_type = 7;
