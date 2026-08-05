-- V20260804120000: Add missing columns + attachment sub-table for dry_ports
-- Follows Port entity naming conventions exactly

-- ============================================================================
-- 1. dry_ports — General info (9 new columns)
-- ============================================================================
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS operating_unit          VARCHAR(255);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS region                  VARCHAR(255);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS detailed_location       VARCHAR(500);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS transport_corridor      VARCHAR(255);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS warehouse_area          DECIMAL(15,2);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS yard_area               DECIMAL(15,2);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS connection_mode         VARCHAR(500);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS port_status             SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS remarks                 VARCHAR(1000);

-- ============================================================================
-- 2. dry_ports — Announcement (4 new columns)
-- ============================================================================
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS announcement_time               TIMESTAMP;
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS announcement_decision_number    VARCHAR(100);
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS announcement_decision_date      DATE;
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS announcement_org                VARCHAR(255);

-- ============================================================================
-- 3. dry_ports — GIS (2 columns, matching Port entity: coordinate_system INT, display_rule INT)
--    Coordinates + geometry_type are managed by gis_spatial_objects via spatial_id
-- ============================================================================
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS coordinate_system    INT;
ALTER TABLE dry_ports ADD COLUMN IF NOT EXISTS display_rule         INT;

-- ============================================================================
-- 4. dry_port_attachments — file uploads (matching port_attachments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dry_port_attachments (
    id              UUID         NOT NULL DEFAULT gen_random_uuid(),
    dry_port_id     UUID         NOT NULL REFERENCES dry_ports(id),
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       BIGINT       NOT NULL,
    content_type    VARCHAR(100),
    uploaded_by     UUID,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMP,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID,
    CONSTRAINT pk_dry_port_attachments PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_dry_port_attachments_port_id ON dry_port_attachments(dry_port_id);
