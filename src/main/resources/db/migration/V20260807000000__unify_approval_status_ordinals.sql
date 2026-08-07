-- Port family: old (DRAFT=0→0, PENDING=1→2, PORT_AUTHORITY=2→3, APPROVED=3→5, REJECTED=4→6)
UPDATE ports SET approval_status = CASE approval_status WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 6 ELSE approval_status END;
UPDATE berths SET approval_status = CASE approval_status WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 6 ELSE approval_status END;
UPDATE piers SET approval_status = CASE approval_status WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 6 ELSE approval_status END;
UPDATE dry_ports SET approval_status = CASE approval_status WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 6 ELSE approval_status END;
UPDATE water_zones SET approval_status = CASE approval_status WHEN 1 THEN 2 WHEN 2 THEN 3 WHEN 3 THEN 5 WHEN 4 THEN 6 ELSE approval_status END;

-- VTS/Radar/ShipRepair/NavChannel/Dike (PROPOSED=0→1, UNDER_REVIEW=1→2, APPROVED=2→5, REJECTED=3→6)
UPDATE vts_system SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE radar_station SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE ship_repair_facility SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE navigation_channel SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE dike_revetment SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 2 WHEN 2 THEN 5 WHEN 3 THEN 6 ELSE approval_status END;

-- GisSpatial approval_status: old (PENDING=0→1, APPROVED=1→5, REJECTED=2→6)
UPDATE gis_spatial_objects SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 5 WHEN 2 THEN 6 ELSE approval_status END;

-- Station family: old (PENDING=0→1, APPROVED_L1=1→3, APPROVED_L2=2→4, REJECTED=3→6)
UPDATE lighthouse_station SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_vts SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_lrit SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_inmarsat SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_haiphong SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_cospas_sarsat SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE buoy_station SET approval_status = CASE approval_status WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;

-- Station family: old (PENDING=0→1, APPROVED_L1=1→3, APPROVED_L2=2→4, REJECTED=3→6)
UPDATE lighthouse_station SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE buoy_station SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_vts SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_lrit SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_inmarsat SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_haiphong SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
UPDATE coastal_station_cospas_sarsat SET approval_status = CASE approval_status WHEN 0 THEN 1 WHEN 1 THEN 3 WHEN 2 THEN 4 WHEN 3 THEN 6 ELSE approval_status END;
