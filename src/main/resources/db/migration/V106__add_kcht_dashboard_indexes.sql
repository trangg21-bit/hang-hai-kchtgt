-- V106__add_kcht_dashboard_indexes.sql
-- Optimize KCHT dashboard startup cache load and filtered queries

-- 1. Composite indexes for the 18 infrastructure tables
CREATE INDEX IF NOT EXISTS idx_ports_dashboard ON ports (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_berths_dashboard ON berths (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_piers_dashboard ON piers (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_dry_ports_dashboard ON dry_ports (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_beacon_light_dashboard ON beacon_light (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_buoy_dashboard ON buoy (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_navigation_channel_dashboard ON navigation_channel (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_dike_revetment_dashboard ON dike_revetment (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_radar_station_dashboard ON radar_station (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_vts_system_dashboard ON vts_system (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_ship_repair_facility_dashboard ON ship_repair_facility (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_lighthouse_station_dashboard ON lighthouse_station (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_buoy_station_dashboard ON buoy_station (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_vts_dashboard ON coastal_station_vts (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_dashboard ON coastal_station_lrit (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_inmarsat_dashboard ON coastal_station_inmarsat (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_haiphong_dashboard ON coastal_station_haiphong (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_cospas_sarsat_dashboard ON coastal_station_cospas_sarsat (deleted_at, status, approval_status);

-- 2. Specific index for water zones (type + deleted_at)
CREATE INDEX IF NOT EXISTS idx_water_zones_dashboard ON water_zones (water_zone_type, deleted_at);

-- 3. Filter indexes for year/province queries
CREATE INDEX IF NOT EXISTS idx_ports_filter ON ports (province, created_at);
CREATE INDEX IF NOT EXISTS idx_dry_ports_filter ON dry_ports (province, created_at);
CREATE INDEX IF NOT EXISTS idx_ship_repair_facility_filter ON ship_repair_facility (province, created_at);
