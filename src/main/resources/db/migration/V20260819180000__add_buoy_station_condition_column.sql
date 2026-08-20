-- V20260819180000: Add condition column for buoy_station
-- (Tình trạng giống màn Quản lý phao tiêu — 3 trạng thái: Chưa/Đang/Dừng khai thác vận hành)
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS condition VARCHAR(100);
