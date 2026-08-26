-- Trung tâm điều hành VTS: chuyển sang BaseApprovableEntity.
--
-- Bối cảnh: entity trước đây kế thừa BaseEntity rồi tự khai lại các cột phê duyệt, nên thiếu
-- 4 cột mà lớp cha chuẩn đã có (submitted_at, submitted_by, level1/level2_approval_content)
-- cùng cột security_level. Thiếu 4 cột này thì ma trận dữ liệu F-293 trường #20, #21, #24, #27
-- không có chỗ lưu, và 6 cột kiểm toán trên bảng danh sách (screen-template §2.1) không đủ dữ liệu.
--
-- Bổ sung thêm coordinate_reference_system cho trường #13.

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS security_level SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS submitted_by UUID;

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000);

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);

ALTER TABLE vts_operation_center
    ADD COLUMN IF NOT EXISTS coordinate_reference_system VARCHAR(50);

-- Suy ngược vết gửi duyệt cho dữ liệu cũ: hồ sơ đã đi qua vòng duyệt nhưng chưa có
-- submitted_at thì lấy tạm thời điểm tạo và người tạo, để 2 cột kiểm toán mới không rỗng hoàn toàn.
UPDATE vts_operation_center
SET submitted_at = created_at,
    submitted_by = created_by
WHERE submitted_at IS NULL
  AND approval_status IN (2, 3, 5, 8, 9);

COMMENT ON COLUMN vts_operation_center.submitted_at IS 'Ngày gửi phê duyệt (ma trận F-293 #20)';
COMMENT ON COLUMN vts_operation_center.submitted_by IS 'Cán bộ gửi phê duyệt (ma trận F-293 #21)';
COMMENT ON COLUMN vts_operation_center.level1_approval_content IS 'Nội dung phê duyệt cấp Cảng vụ/Chi cục (ma trận F-293 #24)';
COMMENT ON COLUMN vts_operation_center.level2_approval_content IS 'Nội dung phê duyệt cấp Cục (ma trận F-293 #27)';
COMMENT ON COLUMN vts_operation_center.coordinate_reference_system IS 'Hệ quy chiếu tọa độ (ma trận F-293 #13)';
