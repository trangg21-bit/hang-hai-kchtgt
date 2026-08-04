-- V20260804100100: Convert buoy_station and lighthouse_station approved_by to UUID + add missing columns
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
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.buoy_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lighthouse_station' AND column_name = 'approved_by') THEN
        ALTER TABLE public.lighthouse_station ALTER COLUMN approved_by TYPE UUID USING CASE WHEN approved_by IS NULL OR approved_by::text = '' THEN NULL WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END;
    END IF;
END $$;
