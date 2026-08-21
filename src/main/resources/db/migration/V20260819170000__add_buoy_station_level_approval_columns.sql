-- V20260819170000: Add level1/level2 approval columns for buoy_station
-- (parity with Buoy — hiển thị Người/Ngày duyệt Cảng vụ (L1) và Cục (L2) trên danh sách nhà trạm phao tiêu)
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level1_approved_by UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level1_approved_date TIMESTAMP;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level2_approved_by UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level2_approved_date TIMESTAMP;
