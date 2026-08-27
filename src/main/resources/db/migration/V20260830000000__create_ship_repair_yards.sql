-- V20260830000000: Tạo bảng ship_repair_yards cho Quản lý Cơ sở sửa chữa đóng tàu (CSV QL cơ sở sửa chữa đóng tàu) — parity với buoy_berths.
CREATE TABLE IF NOT EXISTS ship_repair_yards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    ship_repair_yard_code VARCHAR(50) NOT NULL UNIQUE,
    ship_repair_yard_name VARCHAR(255) NOT NULL,
    port_id UUID NOT NULL,
    pier_id UUID,
    org_unit_id UUID,
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,

    -- ── Thông tin đặc thù CSSCĐT ──────────────────────────────────────
    usage_function VARCHAR(255),
    workshop_area NUMERIC(15,2),
    vessel_type VARCHAR(255),
    vessel_dwt VARCHAR(100),
    business_type VARCHAR(255),
    activity VARCHAR(255),
    slipway_count INTEGER,
    remarks TEXT,

    -- ── GIS fields ────────────────────────────────────────────────────
    map_symbol_id UUID,
    coordinate_system INTEGER,
    display_rule INTEGER,
    spatial_id UUID,

    -- ── Two-level approval tracking ───────────────────────────────────
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
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_code ON ship_repair_yards(ship_repair_yard_code);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_port_id ON ship_repair_yards(port_id);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_pier_id ON ship_repair_yards(pier_id);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_org_unit ON ship_repair_yards(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_approval_status ON ship_repair_yards(approval_status);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_operational_status ON ship_repair_yards(operational_status);
CREATE INDEX IF NOT EXISTS idx_ship_repair_yards_deleted_at ON ship_repair_yards(deleted_at) WHERE deleted_at IS NULL;
