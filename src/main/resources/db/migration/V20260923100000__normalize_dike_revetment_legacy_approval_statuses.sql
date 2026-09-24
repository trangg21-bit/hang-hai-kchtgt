-- =====================================================================
-- Chuẩn hóa trạng thái phê duyệt Đê kè (dike_revetment)
-- Khắc phục tình trạng không khớp tổng số bản ghi và thiếu bản ghi trên các tab
-- do trạng thái legacy (PROPOSED, REJECTED, APPROVED_LEVEL2) không nằm trong 7 tab trạng thái chuẩn.
-- =====================================================================

-- 1. Chuyển đổi trạng thái PROPOSED (1) sang PENDING_APPROVAL (2) - Chờ phê duyệt cấp Cảng vụ/Chi cục
UPDATE dike_revetment
SET approval_status = 2
WHERE approval_status = 1;

-- 2. Chuyển đổi trạng thái REJECTED (6) sang REJECTED_LEVEL1 (8) - Từ chối cấp Cảng vụ/Chi cục
UPDATE dike_revetment
SET approval_status = 8
WHERE approval_status = 6;

-- 3. Chuyển đổi trạng thái APPROVED_LEVEL2 (4) sang APPROVED (5) - Đã phê duyệt
UPDATE dike_revetment
SET approval_status = 5
WHERE approval_status = 4;
