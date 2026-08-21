-- V20260821110000: Bến cảng (berths) — luồng hàng hải theo GIS LineObject (WATERWAY)
-- Giống BuoyStation (nhà trạm Phao, tiêu): lưu waterway_id (id của GIS LineObject loại WATERWAY),
-- tên luồng do frontend resolve qua lineObjectService (status=PUBLISHED).
ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS waterway_id UUID;
CREATE INDEX IF NOT EXISTS idx_berths_waterway_id ON public.berths(waterway_id);
