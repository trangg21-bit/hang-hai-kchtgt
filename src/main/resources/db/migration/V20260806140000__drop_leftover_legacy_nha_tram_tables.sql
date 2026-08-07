-- V20260806140000: Drop leftover empty legacy nha_tram tables
-- All active data resides in English tables: lighthouse_station (357 rows), buoy_station (3 rows), station_history (14 rows).

DROP TABLE IF EXISTS public.nha_tram_den CASCADE;
DROP TABLE IF EXISTS public.nha_tram_phao CASCADE;
DROP TABLE IF EXISTS public.nha_tram_history CASCADE;
