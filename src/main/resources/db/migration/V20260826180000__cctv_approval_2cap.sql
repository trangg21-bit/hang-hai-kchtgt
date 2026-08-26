-- V20260826120000: CCTV approval 2-level (M-1006) — add approver fields.
-- Mirrors BaseApprovableEntity columns used by /vts-system and other KCHT modules.
-- Luồng cũ (Port ApprovalWorkflowService) không lưu người duyệt trên entity nên
-- không có dữ liệu lịch sử để backfill — các cột mới đều NULL.
-- Hồ sơ APPROVED / PENDING_APPROVAL hiện có vẫn hợp lệ dưới luồng 2 cấp.
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approver_level1 uuid NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approved_date_level1 timestamp NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approver_level2 uuid NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approved_date_level2 timestamp NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS rejection_reason varchar(500) NULL;

COMMENT ON COLUMN public.cctv.approver_level1 IS 'Người phê duyệt cấp 1 (Cảng vụ/Chi cục)';
COMMENT ON COLUMN public.cctv.approved_date_level1 IS 'Thời gian phê duyệt cấp 1';
COMMENT ON COLUMN public.cctv.approver_level2 IS 'Người phê duyệt cấp 2 (Cục)';
COMMENT ON COLUMN public.cctv.approved_date_level2 IS 'Thời gian phê duyệt cấp 2';
COMMENT ON COLUMN public.cctv.rejection_reason IS 'Lý do từ chối';
