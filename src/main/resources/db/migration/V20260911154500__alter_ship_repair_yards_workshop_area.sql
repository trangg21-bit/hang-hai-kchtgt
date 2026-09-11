-- V20260911154500: Tang do chinh xac cot workshop_area cua ship_repair_yards len NUMERIC(28,4) dong bo voi Pier
ALTER TABLE ship_repair_yards ALTER COLUMN workshop_area TYPE NUMERIC(28, 4);

