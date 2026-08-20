-- ============================================================
-- MANUAL FIX: Add missing columns for M-002 Port/Berth
-- Run this directly in pgAdmin/DBeaver on vmd_csdl_v2_dev
-- Safe to run multiple times (all idempotent)
-- ============================================================

BEGIN;

-- 1. Add port_status to ports
ALTER TABLE ports ADD COLUMN IF NOT EXISTS port_status SMALLINT NOT NULL DEFAULT 0;

-- Migrate existing data from old columns (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ports' AND column_name='approval_status') THEN
        UPDATE ports SET port_status = CASE
            WHEN approval_status = 1 THEN 2
            WHEN approval_status = 2 THEN 3
            WHEN operational_status = 0 THEN 4
            WHEN approval_status = 0 AND operational_status = 1 THEN 1
            ELSE 0
        END WHERE deleted_at IS NULL AND port_status = 0;
    END IF;
END $$;

-- 2. Add managing_unit_id and notes to ports
ALTER TABLE ports ADD COLUMN IF NOT EXISTS managing_unit_id UUID;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS notes VARCHAR(2000);

-- 3. Add port_status to berths
ALTER TABLE berths ADD COLUMN IF NOT EXISTS port_status SMALLINT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='berths' AND column_name='approval_status') THEN
        UPDATE berths SET port_status = CASE
            WHEN approval_status = 1 THEN 2
            WHEN approval_status = 2 THEN 3
            WHEN operational_status = 0 THEN 4
            WHEN approval_status = 0 AND operational_status = 1 THEN 1
            ELSE 0
        END WHERE deleted_at IS NULL AND port_status = 0;
    END IF;
END $$;

-- 4. Create sub-tables
CREATE TABLE IF NOT EXISTS port_coordinates (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id),
    latitude DECIMAL(9,6) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(9,6) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_coordinates PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_coordinates_port_id ON port_coordinates(port_id);

CREATE TABLE IF NOT EXISTS port_infrastructures (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id),
    sequence_number INTEGER NOT NULL,
    infrastructure_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_infrastructures PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_infrastructures_port_id ON port_infrastructures(port_id);

CREATE TABLE IF NOT EXISTS port_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    port_id UUID NOT NULL REFERENCES ports(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    uploaded_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_attachments PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_attachments_port_id ON port_attachments(port_id);

-- 5. Clean Flyway history so next restart doesn't skip these migrations
DELETE FROM flyway_schema_history WHERE version IN ('100', '101');

COMMIT;

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='ports' AND column_name='port_status';
