-- V20260821100000: Bến cảng (berths) — thêm luồng hàng hải + nội dung phê duyệt 2 cấp
-- CSV 'QL Bến cảng': #5 Thuộc luồng hàng hải; #34/#37 Nội dung phê duyệt
-- (parity với Buoy level1_approval_content / level2_approval_content — @Size max 1000)
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS port_authority_approval_content VARCHAR(1000);
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS department_approval_content VARCHAR(1000);
CREATE INDEX IF NOT EXISTS idx_berths_navigation_channel_id ON public.berths(navigation_channel_id);
