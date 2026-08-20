-- V20260820000000: Add missing org_unit_id column to beacon_light table.
-- Entity BeaconLight.java declares orgUnitId (UUID FK to org_units) but the
-- existing migration V20260819000000 did NOT include it, causing:
--   "ERROR: column bl1_0.org_unit_id does not exist" at startup.
-- ADD COLUMN IF NOT EXISTS = no-op if already present (idempotent).

ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS org_unit_id UUID;

-- Also ensure unit_id column exists (entity also declares unitId UUID).
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS unit_id UUID;

-- Ensure other columns declared in entity but possibly missing:
-- province_id INTEGER
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS province_id INTEGER;

-- approval_status enum (entity uses EnumType.STRING)
-- V20260804145000 may have set it to VARCHAR, ensure it's VARCHAR for STRING enum.
ALTER TABLE public.beacon_light ALTER COLUMN approval_status TYPE VARCHAR(50) USING approval_status::text;

-- security_level SMALLINT
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS security_level SMALLINT DEFAULT 0;
ALTER TABLE public.beacon_light ALTER COLUMN security_level SET DEFAULT 0;

-- spatial_id UUID
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS spatial_id UUID;

-- approved_by UUID
-- approved_date TIMESTAMP
-- approval_level INTEGER
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS approval_level INTEGER;

-- rejection_reason VARCHAR(500)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);

-- staff_count, tower_height (entity has these)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS staff_count INTEGER;
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS tower_height DOUBLE PRECISION;

-- structure (entity has this)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS structure VARCHAR(500);

-- shape VARCHAR(255) (entity declares String, NOT PostGIS geometry)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS shape VARCHAR(255);

-- light_height DOUBLE PRECISION
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS light_height DOUBLE PRECISION;

-- geographic_range VARCHAR(20)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS geographic_range VARCHAR(20);

-- backup_light_model VARCHAR(100)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS backup_light_model VARCHAR(100);

-- power_supply VARCHAR(500)
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS power_supply VARCHAR(500);

-- station_area DOUBLE PRECISION
ALTER TABLE public.beacon_light ADD COLUMN IF NOT EXISTS station_area DOUBLE PRECISION;
