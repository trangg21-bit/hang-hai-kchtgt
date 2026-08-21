-- Add "Mã đê kè" (ma) and "Thuộc cảng biển" (cang_bien_id) to dike_revetment
-- so the list screen columns are fully populated (parity with beacon/port family).
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS ma VARCHAR(100);
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS cang_bien_id UUID;
