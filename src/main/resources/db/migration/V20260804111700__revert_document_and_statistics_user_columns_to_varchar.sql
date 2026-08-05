-- V20260804111700: Revert document, statistics and datasharing created_by/updated_by/approved_by columns to VARCHAR
DO $$
BEGIN
    -- Document entities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.incidents ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_plannings' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_plannings ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_plannings' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_plannings ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'processing_progress' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.processing_progress ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
    END IF;

    -- Statistics entities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_form' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_form ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_form' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.statistics_form ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'form_approval_history' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.form_approval_history ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
    END IF;

    -- Datasharing entities
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'share_history' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.share_history ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shared_data' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.shared_data ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
    END IF;
END $$;
