-- V20260905120000: Tạo bảng seaport_throughput + seaport_throughput_file cho M-028 / F-301
-- "Sản lượng cảng biển" (1 dòng = 1 đơn vị quản lý x 1 tháng; 24 cột chỉ tiêu DECIMAL + passenger_trips).
-- org_unit_id được backfill từ created_by (nếu có dòng cũ NULL) rồi SET NOT NULL.

CREATE TABLE IF NOT EXISTS seaport_throughput (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    security_level SMALLINT NOT NULL DEFAULT 0,
    org_unit_id UUID,
    province_id INTEGER,
    spatial_id UUID,
    approval_status SMALLINT NOT NULL DEFAULT 0,
    approver_level1 UUID,
    approved_date_level1 TIMESTAMP,
    approver_level2 UUID,
    approved_date_level2 TIMESTAMP,
    rejection_reason VARCHAR(500),
    submitted_at TIMESTAMP,
    submitted_by UUID,
    level1_approval_content VARCHAR(2000),
    level2_approval_content VARCHAR(2000),
    report_month DATE NOT NULL,
    note TEXT,
    domestic_container_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_container_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_dry_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_dry_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_liquid_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_liquid_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_other_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    domestic_other_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_container_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_container_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_dry_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_dry_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_liquid_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_liquid_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_other_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    foreign_other_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_container_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_container_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_dry_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_dry_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_liquid_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_liquid_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_other_ton NUMERIC(18, 2) NOT NULL DEFAULT 0,
    route_other_ton_km NUMERIC(18, 2) NOT NULL DEFAULT 0,
    passenger_trips BIGINT NOT NULL DEFAULT 0
);

-- Backfill dữ liệu legacy (nếu có) trước khi ép NOT NULL
UPDATE seaport_throughput
   SET org_unit_id = created_by
 WHERE org_unit_id IS NULL AND created_by IS NOT NULL;

ALTER TABLE seaport_throughput ALTER COLUMN org_unit_id SET NOT NULL;

-- Unique nghiệp vụ (BR-SLCB-01): 1 đơn vị x 1 tháng chỉ có 1 bản ghi
CREATE UNIQUE INDEX IF NOT EXISTS uq_seaport_throughput_unit_month
    ON seaport_throughput (org_unit_id, report_month);

CREATE INDEX IF NOT EXISTS idx_seaport_throughput_org_unit ON seaport_throughput (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_seaport_throughput_approval_status ON seaport_throughput (approval_status);
CREATE INDEX IF NOT EXISTS idx_seaport_throughput_report_month ON seaport_throughput (report_month);
CREATE INDEX IF NOT EXISTS idx_seaport_throughput_deleted_at ON seaport_throughput (deleted_at) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS seaport_throughput_file (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    throughput_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT fk_seaport_throughput_file_parent
        FOREIGN KEY (throughput_id) REFERENCES seaport_throughput (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seaport_throughput_file_parent ON seaport_throughput_file (throughput_id);
