-- =========================================================
-- Migration: Remove security_level column from 4 tables
-- Tables: cctv, scada, transmission, vts_assist
-- Reason: security_level không còn cần thiết cho 4 module này
-- Date: 2026-09-03
-- =========================================================

-- Drop indexes first
DROP INDEX IF EXISTS index_cctv_active_organization_unit_security_level;
DROP INDEX IF EXISTS index_scada_active_organization_unit_security_level;
DROP INDEX IF EXISTS index_transmission_active_organization_unit_security_level;
DROP INDEX IF EXISTS index_vts_assist_active_organization_unit_security_level;

-- Drop columns
ALTER TABLE public.cctv DROP COLUMN IF EXISTS security_level;
ALTER TABLE public.scada DROP COLUMN IF EXISTS security_level;
ALTER TABLE public.transmission DROP COLUMN IF EXISTS security_level;
ALTER TABLE public.vts_assist DROP COLUMN IF EXISTS security_level;
