-- =====================================================================
-- Chuẩn hóa trạng thái phê duyệt Phao tiêu (buoy)
-- Khắc phục tình trạng không khớp tổng số bản ghi do trạng thái legacy
-- (APPROVED_L2, REJECTED) không nằm trong 7 tab trạng thái chuẩn.
-- =====================================================================

-- 1. Chuyển đổi trạng thái đã phê duyệt APPROVED_L2 / APPROVED_LEVEL2 / APPROVED sang PUBLISHED
UPDATE buoy
SET status = 'PUBLISHED',
    approval_status = 'APPROVED'
WHERE status IN ('APPROVED_L2', 'APPROVED_LEVEL2', 'APPROVED');

-- 2. Chuyển đổi trạng thái từ chối REJECTED theo cấp phê duyệt
UPDATE buoy
SET status = 'REJECTED_L2',
    approval_status = 'REJECTED_LEVEL2'
WHERE status = 'REJECTED' AND approval_level = 2;

UPDATE buoy
SET status = 'REJECTED_L1',
    approval_status = 'REJECTED_LEVEL1'
WHERE status = 'REJECTED' AND (approval_level = 1 OR approval_level IS NULL);
