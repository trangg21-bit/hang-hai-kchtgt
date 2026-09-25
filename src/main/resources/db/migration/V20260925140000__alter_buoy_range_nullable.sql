-- V20260925140000: Cho phép range (Phạm vi chiếu sáng / Tầm hiệu lực) là NULL trên bảng buoy
ALTER TABLE public.buoy ALTER COLUMN range DROP NOT NULL;
