-- =========================================================
-- Migration: Restore security_level column on vts_operation_center
-- Date: 2026-08-27
--
-- VtsOperationCenter extends BaseApprovableEntity whose securityLevel
-- field maps to security_level (SMALLINT NOT NULL, @Enumerated ORDINAL).
-- The column used to be DROPPED on every application startup by
-- MapSymbolSchemaMigrator (those drop lines were removed 2026-08-27),
-- which left entity and table out of sync:
--   ERROR: column voc1_0.security_level does not exist
-- Every other BaseApprovableEntity table (vts_system, radar_station, ...)
-- keeps this column; restore it here to match the entity contract.
-- =========================================================

ALTER TABLE public.vts_operation_center
    ADD COLUMN IF NOT EXISTS security_level SMALLINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.vts_operation_center.security_level
    IS 'Cấp độ bảo mật (0=Bình thường, 1=Hạn chế, 2=Mật)';
