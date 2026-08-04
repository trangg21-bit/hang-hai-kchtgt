-- V20260804111800: Revert port_planning and planning_adjustments created_by/updated_by to VARCHAR(100)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'created_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::text;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_planning' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.port_planning ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'planning_adjustments' AND column_name = 'updated_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.planning_adjustments ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::text;
    END IF;
END $$;
