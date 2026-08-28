-- V20260826150000: CCTV — thông tin gửi phê duyệt + nội dung phê duyệt 2 cấp.
-- Bổ sung để drawer chi tiết hiển thị: Ngày/Cán bộ gửi phê duyệt, Nội dung phê duyệt C1/C2.
-- Không có dữ liệu lịch sử để backfill (luồng cũ không lưu) — các cột mới đều NULL.
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS submitted_date timestamp NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS submitted_by uuid NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approval_content_level1 varchar(500) NULL;
ALTER TABLE public.cctv ADD COLUMN IF NOT EXISTS approval_content_level2 varchar(500) NULL;

COMMENT ON COLUMN public.cctv.submitted_date IS 'Ngày gửi phê duyệt (cập nhật mỗi lần gửi)';
COMMENT ON COLUMN public.cctv.submitted_by IS 'Cán bộ gửi phê duyệt';
COMMENT ON COLUMN public.cctv.approval_content_level1 IS 'Nội dung/ý kiến phê duyệt cấp 1 (Cảng vụ/Chi cục)';
COMMENT ON COLUMN public.cctv.approval_content_level2 IS 'Nội dung/ý kiến phê duyệt cấp 2 (Cục)';
