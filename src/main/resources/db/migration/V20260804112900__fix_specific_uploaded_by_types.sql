-- V20260804112900: Explicitly set uploaded_by column types to match JPA entity definitions
DO $$
BEGIN
    -- 1. UUID types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'uploaded_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.vts_system_attachment ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL WHEN uploaded_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'uploaded_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.port_attachments ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL WHEN uploaded_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::text::uuid ELSE NULL END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'symbol_library' AND column_name = 'uploaded_by' AND udt_name != 'uuid') THEN
        ALTER TABLE public.symbol_library ALTER COLUMN uploaded_by TYPE UUID USING CASE WHEN uploaded_by IS NULL OR uploaded_by::text = '' THEN NULL WHEN uploaded_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN uploaded_by::text::uuid ELSE NULL END;
    END IF;

    -- 2. VARCHAR types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.radar_station_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.navigation_channel_attachment ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;
