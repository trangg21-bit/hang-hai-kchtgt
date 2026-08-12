ALTER TABLE vts_system DROP COLUMN IF EXISTS location;
ALTER TABLE vts_system DROP COLUMN IF EXISTS province;
ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS province_id INTEGER;
ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS owning_org_id UUID;
ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS operating_org_id UUID;
ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS port_id UUID;

CREATE TABLE IF NOT EXISTS vts_zone (
    id UUID PRIMARY KEY,
    vts_system_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    condition_status SMALLINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    CONSTRAINT fk_vts_zone_system FOREIGN KEY (vts_system_id) REFERENCES vts_system(id)
);

ALTER TABLE vts_zone ADD COLUMN IF NOT EXISTS deleted_by UUID;
