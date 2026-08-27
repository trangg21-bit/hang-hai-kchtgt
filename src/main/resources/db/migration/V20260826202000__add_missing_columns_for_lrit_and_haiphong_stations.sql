-- V20260826202000: Add missing columns for coastal_station_lrit and coastal_station_haiphong

-- 1. coastal_station_lrit
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS station_code VARCHAR(50);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50) DEFAULT 'POINT';
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(50) DEFAULT 'WGS84';
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS imo_number VARCHAR(100);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS reporting_interval INTEGER;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_height DOUBLE PRECISION;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS power_output DOUBLE PRECISION;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_type VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS data_format VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS communication_channel VARCHAR(255);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS approval_level SMALLINT;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE coastal_station_lrit ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;

-- sync name & code for lrit
UPDATE coastal_station_lrit SET station_name = name WHERE station_name IS NULL AND name IS NOT NULL;
UPDATE coastal_station_lrit SET name = station_name WHERE name IS NULL AND station_name IS NOT NULL;
UPDATE coastal_station_lrit SET station_code = code WHERE station_code IS NULL AND code IS NOT NULL;
UPDATE coastal_station_lrit SET code = station_code WHERE code IS NULL AND station_code IS NOT NULL;

-- 2. coastal_station_haiphong
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS station_code VARCHAR(50);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50) DEFAULT 'POINT';
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(50) DEFAULT 'WGS84';
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS port_name VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS ward VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS operational_license VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS license_expiry VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_phone VARCHAR(50);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS last_inspection_date VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS next_inspection_date VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS communication_frequency VARCHAR(255);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS approval_level SMALLINT;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE coastal_station_haiphong ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;

-- sync name & code for haiphong
UPDATE coastal_station_haiphong SET station_name = name WHERE station_name IS NULL AND name IS NOT NULL;
UPDATE coastal_station_haiphong SET name = station_name WHERE name IS NULL AND station_name IS NOT NULL;
UPDATE coastal_station_haiphong SET station_code = code WHERE station_code IS NULL AND code IS NOT NULL;
UPDATE coastal_station_haiphong SET code = station_code WHERE code IS NULL AND station_code IS NOT NULL;
