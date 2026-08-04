-- V20260804100000: Convert approval_history.approved_date to TIMESTAMP WITHOUT TIME ZONE
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
