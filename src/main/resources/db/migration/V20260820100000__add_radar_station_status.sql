-- V20260820100000: Thêm cột status cho luồng phê duyệt 1 cấp (khớp /beacon-lights)
-- status nhận một trong: DRAFT | PENDING_APPROVAL | APPROVED | REJECTED
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'DRAFT';
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS submitted_for_approval_by UUID;
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;

-- Backfill theo approval_status (int2, ordinal):
--   DRAFT=0, PROPOSED=1, PENDING_APPROVAL=2, APPROVED_LEVEL1=3, APPROVED_LEVEL2=4, APPROVED=5, REJECTED=6
UPDATE public.radar_station SET status = 'APPROVED' WHERE approval_status = 5;
UPDATE public.radar_station SET status = 'REJECTED' WHERE approval_status = 6;
UPDATE public.radar_station SET status = 'DRAFT' WHERE approval_status = 0;
UPDATE public.radar_station SET status = 'PENDING_APPROVAL' WHERE approval_status IN (1, 2, 3, 4);

CREATE INDEX IF NOT EXISTS idx_radar_station_status ON public.radar_station (status);
