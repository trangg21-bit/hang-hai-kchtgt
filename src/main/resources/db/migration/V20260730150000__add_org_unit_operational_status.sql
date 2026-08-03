-- Trạng thái sử dụng được lưu riêng với trạng thái phê duyệt của đơn vị.
-- Theo hệ thống gốc: 0 = Không sử dụng, 1 = Sử dụng.
ALTER TABLE org_units
    ADD COLUMN IF NOT EXISTS operational_status SMALLINT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_org_units_operational_status
    ON org_units (operational_status);
