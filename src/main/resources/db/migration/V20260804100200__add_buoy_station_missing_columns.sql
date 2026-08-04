-- V20260804100200: Add missing columns for buoy_station table & convert all station approved_by to UUID
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS province_id INTEGER;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operating_org_id UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS port_id UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS waterway_id UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS waterway_route_id UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS province VARCHAR(100);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS address VARCHAR(500);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS construction_date DATE;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS commissioning_date DATE;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS investment_capital DOUBLE PRECISION;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS capital_source VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS management_agency VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS operating_agency VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS note VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS spatial_id UUID;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS type VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS color VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS shape VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS light_characteristic VARCHAR(255);
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS range DOUBLE PRECISION;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS last_inspection_date DATE;
ALTER TABLE public.buoy_station ADD COLUMN IF NOT EXISTS next_inspection_date DATE;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_cospas_sarsat' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_cospas_sarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_vts' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_vts ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_lrit ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_haiphong ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_inmarsat' AND column_name = 'approved_by') THEN
        ALTER TABLE public.coastal_station_inmarsat ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;
