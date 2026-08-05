-- Revert tables whose entities map created_by/updated_by/approved_by/uploaded_by as VARCHAR instead of UUID
DO $$
BEGIN
    -- planning_adjustments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'created_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;

    -- port_plannings
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_plannings' AND column_name = 'created_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.port_plannings ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_plannings' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.port_plannings ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;

    -- incidents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'created_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;

    -- documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;

    -- planning_files
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_files' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.planning_files ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    -- ship_repair_facility_attachments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.ship_repair_facility_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    -- radar_station_attachments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.radar_station_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    -- dike_revetment_attachments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachments' AND column_name = 'uploaded_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.dike_revetment_attachments ALTER COLUMN uploaded_by TYPE VARCHAR(100) USING uploaded_by::text;
    END IF;

    -- adjustment_approvals
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND data_type = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;
END $$;
