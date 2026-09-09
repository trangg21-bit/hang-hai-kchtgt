-- =====================================================================
-- Chuẩn hóa trạng thái phê duyệt Bến phao (buoy_berths) theo M-1006
-- Parity với Cầu cảng (piers) và Bến cảng (berths)
-- Chuyển các mã legacy: APPROVED_LEVEL2 (4) -> APPROVED (5),
-- REJECTED (6) -> REJECTED_LEVEL1 (8), PROPOSED (1) -> PENDING_APPROVAL (2)
-- =====================================================================

UPDATE buoy_berths SET approval_status = 5 WHERE approval_status = 4;
UPDATE buoy_berths SET approval_status = 8 WHERE approval_status = 6;
UPDATE buoy_berths SET approval_status = 2 WHERE approval_status = 1;
