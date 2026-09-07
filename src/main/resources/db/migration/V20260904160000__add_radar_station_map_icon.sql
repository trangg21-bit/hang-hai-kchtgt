-- V20260904160000: Add map_icon column to radar_station
ALTER TABLE public.radar_station ADD COLUMN IF NOT EXISTS map_icon VARCHAR(64);
