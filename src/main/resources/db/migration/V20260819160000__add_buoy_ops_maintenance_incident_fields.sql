-- V20260819160000: Bổ sung 14 trường theo CSV 'QL Phao tiêu' STT 41/44/45-56
-- (2 Nội dung phê duyệt + Thông tin vận hành khai thác 45-48 + Thông tin bảo trì 49-52 + Thông tin sự cố 53-56)
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS level1_approval_content VARCHAR(1000);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS level2_approval_content VARCHAR(1000);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS operation_plan_code VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS operation_plan_name VARCHAR(255);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS operation_start_date VARCHAR(50);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS operation_end_date VARCHAR(50);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS maintenance_plan_code VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS maintenance_plan_name VARCHAR(255);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS maintenance_start_time VARCHAR(50);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS maintenance_end_time VARCHAR(50);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS incident_code VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS incident_type VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS incident_location VARCHAR(500);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS incident_time VARCHAR(50);
