-- V20260819130000: Add operation/maintenance/incident + approval-content columns for buoy_station
-- (khớp CSV "QL Nhà trạm phao tiêu" — rows 30/33 và 39-50, read-only trên màn Chi tiết)
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operation_plan_code VARCHAR(100);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operation_plan_name VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operation_start_date VARCHAR(50);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operation_end_date VARCHAR(50);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS maintenance_plan_code VARCHAR(100);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS maintenance_plan_name VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS maintenance_start_time VARCHAR(50);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS maintenance_end_time VARCHAR(50);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS incident_code VARCHAR(100);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS incident_type VARCHAR(100);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS incident_location VARCHAR(500);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS incident_time VARCHAR(50);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(2000);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(2000);
