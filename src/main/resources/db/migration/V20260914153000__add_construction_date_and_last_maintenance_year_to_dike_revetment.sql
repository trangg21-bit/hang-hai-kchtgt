-- Migration: Add construction_date and last_maintenance_year to dike_revetment
-- Version: V20260914153000

ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS construction_date DATE;
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS last_maintenance_year INTEGER;
