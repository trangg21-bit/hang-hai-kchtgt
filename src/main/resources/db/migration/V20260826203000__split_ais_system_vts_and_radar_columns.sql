-- ============================================================
-- Migration: Split ais_system vts_operation_center_id and radar_station_id columns
-- Format: VYYYYMMDDHHmmss__description.sql
-- ============================================================

-- 1. Add radar_station_id column to ais_system
ALTER TABLE ais_system ADD COLUMN IF NOT EXISTS radar_station_id UUID;

-- 2. Make vts_operation_center_id nullable (since AIS can attach to either VTS Op Center OR Radar Station)
ALTER TABLE ais_system ALTER COLUMN vts_operation_center_id DROP NOT NULL;

-- 3. Data migration: if vts_operation_center_id points to a radar_station, move it to radar_station_id
UPDATE ais_system
SET radar_station_id = vts_operation_center_id,
    vts_operation_center_id = NULL
WHERE vts_operation_center_id IS NOT NULL
  AND vts_operation_center_id IN (SELECT id FROM radar_station)
  AND vts_operation_center_id NOT IN (SELECT id FROM vts_operation_center);

-- 4. Create index for radar_station_id
CREATE INDEX IF NOT EXISTS idx_ais_system_radar_station ON ais_system(radar_station_id);
