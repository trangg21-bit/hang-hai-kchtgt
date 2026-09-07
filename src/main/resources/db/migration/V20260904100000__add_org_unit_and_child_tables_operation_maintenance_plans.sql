-- V20260904100000: F-129 / F-130 — add data-scope org_unit_id + Excel header columns to
-- operation_plans / maintenance_plans, create 5 child tables, reuse maintenance_results (result_note).
-- Additive only: no column dropped, no existing data reinterpreted.

-- 1. Header operation_plans — additive columns
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS operating_org_unit_id UUID;
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS infrastructure_type VARCHAR(50);
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS expected_start_date DATE;
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS expected_end_date DATE;
ALTER TABLE operation_plans ADD COLUMN IF NOT EXISTS note VARCHAR(500);

-- 2. Header maintenance_plans — additive columns
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS operating_org_unit_id UUID;
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS infrastructure_type VARCHAR(50);
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS note VARCHAR(500);

-- 3. Backfill org_unit_id from created_by (user's managing org unit)
UPDATE operation_plans op SET org_unit_id = u.org_unit_id
FROM app_users u WHERE u.id = op.created_by AND op.org_unit_id IS NULL;

UPDATE maintenance_plans mp SET org_unit_id = u.org_unit_id
FROM app_users u WHERE u.id = mp.created_by AND mp.org_unit_id IS NULL;

-- 4. Fallback: any remaining NULL -> root org unit (matches V40 pattern)
DO $$
DECLARE
    root_org_id UUID;
BEGIN
    SELECT id INTO root_org_id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1;
    IF root_org_id IS NOT NULL THEN
        UPDATE operation_plans SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
        UPDATE maintenance_plans SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
    END IF;
END $$;

-- 5. Unique index on code + scope index
CREATE UNIQUE INDEX IF NOT EXISTS uq_operation_plans_code ON operation_plans(code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenance_plans_code ON maintenance_plans(code);
CREATE INDEX IF NOT EXISTS idx_operation_plans_org_unit ON operation_plans(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_org_unit ON maintenance_plans(org_unit_id);

-- 6. Child table: operation_plan_work (danh sách công trình vận hành)
CREATE TABLE IF NOT EXISTS operation_plan_work (
    id UUID PRIMARY KEY,
    operation_plan_id UUID NOT NULL,
    infrastructure_id UUID,
    infrastructure_name VARCHAR(255),
    location VARCHAR(255),
    port_name VARCHAR(255)
);

-- 7. Child table: operation_plan_file (file kế hoạch + file xác nhận, gộp qua file_category)
CREATE TABLE IF NOT EXISTS operation_plan_file (
    id UUID PRIMARY KEY,
    operation_plan_id UUID NOT NULL,
    file_category VARCHAR(20),
    file_type VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    uploaded_by UUID,
    uploaded_at TIMESTAMP
);

-- 8. Child table: operation_confirmation (xác nhận vận hành, chỉ ghi khi HOAN_THANH)
CREATE TABLE IF NOT EXISTS operation_confirmation (
    id UUID PRIMARY KEY,
    operation_plan_id UUID NOT NULL,
    actual_start_date TIMESTAMP,
    actual_end_date TIMESTAMP,
    operating_time VARCHAR(100),
    operating_status VARCHAR(100),
    downtime VARCHAR(100),
    incident_frequency VARCHAR(100),
    max_capacity DECIMAL(15,2),
    actual_capacity DECIMAL(15,2),
    result_content TEXT,
    result_note TEXT,
    recorder VARCHAR(100),
    recorded_date DATE
);

-- 9. Child table: maintenance_plan_work (danh sách công trình bảo trì + kinh phí từng dòng)
CREATE TABLE IF NOT EXISTS maintenance_plan_work (
    id UUID PRIMARY KEY,
    maintenance_plan_id UUID NOT NULL,
    infrastructure_id UUID,
    infrastructure_name VARCHAR(255),
    port_name VARCHAR(255),
    location VARCHAR(255),
    cost DECIMAL(15,2)
);

-- 10. Child table: maintenance_plan_file (file kế hoạch + file xác nhận)
CREATE TABLE IF NOT EXISTS maintenance_plan_file (
    id UUID PRIMARY KEY,
    maintenance_plan_id UUID NOT NULL,
    file_category VARCHAR(20),
    file_type VARCHAR(50),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    uploaded_by UUID,
    uploaded_at TIMESTAMP
);

-- 11. Reuse maintenance_results — add result_note (F-130 #22)
ALTER TABLE maintenance_results ADD COLUMN IF NOT EXISTS result_note TEXT;

-- 12. FK lookup indexes on child tables
CREATE INDEX IF NOT EXISTS idx_operation_plan_work_plan ON operation_plan_work(operation_plan_id);
CREATE INDEX IF NOT EXISTS idx_operation_plan_file_plan ON operation_plan_file(operation_plan_id);
CREATE INDEX IF NOT EXISTS idx_operation_confirmation_plan ON operation_confirmation(operation_plan_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plan_work_plan ON maintenance_plan_work(maintenance_plan_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plan_file_plan ON maintenance_plan_file(maintenance_plan_id);
