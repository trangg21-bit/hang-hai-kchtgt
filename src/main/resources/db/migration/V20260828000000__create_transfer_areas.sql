-- V: Create transfer_areas table for Khu chuyển tải (parity với anchorages)
CREATE TABLE IF NOT EXISTS transfer_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    transfer_area_code VARCHAR(50) NOT NULL UNIQUE,
    transfer_area_name VARCHAR(255) NOT NULL,
    port_id UUID NOT NULL,
    org_unit_id UUID,
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_functions VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    shape_description TEXT,
    area NUMERIC(15,2),
    design_water_depth NUMERIC(10,2),
    current_water_depth NUMERIC(10,2),
    bottom_elevation_design NUMERIC(10,2),
    max_vessel_dwt NUMERIC(15,2),
    active_transfer_count INTEGER,
    published_transfer_count INTEGER,
    under_investment_transfer_count INTEGER,
    remarks TEXT,
    opening_announcement_date TIMESTAMP,
    public_decision VARCHAR(500),
    investment_agreement TEXT,
    activity_start_date TIMESTAMP,
    activity_end_date TIMESTAMP,
    submitted_for_approval_at TIMESTAMP,
    submitted_for_approval_by VARCHAR(100),
    port_authority_approved_at TIMESTAMP,
    port_authority_approved_by VARCHAR(100),
    port_authority_approval_content VARCHAR(1000),
    department_approved_at TIMESTAMP,
    department_approved_by VARCHAR(100),
    department_approval_content VARCHAR(1000),
    rejection_reason VARCHAR(500)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transfer_areas_code ON transfer_areas(transfer_area_code);
CREATE INDEX IF NOT EXISTS idx_transfer_areas_port_id ON transfer_areas(port_id);
CREATE INDEX IF NOT EXISTS idx_transfer_areas_org_unit ON transfer_areas(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_transfer_areas_approval_status ON transfer_areas(approval_status);
CREATE INDEX IF NOT EXISTS idx_transfer_areas_operational_status ON transfer_areas(operational_status);
CREATE INDEX IF NOT EXISTS idx_transfer_areas_deleted_at ON transfer_areas(deleted_at) WHERE deleted_at IS NULL;
