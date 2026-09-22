-- Complete the Port approval audit contract so the detail drawer can show
-- submitter, both approval levels, timestamps and decision contents.
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS submitted_at timestamp NULL;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS submitted_by uuid NULL;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS approval_content_level1 varchar(2000) NULL;
ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS approval_content_level2 varchar(2000) NULL;

-- Preserve useful audit information for legacy approved records. These values
-- are inferred only from audit/approval columns already stored on the record.
UPDATE public.ports
SET submitted_at = COALESCE(submitted_at, approved_date_level1, approved_date_level2, updated_at, created_at),
    submitted_by = COALESCE(submitted_by, created_by, updated_by, approver_level1, approver_level2)
WHERE approval_status <> 0
  AND (submitted_at IS NULL OR submitted_by IS NULL);

COMMENT ON COLUMN public.ports.submitted_at IS 'Ngày gửi phê duyệt gần nhất';
COMMENT ON COLUMN public.ports.submitted_by IS 'Cán bộ gửi phê duyệt gần nhất';
COMMENT ON COLUMN public.ports.approval_content_level1 IS 'Nội dung phê duyệt cấp Cảng vụ/Chi cục';
COMMENT ON COLUMN public.ports.approval_content_level2 IS 'Nội dung phê duyệt cấp Cục';
