-- Bến cảng, cầu cảng, cảng cạn và vùng nước tham gia quy trình phê duyệt 2 cấp
-- (approval-2-level-spec §3.2), cùng khuôn với cảng biển ở V100.
--
-- Trước đây cả 4 loại chỉ có approval_status và duyệt một lần (endpoint
-- /approve). Bổ sung cột truy vết người duyệt từng vòng để chống tự duyệt
-- (BR-015) và ghi nhật ký ai duyệt lúc nào (BR-007).

ALTER TABLE berths      ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE berths      ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE berths      ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE berths      ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;

ALTER TABLE piers       ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE piers       ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE piers       ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE piers       ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE piers       ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE dry_ports   ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE dry_ports   ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE dry_ports   ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE dry_ports   ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE dry_ports   ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE water_zones ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE water_zones ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE water_zones ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE water_zones ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE water_zones ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Chuẩn hoá trạng thái legacy sang tập 7 trạng thái (ordinal của ApprovalStatus):
--   1 PROPOSED        -> 2 PENDING_APPROVAL
--   4 APPROVED_LEVEL2 -> 5 APPROVED
--   6 REJECTED        -> 8 REJECTED_LEVEL1
-- Bản ghi đã duyệt theo cơ chế 1 cấp cũ giữ nguyên APPROVED; không suy diễn
-- ngược người duyệt vì dữ liệu cũ không lưu thông tin đó.
ALTER TABLE berths DROP CONSTRAINT IF EXISTS berths_approval_status_check;
ALTER TABLE piers DROP CONSTRAINT IF EXISTS piers_approval_status_check;
ALTER TABLE dry_ports DROP CONSTRAINT IF EXISTS dry_ports_approval_status_check;
ALTER TABLE water_zones DROP CONSTRAINT IF EXISTS water_zones_approval_status_check;

UPDATE berths      SET approval_status = 2 WHERE approval_status = 1;
UPDATE berths      SET approval_status = 5 WHERE approval_status = 4;
UPDATE berths      SET approval_status = 8 WHERE approval_status = 6;
UPDATE berths      SET approval_status = 0 WHERE approval_status IS NULL;

UPDATE piers       SET approval_status = 2 WHERE approval_status = 1;
UPDATE piers       SET approval_status = 5 WHERE approval_status = 4;
UPDATE piers       SET approval_status = 8 WHERE approval_status = 6;
UPDATE piers       SET approval_status = 0 WHERE approval_status IS NULL;

UPDATE dry_ports   SET approval_status = 2 WHERE approval_status = 1;
UPDATE dry_ports   SET approval_status = 5 WHERE approval_status = 4;
UPDATE dry_ports   SET approval_status = 8 WHERE approval_status = 6;
UPDATE dry_ports   SET approval_status = 0 WHERE approval_status IS NULL;

UPDATE water_zones SET approval_status = 2 WHERE approval_status = 1;
UPDATE water_zones SET approval_status = 5 WHERE approval_status = 4;
UPDATE water_zones SET approval_status = 8 WHERE approval_status = 6;
UPDATE water_zones SET approval_status = 0 WHERE approval_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_berths_approval_status      ON berths (approval_status);
CREATE INDEX IF NOT EXISTS idx_piers_approval_status       ON piers (approval_status);
CREATE INDEX IF NOT EXISTS idx_dry_ports_approval_status   ON dry_ports (approval_status);
CREATE INDEX IF NOT EXISTS idx_water_zones_approval_status ON water_zones (approval_status);
