-- Drop stale Hibernate-generated check constraints that block the 2-level
-- rejection statuses (REJECTED_L1=7 / REJECTED_L2=8) added to StationStatus.
--
-- Root cause: these CHECK constraints were created by an OLD ddl-auto schema
-- state (before REJECTED_L1/REJECTED_L2 were appended to the enum) and are NOT
-- defined in any Flyway migration, so the enum growth never updated them.
-- Writing status 7/8 (reject at C1/C2) now violates the constraint and breaks
-- POST /api/v1/buoy-station/{id}/reject (DataIntegrityViolationException).
-- buoy_status_check was already dropped in V52; kept here IF EXISTS for safety.

ALTER TABLE public.buoy_station DROP CONSTRAINT IF EXISTS buoy_station_status_check;
ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS buoy_status_check;
