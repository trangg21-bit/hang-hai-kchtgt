-- Convert length, height, crest_elevation in dike_revetment to NUMERIC(24, 4)
-- and tower_height in radar_station to NUMERIC(24, 4)
-- to support up to 20 integer digits (or 16 integer + 4 decimal digits) without precision loss or overflow.

ALTER TABLE dike_revetment
    ALTER COLUMN length TYPE NUMERIC(24, 4),
    ALTER COLUMN height TYPE NUMERIC(24, 4),
    ALTER COLUMN crest_elevation TYPE NUMERIC(24, 4);

ALTER TABLE radar_station
    ALTER COLUMN tower_height TYPE NUMERIC(24, 4);
