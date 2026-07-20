-- Flyway Migration V56: Remove Redundant Coordinate Fields from KCHT tables

-- 1. ben_cang
ALTER TABLE public.ben_cang DROP COLUMN IF EXISTS vi_do;
ALTER TABLE public.ben_cang DROP COLUMN IF EXISTS kinh_do;

-- 2. cang_bien
ALTER TABLE public.cang_bien DROP COLUMN IF EXISTS vi_do;
ALTER TABLE public.cang_bien DROP COLUMN IF EXISTS kinh_do;

-- 3. cang_can
ALTER TABLE public.cang_can DROP COLUMN IF EXISTS vi_do;
ALTER TABLE public.cang_can DROP COLUMN IF EXISTS kinh_do;

-- 4. tram_radar
ALTER TABLE public.tram_radar DROP COLUMN IF EXISTS vi_do;
ALTER TABLE public.tram_radar DROP COLUMN IF EXISTS kinh_do;

-- 5. beacon_light
ALTER TABLE public.beacon_light DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.beacon_light DROP COLUMN IF EXISTS longitude;

-- 6. buoy
ALTER TABLE public.buoy DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.buoy DROP COLUMN IF EXISTS longitude;
