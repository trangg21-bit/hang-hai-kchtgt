-- Cảng biển tham gia quy trình phê duyệt 2 cấp (approval-2-level-spec §3.2).
--
-- Trước đây bảng chỉ có approval_status và duyệt một lần (endpoint /approve).
-- Bổ sung các cột truy vết người duyệt từng vòng để chống tự duyệt (BR-015) và
-- ghi nhật ký ai duyệt lúc nào (BR-007), rồi chuẩn hoá dữ liệu trạng thái cũ
-- sang tập 7 trạng thái đã chốt.

ALTER TABLE ports ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE ports ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Chuẩn hoá trạng thái legacy sang tập 7 trạng thái (ordinal của ApprovalStatus):
--   1 PROPOSED         -> 2 PENDING_APPROVAL
--   4 APPROVED_LEVEL2  -> 5 APPROVED
--   6 REJECTED         -> 8 REJECTED_LEVEL1
-- Bản ghi đã duyệt theo cơ chế 1 cấp cũ được coi là đã qua đủ 2 vòng: giữ
-- nguyên trạng thái APPROVED, không suy diễn ngược người duyệt vì dữ liệu cũ
-- không lưu thông tin đó.
ALTER TABLE ports DROP CONSTRAINT IF EXISTS ports_approval_status_check;

UPDATE ports SET approval_status = 2 WHERE approval_status = 1;
UPDATE ports SET approval_status = 5 WHERE approval_status = 4;
UPDATE ports SET approval_status = 8 WHERE approval_status = 6;

-- Bản ghi chưa có trạng thái coi như Lưu tạm (DRAFT = 0).
UPDATE ports SET approval_status = 0 WHERE approval_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_ports_approval_status ON ports (approval_status);
