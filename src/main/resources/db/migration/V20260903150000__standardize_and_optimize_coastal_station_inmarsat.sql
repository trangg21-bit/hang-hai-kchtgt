-- ==============================================================================
-- Migration: Standardize and Optimize coastal_station_inmarsat (M-004)
-- Timestamp: 20260903150000
-- 1. Backfill canonical columns from legacy duplicate columns (idempotent)
-- 2. Convert condition_status from VARCHAR to SMALLINT (0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE, 3=UNDER_CONSTRUCTION)
-- 3. Drop legacy check constraints, duplicate columns, is_active, location_detail, and flat GIS columns
-- 4. Shrink contact_phone to VARCHAR(20)
-- 5. Add symbol_id UUID and create performance indexes
-- 6. Backfill gis_spatial_objects and link spatial_id
-- ==============================================================================

-- 1. Backfill canonical columns before dropping duplicates (idempotent via dynamic SQL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'device_code'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET code = device_code WHERE code IS NULL AND device_code IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'station_name'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET name = station_name WHERE name IS NULL AND station_name IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'unit_id'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET org_unit_id = unit_id WHERE org_unit_id IS NULL AND unit_id IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'coverage_zone'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET coverage_area = coverage_zone WHERE coverage_area IS NULL AND coverage_zone IS NOT NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'description'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET notes = description WHERE notes IS NULL AND description IS NOT NULL';
    END IF;

    -- Backfill location_detail into location_address if location_address is null
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'location_detail'
    ) THEN
        EXECUTE 'UPDATE public.coastal_station_inmarsat SET location_address = location_detail WHERE location_address IS NULL AND location_detail IS NOT NULL';
    END IF;
END $$;

-- 2. Convert condition_status from VARCHAR/TEXT to SMALLINT
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'coastal_station_inmarsat' 
          AND column_name = 'condition_status' 
          AND data_type IN ('character varying', 'text')
    ) THEN
        EXECUTE 'ALTER TABLE public.coastal_station_inmarsat 
            ALTER COLUMN condition_status TYPE SMALLINT 
            USING (
                CASE condition_status
                    WHEN ''OPERATIONAL'' THEN 0
                    WHEN ''STOPPED'' THEN 1
                    WHEN ''NON_OPERATIONAL'' THEN 1
                    WHEN ''NOT_OPERATIONAL'' THEN 1
                    WHEN ''TEMPORARILY_CLOSED'' THEN 1
                    WHEN ''MAINTENANCE'' THEN 2
                    WHEN ''DEGRADED'' THEN 2
                    WHEN ''UNDER_CONSTRUCTION'' THEN 3
                    WHEN ''STANDBY'' THEN 0
                    ELSE 0
                END
            )';
    END IF;
END $$;

-- 3. Drop legacy check constraints, duplicate columns, is_active, location_detail, and flat GIS columns
ALTER TABLE public.coastal_station_inmarsat DROP CONSTRAINT IF EXISTS coastal_station_inmarsat_status_check;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS device_code;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS station_name;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS unit_id;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS coverage_zone;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS description;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS security_level;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS location_detail;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS object_type;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS coordinate_system;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS display_rule;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS symbol;

-- 4. Shrink contact_phone to VARCHAR(20)
ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN contact_phone TYPE VARCHAR(20);

-- 5. Add symbol_id UUID column and create missing performance indexes
ALTER TABLE public.coastal_station_inmarsat ADD COLUMN IF NOT EXISTS symbol_id UUID;

CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_org_unit ON public.coastal_station_inmarsat (org_unit_id);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_approval_status ON public.coastal_station_inmarsat (approval_status);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_condition_status ON public.coastal_station_inmarsat (condition_status);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_deleted_at ON public.coastal_station_inmarsat (deleted_at);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_province_id ON public.coastal_station_inmarsat (province_id);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_operating_org ON public.coastal_station_inmarsat (operating_org_id);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_spatial_id ON public.coastal_station_inmarsat (spatial_id);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_symbol ON public.coastal_station_inmarsat (symbol_id);
CREATE INDEX IF NOT EXISTS idx_cs_inmarsat_code ON public.coastal_station_inmarsat (code);

-- 6. Ensure audit columns on gis_spatial_objects and backfill
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE public.gis_spatial_objects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

INSERT INTO public.gis_spatial_objects (
    id, name, code, geometry_type, object_type, coordinates, ref_id, ref_type, status, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'Dai Inmarsat ' || COALESCE(name, code, 'Inmarsat'),
    'INMARSAT_' || id::text,
    0, -- GisGeometryType.POINT (ordinal 0)
    5, -- GisSpatialObjectType.POINT_OTHER (ordinal 5)
    '[' || longitude::text || ',' || latitude::text || ']',
    id,
    20, -- InfrastructureType.INMARSAT_STATION (ordinal 20)
    1, -- GisSpatialStatus.PUBLISHED (ordinal 1)
    NOW(),
    NOW()
FROM public.coastal_station_inmarsat
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND spatial_id IS NULL 
  AND deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Link newly created spatial_id back to coastal_station_inmarsat
UPDATE public.coastal_station_inmarsat c
SET spatial_id = g.id
FROM public.gis_spatial_objects g
WHERE g.ref_id = c.id 
  AND g.ref_type = 20
  AND c.spatial_id IS NULL;

-- 7. Normalize notes to VARCHAR(2000) and drop redundant latitude/longitude
ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN notes TYPE VARCHAR(2000);
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS latitude;
ALTER TABLE public.coastal_station_inmarsat DROP COLUMN IF EXISTS longitude;
