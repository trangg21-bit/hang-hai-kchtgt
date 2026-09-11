-- V20260911140000__create_scada_system_assets.sql
-- Tạo bảng lưu trữ Tài sản hệ thống SCADA và các chỉ số nghiệp vụ

CREATE TABLE IF NOT EXISTS scada_system_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_code VARCHAR(50) NOT NULL,
    asset_name VARCHAR(500) NOT NULL,
    parent_org_unit_id UUID,
    org_unit_id UUID NOT NULL,
    using_org_unit_id UUID,
    scada_id UUID,
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
    status VARCHAR(50) DEFAULT '1',
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
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    lock_version INTEGER DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_scada_system_assets_code
    ON scada_system_assets (asset_code)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scada_system_assets_org_unit ON scada_system_assets(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_scada_system_assets_using_org ON scada_system_assets(using_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_scada_system_assets_scada ON scada_system_assets(scada_id);
CREATE INDEX IF NOT EXISTS idx_scada_system_assets_status ON scada_system_assets(approval_status);
CREATE INDEX IF NOT EXISTS idx_scada_system_assets_updated_at ON scada_system_assets(updated_at DESC);

-- Chèn dữ liệu mẫu cho Tài sản hệ thống SCADA
INSERT INTO scada_system_assets (
    id, asset_code, asset_name, org_unit_id, using_org_unit_id,
    asset_type, asset_condition, usage_status, asset_group, origin,
    quantity, quantity_unit, model, serial_number, country_of_origin, manufacturer,
    construction_year, use_date, land_area, floor_area, asset_location,
    attachment_name, declaration_date, original_value, depreciation_rate, remaining_value,
    value_unit, assignment_decision_number, depreciation_start_date, depreciation_months,
    depreciation_end_date, accumulated_depreciation, monthly_depreciation, disposal_method,
    status, approval_status
)
SELECT
    'e8d2e3f4-0001-4000-8000-000000000001'::uuid,
    'TS-SCADA-000001',
    'Hệ thống SCADA giám sát & điều khiển tự động trạm luồng Hải Phòng',
    ou.id,
    ou.id,
    'Hệ thống SCADA thu thập dữ liệu',
    'Tốt',
    'Đang sử dụng',
    'Máy móc, thiết bị',
    'Đầu tư xây dựng',
    1,
    'Hệ thống',
    'SIMATIC PCS 7 - RTU3030C',
    'SN-SCADA-HP-2024-001',
    'Đức',
    'Siemens AG',
    2023,
    '2024-02-15'::date,
    50.0,
    35.0,
    'Trung tâm điều hành SCADA Hải Phòng',
    'Quyet_dinh_phe_duyet_scada.pdf, Bien_ban_nghiem_thu_scada.pdf',
    '2024-02-10'::date,
    850000000,
    10.0,
    779166667,
    'VNĐ',
    'QĐ-612/QĐ-CHHVN',
    '2024-02-15'::date,
    120,
    '2034-02-15'::date,
    70833333,
    7083333,
    'Đang vận hành khai thác',
    '1',
    3 -- APPROVED_LEVEL1
FROM org_units ou
WHERE ou.deleted_at IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM scada_system_assets 
      WHERE id = 'e8d2e3f4-0001-4000-8000-000000000001'::uuid 
         OR asset_code = 'TS-SCADA-000001'
  )
LIMIT 1
ON CONFLICT (id) DO NOTHING;
