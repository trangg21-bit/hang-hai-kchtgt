-- ============================================================
-- Migration: Make vts_system_id nullable in vts_operation_center
-- Reason: Bug 7 - VtsOperationCenter should be allowed to be created/updated
-- without requiring vts_system_id. Aligns with F-293 BA specification
-- and SO-DO-VA-MA-TRAN-CHA-CON-KCHT.md section 4.
-- Format: VYYYYMMDDHHmmss__description.sql
-- ============================================================

ALTER TABLE public.vts_operation_center ALTER COLUMN vts_system_id DROP NOT NULL;
