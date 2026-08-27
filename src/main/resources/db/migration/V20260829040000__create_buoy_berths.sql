-- V: Tạo bảng buoy_berths cho Quản lý Bến phao (CSV QL bến phao) — parity với storm_shelter_areas.
CREATE TABLE IF NOT EXISTS buoy_berths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    buoy_berth_code VARCHAR(50) NOT NULL UNIQUE,
    buoy_berth_name VARCHAR(255) NOT NULL,
    port_id UUID NOT NULL,
    org_unit_id UUID,
    waterway_id UUID,
    classification VARCHAR(100),
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    operating_org_id UUID,
    current_water_depth NUMERIC(10,2),
    bottom_elevation_design NUMERIC(10,2),
    max_vessel_dwt NUMERIC(15,2),
    planned_vessel_dwt NUMERIC(15,2),
    last_inspection_date DATE,
    next_inspection_date DATE,
    operation_expiry_date DATE,
    design_capacity NUMERIC(15,2),
    active_buoy_berth_count INTEGER,
    published_buoy_berth_count INTEGER,
    under_investment_buoy_berth_count INTEGER,
    cargo_throughput NUMERIC(15,2),
    opening_announcement_date TIMESTAMP,
    public_decision VARCHAR(500),
    investment_agreement TEXT,
    mooring_water_area_scope VARCHAR(1000),
    map_symbol_id UUID,
    coordinate_system INTEGER,
    display_rule INTEGER,
    spatial_id UUID,
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
CREATE INDEX IF NOT EXISTS idx_buoy_berths_code ON buoy_berths(buoy_berth_code);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_port_id ON buoy_berths(port_id);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_org_unit ON buoy_berths(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_waterway_id ON buoy_berths(waterway_id);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_approval_status ON buoy_berths(approval_status);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_operational_status ON buoy_berths(operational_status);
CREATE INDEX IF NOT EXISTS idx_buoy_berths_deleted_at ON buoy_berths(deleted_at) WHERE deleted_at IS NULL;
