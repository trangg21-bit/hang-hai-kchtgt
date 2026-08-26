-- =========================================================
-- Migration V123: Drop unused CCTV-specific history tables
-- The CCTV module uses shared change_logs and approval_logs tables
-- (same as Port and other modules), keyed by entity_type.
-- =========================================================

-- Drop CCTV-specific change_log table (replaced by shared change_logs)
DROP TABLE IF EXISTS public.cctv_change_log CASCADE;

-- Drop CCTV-specific approval_log table (replaced by shared approval_logs)
DROP TABLE IF EXISTS public.cctv_approval_log CASCADE;
