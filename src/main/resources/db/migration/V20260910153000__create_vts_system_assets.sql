-- V20260910160000__create_vts_system_assets.sql
-- Tạo bảng lưu trữ Tài sản hệ thống VTS và các chỉ số nghiệp vụ

CREATE TABLE IF NOT EXISTS vts_system_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(50) NOT NULL,
    asset_name VARCHAR(500) NOT NULL,
    parent_org_unit_id UUID,
    org_unit_id UUID NOT NULL,
    using_org_unit_id UUID,
    vts_system_id UUID,
    asset_type VARCHAR(100),
    barcode VARCHAR(100),
    asset_condition VARCHAR(100),
    usage_status VARCHAR(100),
    asset_group VARCHAR(200),
    asset_subgroup VARCHAR(200),
    address VARCHAR(500),
    origin VARCHAR(200),
    quantity NUMERIC(15,3),
    quantity_unit VARCHAR(50),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    country_of_origin VARCHAR(100),
    manufacturer VARCHAR(200),
    construction_year INTEGER,
    use_date DATE,
    land_area NUMERIC(15,3),
    floor_area NUMERIC(15,3),
    asset_location VARCHAR(500),
    attachment_name VARCHAR(500),
    declaration_date DATE,
    original_value NUMERIC(15,2),
    depreciation_rate NUMERIC(7,4),
    remaining_value NUMERIC(15,2),
    value_unit VARCHAR(20) DEFAULT 'VNĐ',
    assignment_decision_number VARCHAR(200),
    depreciation_start_date DATE,
    depreciation_months INTEGER,
    depreciation_end_date DATE,
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,
    monthly_depreciation NUMERIC(15,2),
    disposal_method VARCHAR(200),
    status VARCHAR(50) DEFAULT 'MANAGED',
    approval_status INTEGER DEFAULT 0,
    submitted_by UUID,
    submitted_at TIMESTAMPTZ,
    port_authority_approved_by UUID,
    port_authority_approved_at TIMESTAMPTZ,
    port_authority_approval_content VARCHAR(1000),
    department_approved_by UUID,
    department_approved_at TIMESTAMPTZ,
    department_approval_content VARCHAR(1000),
    rejection_reason VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    lock_version INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_vts_system_assets_code
    ON vts_system_assets (asset_code)
    WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_vts_system_assets_org_unit ON vts_system_assets(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vts_system_assets_using_org ON vts_system_assets(using_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vts_system_assets_vts_system ON vts_system_assets(vts_system_id);
CREATE INDEX IF NOT EXISTS idx_vts_system_assets_status ON vts_system_assets(approval_status);
CREATE INDEX IF NOT EXISTS idx_vts_system_assets_updated_at ON vts_system_assets(updated_at DESC);
