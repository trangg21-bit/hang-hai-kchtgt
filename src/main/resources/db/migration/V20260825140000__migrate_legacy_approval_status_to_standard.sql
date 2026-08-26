-- Migration: Standardize all legacy approval_status (1 -> 2, 4 -> 5, 6 -> 8)
-- 1 (PROPOSED) -> 2 (PENDING_APPROVAL)
-- 4 (APPROVED_LEVEL2) -> 5 (APPROVED)
-- 6 (REJECTED) -> 8 (REJECTED_LEVEL1)

-- 1. vts_system
UPDATE vts_system SET approval_status = 2 WHERE approval_status = 1;
UPDATE vts_system SET approval_status = 5 WHERE approval_status = 4;
UPDATE vts_system SET approval_status = 8 WHERE approval_status = 6;

-- 2. ais_system
UPDATE ais_system SET approval_status = 2 WHERE approval_status = 1;
UPDATE ais_system SET approval_status = 5 WHERE approval_status = 4;
UPDATE ais_system SET approval_status = 8 WHERE approval_status = 6;

-- 3. vts_operation_center
UPDATE vts_operation_center SET approval_status = 2 WHERE approval_status = 1;
UPDATE vts_operation_center SET approval_status = 5 WHERE approval_status = 4;
UPDATE vts_operation_center SET approval_status = 8 WHERE approval_status = 6;

-- 4. ship_repair_facility
UPDATE ship_repair_facility SET approval_status = 2 WHERE approval_status = 1;
UPDATE ship_repair_facility SET approval_status = 5 WHERE approval_status = 4;
UPDATE ship_repair_facility SET approval_status = 8 WHERE approval_status = 6;

-- 5. radar_station
UPDATE radar_station SET approval_status = 2 WHERE approval_status = 1;
UPDATE radar_station SET approval_status = 5 WHERE approval_status = 4;
UPDATE radar_station SET approval_status = 8 WHERE approval_status = 6;

-- 6. coastal_station_vts
UPDATE coastal_station_vts SET approval_status = 2 WHERE approval_status = 1;
UPDATE coastal_station_vts SET approval_status = 5 WHERE approval_status = 4;
UPDATE coastal_station_vts SET approval_status = 8 WHERE approval_status = 6;

-- 7. coastal_station_lrit
UPDATE coastal_station_lrit SET approval_status = 2 WHERE approval_status = 1;
UPDATE coastal_station_lrit SET approval_status = 5 WHERE approval_status = 4;
UPDATE coastal_station_lrit SET approval_status = 8 WHERE approval_status = 6;

-- 8. coastal_station_haiphong
UPDATE coastal_station_haiphong SET approval_status = 2 WHERE approval_status = 1;
UPDATE coastal_station_haiphong SET approval_status = 5 WHERE approval_status = 4;
UPDATE coastal_station_haiphong SET approval_status = 8 WHERE approval_status = 6;

-- 9. coastal_station_cospas_sarsat
UPDATE coastal_station_cospas_sarsat SET approval_status = 2 WHERE approval_status = 1;
UPDATE coastal_station_cospas_sarsat SET approval_status = 5 WHERE approval_status = 4;
UPDATE coastal_station_cospas_sarsat SET approval_status = 8 WHERE approval_status = 6;

-- 10. coastal_station_inmarsat
UPDATE coastal_station_inmarsat SET approval_status = 2 WHERE approval_status = 1;
UPDATE coastal_station_inmarsat SET approval_status = 5 WHERE approval_status = 4;
UPDATE coastal_station_inmarsat SET approval_status = 8 WHERE approval_status = 6;

-- 11. buoy_station
UPDATE buoy_station SET approval_status = 2 WHERE approval_status = 1;
UPDATE buoy_station SET approval_status = 5 WHERE approval_status = 4;
UPDATE buoy_station SET approval_status = 8 WHERE approval_status = 6;
