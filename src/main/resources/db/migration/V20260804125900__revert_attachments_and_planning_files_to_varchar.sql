-- Revert uploaded_by on planning_files, ship_repair_facility_attachments, radar_station_attachments, dike_revetment_attachments to VARCHAR(100)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.radar_station_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;
END $$;
