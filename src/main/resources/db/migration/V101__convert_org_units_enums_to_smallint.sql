-- V101: Convert org_units enums (status, type/unit_type) to smallint for Hibernate 6 compatibility

DO $$
BEGIN
    -- Skip entirely if the table does not exist (e.g. fresh H2 DB or empty test fixture)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'org_units') THEN
        RAISE NOTICE 'V101: org_units does not exist — skipping';
        RETURN;
    END IF;

    -- Drop text-based check constraints if they exist
    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_status_check;
    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_unit_type_check;
    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_type_check;

    -- Fix 'status' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'status' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.org_units ALTER COLUMN status TYPE smallint USING (
            CASE status
                WHEN 'DRAFT' THEN 0
                WHEN 'PENDING' THEN 1
                WHEN 'APPROVED' THEN 2
                WHEN 'REJECTED' THEN 3
                ELSE 0
            END
        );
        RAISE NOTICE 'V101: org_units.status converted to smallint';
    END IF;

    -- Fix 'unit_type' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'unit_type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.org_units ALTER COLUMN unit_type TYPE smallint USING (
            CASE unit_type
                WHEN 'CUC' THEN 0
                WHEN 'CHI_CUC' THEN 1
                WHEN 'CANG_VU' THEN 2
                WHEN 'TCT' THEN 3
                ELSE 0
            END
        );
        RAISE NOTICE 'V101: org_units.unit_type converted to smallint';
    END IF;

    -- Fix 'type' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'type' AND data_type IN ('character varying', 'text')) THEN
        ALTER TABLE public.org_units ALTER COLUMN type TYPE smallint USING (
            CASE type
                WHEN 'CUC' THEN 0
                WHEN 'CHI_CUC' THEN 1
                WHEN 'CANG_VU' THEN 2
                WHEN 'TCT' THEN 3
                ELSE 0
            END
        );
        RAISE NOTICE 'V101: org_units.type converted to smallint';
    END IF;
END $$;
