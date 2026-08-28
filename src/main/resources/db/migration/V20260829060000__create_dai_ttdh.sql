-- V: Tạo bảng dai_ttdh cho Quản lý Đài TTDH (CSV Đài TTDH) — parity với buoy_berths.
CREATE TABLE IF NOT EXISTS dai_ttdh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    dai_ttdh_code VARCHAR(50) NOT NULL UNIQUE,
    dai_ttdh_name VARCHAR(255) NOT NULL,
    org_unit_id UUID,
    operating_unit_id UUID,
    station_level SMALLINT NOT NULL DEFAULT 0,
    province_id INTEGER,
    detailed_location VARCHAR(500),
    operational_status SMALLINT,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    coverage_area TEXT,
    services_provided VARCHAR(500),
    remarks VARCHAR(2000),
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
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_code ON dai_ttdh(dai_ttdh_code);
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_org_unit ON dai_ttdh(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_operating_unit ON dai_ttdh(operating_unit_id);
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_approval_status ON dai_ttdh(approval_status);
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_operational_status ON dai_ttdh(operational_status);
CREATE INDEX IF NOT EXISTS idx_dai_ttdh_deleted_at ON dai_ttdh(deleted_at) WHERE deleted_at IS NULL;
