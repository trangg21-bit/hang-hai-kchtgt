-- Migration: Widen numeric columns for buoy_berths to NUMERIC(28, 4)
-- Reference intake record: TRI-1788951150674-700b (Module M-026)

ALTER TABLE buoy_berths ALTER COLUMN current_water_depth TYPE NUMERIC(28, 4);
ALTER TABLE buoy_berths ALTER COLUMN bottom_elevation_design TYPE NUMERIC(28, 4);
ALTER TABLE buoy_berths ALTER COLUMN max_vessel_dwt TYPE NUMERIC(28, 4);
ALTER TABLE buoy_berths ALTER COLUMN planned_vessel_dwt TYPE NUMERIC(28, 4);
ALTER TABLE buoy_berths ALTER COLUMN design_capacity TYPE NUMERIC(28, 4);
ALTER TABLE buoy_berths ALTER COLUMN cargo_throughput TYPE NUMERIC(28, 4);
