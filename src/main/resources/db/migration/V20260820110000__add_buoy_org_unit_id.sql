-- V20260820110000: Add missing org_unit_id column to buoy table.
-- Entity Buoy.java declares orgUnitId (UUID FK to org_units) but no migration
-- ever added the column, causing at runtime:
--   "ERROR: column b1_0.org_unit_id does not exist"  (BuoyService.search)
-- Counterpart of V20260820000000 (beacon_light). Idempotent.

ALTER TABLE public.buoy ADD COLUMN IF NOT EXISTS org_unit_id UUID;

-- Index for the orgUnitFilter used by DataScopeAspect on every list query.
CREATE INDEX IF NOT EXISTS idx_buoy_org_unit ON public.buoy(org_unit_id);
