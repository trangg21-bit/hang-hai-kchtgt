-- V20260818180000: Bổ sung cột last_repair_date (Thời điểm sửa chữa gần nhất — CSV STT 24)
-- và cho phép cột type NULL (trường "Loại phao tiêu" đã bỏ khỏi form tạo/sửa phao tiêu).
ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS last_repair_date DATE;
ALTER TABLE public.buoy ALTER COLUMN type DROP NOT NULL;
