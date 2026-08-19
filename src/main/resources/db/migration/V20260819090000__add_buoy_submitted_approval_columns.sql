-- V20260819090000: Bổ sung cột submitted_for_approval_by/at (Ngày & Cán bộ gửi phê duyệt — CSV STT 37/38)
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS submitted_for_approval_by UUID;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;
