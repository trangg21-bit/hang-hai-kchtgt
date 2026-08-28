-- V120: Create anchorages table for Khu neo đậu
CREATE TABLE IF NOT EXISTS anchorages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    anchorage_code VARCHAR(50) NOT NULL UNIQUE,
    anchorage_name VARCHAR(255) NOT NULL,
    port_id UUID NOT NULL,
    org_unit_id UUID,
    navigation_channel_id UUID,
    buoy_station_id UUID,
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    shape_description TEXT,
    area NUMERIC(15,2),
    design_water_depth NUMERIC(10,2),
    current_water_depth NUMERIC(10,2),
    bottom_elevation_design NUMERIC(10,2),
    max_vessel_dwt NUMERIC(15,2),
    active_anchorage_count INTEGER,
    published_anchorage_count INTEGER,
    under_investment_anchorage_count INTEGER,
    remarks TEXT,
    opening_announcement_date TIMESTAMP,
    public_decision VARCHAR(500),
    investment_agreement TEXT,
    activity_status VARCHAR(50),
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
CREATE INDEX IF NOT EXISTS idx_anchorages_code ON anchorages(anchorage_code);
CREATE INDEX IF NOT EXISTS idx_anchorages_port_id ON anchorages(port_id);
CREATE INDEX IF NOT EXISTS idx_anchorages_org_unit ON anchorages(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_anchorages_approval_status ON anchorages(approval_status);
CREATE INDEX IF NOT EXISTS idx_anchorages_operational_status ON anchorages(operational_status);
CREATE INDEX IF NOT EXISTS idx_anchorages_deleted_at ON anchorages(deleted_at) WHERE deleted_at IS NULL;
