-- Migration: Drop legacy condition_status check constraints on vts_system and vts_zone
-- Description: ConditionStatus enum was expanded to support NOT_YET_OPERATIONAL (4) and SUSPENDED (5)
--              for VTS system. The legacy check constraints (0 <= condition_status <= 3) caused
--              DataIntegrityViolationException on create/update with new status values.

ALTER TABLE public.vts_system DROP CONSTRAINT IF EXISTS vts_system_condition_status_check;
ALTER TABLE public.vts_zone DROP CONSTRAINT IF EXISTS vts_zone_condition_status_check;
