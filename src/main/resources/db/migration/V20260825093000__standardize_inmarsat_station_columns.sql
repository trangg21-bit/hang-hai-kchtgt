-- ============================================================
-- Migration: Standardize coastal_station_inmarsat columns (M-004: F-098..F-103)
-- Format: VYYYYMMDDHHmmss__description.sql
-- Compatible with PostgreSQL and H2
-- ============================================================

CREATE TABLE IF NOT EXISTS coastal_station_inmarsat (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Basic Info Columns
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS device_code VARCHAR(50);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS description VARCHAR(1000);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS operating_org_id UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS province_id INTEGER;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS location_detail TEXT;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS condition_status VARCHAR(50);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Inmarsat Specific Columns
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS coverage_zone VARCHAR(1000);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS services VARCHAR(1000);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS frequency VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS modem_type VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS sar_code VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS satellite_system VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS contact_person VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(500);

-- GIS & Map Columns
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS object_type VARCHAR(50);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(50) DEFAULT 'WGS84';
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS display_rule VARCHAR(500);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6);
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS security_level SMALLINT DEFAULT 0;

-- 2-Level Approval Columns (M-1006 Standard)
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approval_status SMALLINT DEFAULT 0;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approval_level SMALLINT;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE coastal_station_inmarsat ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000);

-- Backfill org_unit_id if unit_id exists
UPDATE coastal_station_inmarsat SET org_unit_id = unit_id WHERE org_unit_id IS NULL AND unit_id IS NOT NULL;
UPDATE coastal_station_inmarsat SET unit_id = org_unit_id WHERE unit_id IS NULL AND org_unit_id IS NOT NULL;
UPDATE coastal_station_inmarsat SET name = station_name WHERE name IS NULL AND station_name IS NOT NULL;
UPDATE coastal_station_inmarsat SET code = device_code WHERE code IS NULL AND device_code IS NOT NULL;
UPDATE coastal_station_inmarsat SET condition_status = 'OPERATIONAL' WHERE condition_status IS NULL;
