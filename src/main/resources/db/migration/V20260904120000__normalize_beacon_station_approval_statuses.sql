-- =====================================================================
-- Chuẩn hóa trạng thái phê duyệt Đèn biển & nhà trạm (beacon_light)
-- theo chuẩn 6 trạng thái KCHT (parity M-023 / BuoyService).
-- Bối cảnh: trước đây BeaconStationService.reject ghi status='DRAFT'
-- + approval_status='REJECTED_LEVELx' → bản ghi bị từ chối hiển thị
-- như 'Lưu tạm'. Nay status mang đúng trạng thái từ chối theo cấp để
-- danh sách lọc/đếm theo status (chuẩn như Phao tiêu).
-- Triage: TRI-1788490166419-5b97
-- =====================================================================

-- Bản ghi bị từ chối (approval_status REJECTED_LEVELx) → status đúng cấp
UPDATE beacon_light SET status = 'REJECTED_LEVEL1' WHERE status = 'DRAFT' AND approval_status = 'REJECTED_LEVEL1';
UPDATE beacon_light SET status = 'REJECTED_LEVEL2' WHERE status = 'DRAFT' AND approval_status = 'REJECTED_LEVEL2';
UPDATE beacon_light SET status = 'REJECTED_LEVEL1' WHERE status IN ('REJECTED', 'REJECTED_L1');
UPDATE beacon_light SET status = 'REJECTED_LEVEL2' WHERE status = 'REJECTED_L2';

-- Legacy status đã duyệt → APPROVED
UPDATE beacon_light SET status = 'APPROVED' WHERE status IN ('APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED');

-- Legacy status chờ duyệt cấp Cảng vụ/Chi cục → PENDING_APPROVAL
UPDATE beacon_light SET status = 'PENDING_APPROVAL' WHERE status IN ('PROPOSED', 'PENDING');

-- Legacy status chờ duyệt cấp Cục → APPROVED_LEVEL1
UPDATE beacon_light SET status = 'APPROVED_LEVEL1' WHERE status = 'APPROVED_L1';
