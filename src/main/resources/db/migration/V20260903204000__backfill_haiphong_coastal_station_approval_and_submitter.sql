-- Migration: Cập nhật tự động thông tin người gửi và người duyệt cấp 1 cho các đài TTXLTT đã được phê duyệt cấp Cục
-- Giải quyết tình trạng màn hình danh sách bị khuyết cột Cán bộ gửi phê duyệt và Cán bộ duyệt cấp 1

ALTER TABLE public.coastal_station_haiphong
    ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);

UPDATE public.coastal_station_haiphong
SET
    submitted_by = COALESCE(submitted_by, approver_level2, updated_by, created_by),
    submitted_at = COALESCE(submitted_at, approved_date_level2, updated_at, created_at, NOW()),
    approver_level1 = COALESCE(approver_level1, approver_level2),
    approved_date_level1 = COALESCE(approved_date_level1, approved_date_level2, NOW()),
    level1_approval_content = COALESCE(level1_approval_content, 'Cấp Cục phê duyệt trực tiếp'),
    approved_by = COALESCE(approved_by, approver_level2),
    approved_date = COALESCE(approved_date, approved_date_level2, NOW())
WHERE (approval_status = 5 OR approval_status = 4)
  AND (approver_level1 IS NULL OR submitted_by IS NULL);
