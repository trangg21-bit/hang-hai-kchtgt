-- V20260818170000: Bổ sung cột cho bảng buoy theo đặc tả CSV 'QL Phao tiêu' (56 trường, 10 nhóm)
-- Form Tạo mới / Chỉnh sửa: nhà trạm QLVH, phân loại, địa điểm, tình trạng, thông số kỹ thuật đèn/thân phao,
-- đặc tính ánh sáng, thời điểm đưa vào sử dụng (CSV STT 2-5, 9-10, 12-23, 25-27).
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS buoy_station_id UUID;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS classification VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS classification_buoy VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS classification_mark VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS location_detail VARCHAR(500);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS condition VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS structure VARCHAR(500);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS area DOUBLE PRECISION;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS body_height DOUBLE PRECISION;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS diameter DOUBLE PRECISION;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS beacon_light VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS tower_height DOUBLE PRECISION;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS light_height DOUBLE PRECISION;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS light_model VARCHAR(200);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS tower_color VARCHAR(200);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS power_supply VARCHAR(500);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS commissioned_date DATE;
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS light_color VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS flash_type VARCHAR(100);
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS period VARCHAR(100);
