-- Convert tower_height, light_height, area, station_area in beacon_light to NUMERIC(24, 4)
-- to support up to 20 integer digits or 16 integer digits + 4 decimal digits without precision loss or overflow.
ALTER TABLE beacon_light
    ALTER COLUMN tower_height TYPE NUMERIC(24, 4),
    ALTER COLUMN light_height TYPE NUMERIC(24, 4),
    ALTER COLUMN area TYPE NUMERIC(24, 4),
    ALTER COLUMN station_area TYPE NUMERIC(24, 4);
