-- V20260820120000: Convert buoy_station UUID-mapped columns to real uuid type
--
-- Root cause: BuoyStation entity maps these columns as UUID
-- (BuoyStation.java:56-145, BaseEntity.java:82-98) but the legacy schema
-- created them as VARCHAR and the repair migration V20260803370000 skipped
-- the buoy_station section (lines 2168-2226) — Hibernate UUIDJdbcType then
-- reads a String and throws ClassCastException on GET /v1/buoy-station
-- (BuoyStationService.findAll). Idempotent: only converts columns whose
-- udt_name is not already uuid; invalid/empty values become NULL.

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS unit_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'unit_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN unit_id TYPE UUID USING CASE WHEN unit_id IS NULL OR unit_id::text = '' THEN NULL WHEN unit_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN unit_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operating_org_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'operating_org_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN operating_org_id TYPE UUID USING CASE WHEN operating_org_id IS NULL OR operating_org_id::text = '' THEN NULL WHEN operating_org_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN operating_org_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS port_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'port_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN port_id TYPE UUID USING CASE WHEN port_id IS NULL OR port_id::text = '' THEN NULL WHEN port_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN port_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS waterway_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'waterway_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN waterway_id TYPE UUID USING CASE WHEN waterway_id IS NULL OR waterway_id::text = '' THEN NULL WHEN waterway_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN waterway_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS waterway_route_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'waterway_route_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN waterway_route_id TYPE UUID USING CASE WHEN waterway_route_id IS NULL OR waterway_route_id::text = '' THEN NULL WHEN waterway_route_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN waterway_route_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS spatial_id UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'spatial_id' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN spatial_id TYPE UUID USING CASE WHEN spatial_id IS NULL OR spatial_id::text = '' THEN NULL WHEN spatial_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN spatial_id::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level1_approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'level1_approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN level1_approved_by TYPE UUID USING CASE WHEN level1_approved_by IS NULL OR level1_approved_by::text = '' THEN NULL WHEN level1_approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN level1_approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS level2_approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'level2_approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN level2_approved_by TYPE UUID USING CASE WHEN level2_approved_by IS NULL OR level2_approved_by::text = '' THEN NULL WHEN level2_approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN level2_approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS sent_approved_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'sent_approved_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN sent_approved_by TYPE UUID USING CASE WHEN sent_approved_by IS NULL OR sent_approved_by::text = '' THEN NULL WHEN sent_approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN sent_approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS created_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'created_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL WHEN created_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN created_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS updated_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'updated_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL WHEN updated_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN updated_by::text::uuid ELSE NULL END;
    END IF;
END $$;

ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS deleted_by UUID;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'deleted_by' AND udt_name <> 'uuid') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN deleted_by TYPE UUID USING CASE WHEN deleted_by IS NULL OR deleted_by::text = '' THEN NULL WHEN deleted_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN deleted_by::text::uuid ELSE NULL END;
    END IF;
END $$;
