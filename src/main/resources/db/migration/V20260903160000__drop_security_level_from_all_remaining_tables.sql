-- ==============================================================================
-- Migration: Drop security_level column from all remaining tables
-- Timestamp: 20260903160000
-- Data scope in the system is fully governed by org_unit_id and user role.
-- security_level is deprecated and completely removed.
-- ==============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'security_level'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS security_level CASCADE;', r.table_name);
    END LOOP;
END $$;

