-- V20260804112100: Convert shared_data and statistics_forms created_by/updated_by to UUID
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'created_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL WHEN created_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN created_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'updated_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL WHEN updated_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN updated_by::text::uuid ELSE NULL END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'created_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN created_by TYPE UUID USING CASE WHEN created_by IS NULL OR created_by::text = '' THEN NULL WHEN created_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN created_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'updated_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN updated_by TYPE UUID USING CASE WHEN updated_by IS NULL OR updated_by::text = '' THEN NULL WHEN updated_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN updated_by::text::uuid ELSE NULL END;
    END IF;
END $$;
