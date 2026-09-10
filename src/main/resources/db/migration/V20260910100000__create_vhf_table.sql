-- Migration tạo bảng vhf (Quản lý hệ thống thông tin liên lạc VHF)
-- Clone cấu trúc từ bảng cctv

CREATE TABLE IF NOT EXISTS vhf (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_code VARCHAR(200) NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    detailed_location VARCHAR(500),
    model VARCHAR(255),
    manufacturer VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    seaport_id UUID,
    org_unit_id UUID,
    operating_unit_id UUID,
    province_name VARCHAR(100),
    attached_infrastructure_type INTEGER,
    attached_infrastructure_id UUID,
    unit_of_measure INTEGER,
    year_of_use INTEGER,
    operational_status SMALLINT NOT NULL DEFAULT 1,
    specifications VARCHAR(2000),
    maintenance_information VARCHAR(2000),
    note VARCHAR(2000),
    object_type INTEGER,
    map_symbol_id UUID,
    coordinate_system INTEGER,
    display_rule INTEGER,
    spatial_id UUID,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    approver_level1 UUID,
    approved_date_level1 TIMESTAMP,
    approver_level2 UUID,
    approved_date_level2 TIMESTAMP,
    rejection_reason VARCHAR(500),
    submitted_date TIMESTAMP,
    submitted_by UUID,
    approval_content_level1 VARCHAR(500),
    approval_content_level2 VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_vhf_device_code UNIQUE (device_code)
);

CREATE INDEX IF NOT EXISTS idx_vhf_org_unit ON vhf(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vhf_seaport_id ON vhf(seaport_id);
CREATE INDEX IF NOT EXISTS idx_vhf_operational_status ON vhf(operational_status);
CREATE INDEX IF NOT EXISTS idx_vhf_approval_status ON vhf(approval_status);
CREATE INDEX IF NOT EXISTS idx_vhf_deleted_at ON vhf(deleted_at);
CREATE INDEX IF NOT EXISTS idx_vhf_spatial_id ON vhf(spatial_id);
