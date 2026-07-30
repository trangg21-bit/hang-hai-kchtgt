-- V106__add_kcht_dashboard_indexes.sql
-- Optimize KCHT dashboard startup cache load and filtered queries

-- 1. Composite indexes for the 18 infrastructure tables
-- Tables with operational_status
CREATE INDEX IF NOT EXISTS idx_ports_dashboard ON ports (deleted_at, operational_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_berths_dashboard ON berths (deleted_at, operational_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_piers_dashboard ON piers (deleted_at, operational_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_dry_ports_dashboard ON dry_ports (deleted_at, operational_status, approval_status);

-- Tables with status
CREATE INDEX IF NOT EXISTS idx_beacon_light_dashboard ON beacon_light (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_buoy_dashboard ON buoy (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_navigation_channel_dashboard ON navigation_channel (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_dike_revetment_dashboard ON dike_revetment (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_lighthouse_station_dashboard ON lighthouse_station (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_buoy_station_dashboard ON buoy_station (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_vts_dashboard ON coastal_station_vts (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_dashboard ON coastal_station_lrit (deleted_at, status, approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_inmarsat_dashboard ON coastal_station_inmarsat (deleted_at, status, approval_status);

-- Tables with condition_status
CREATE INDEX IF NOT EXISTS idx_radar_station_dashboard ON radar_station (deleted_at, condition_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_vts_system_dashboard ON vts_system (deleted_at, condition_status, approval_status);
CREATE INDEX IF NOT EXISTS idx_ship_repair_facility_dashboard ON ship_repair_facility (deleted_at, condition_status, approval_status);

-- 2. Index for filtering spatial_id
CREATE INDEX IF NOT EXISTS idx_ports_spatial ON ports (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_berths_spatial ON berths (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_piers_spatial ON piers (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_dry_ports_spatial ON dry_ports (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_beacon_light_spatial ON beacon_light (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_buoy_spatial ON buoy (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_navigation_channel_spatial ON navigation_channel (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_dike_revetment_spatial ON dike_revetment (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_radar_station_spatial ON radar_station (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_vts_system_spatial ON vts_system (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_ship_repair_facility_spatial ON ship_repair_facility (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_lighthouse_station_spatial ON lighthouse_station (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_buoy_station_spatial ON buoy_station (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_vts_spatial ON coastal_station_vts (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_lrit_spatial ON coastal_station_lrit (deleted_at, spatial_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_inmarsat_spatial ON coastal_station_inmarsat (deleted_at, spatial_id);
