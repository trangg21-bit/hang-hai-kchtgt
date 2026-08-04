-- V20260804230000: Force convert all created_by, updated_by, deleted_by, approver_level1/2, approved_level1/2, org_unit_id, spatial_id, uploaded_by columns across infrastructure tables to UUID (excluding document tables: port_planning, adjustment_approvals, documents, attached_documents, planning_files)

DO $$
DECLARE
    r RECORD;
    fallback_expr TEXT;
BEGIN
    FOR r IN
        SELECT table_name, column_name, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name NOT IN ('port_planning', 'adjustment_approvals', 'attached_documents', 'planning_files', 'documents')
          AND column_name IN (
              'created_by', 'updated_by', 'deleted_by', 
              'approver_level1', 'approver_level2', 'approved_level1', 'approved_level2',
              'org_unit_id', 'spatial_id', 'uploaded_by'
          )
          AND data_type IN ('character varying', 'varchar', 'text')
    LOOP
        IF r.is_nullable = 'NO' THEN
            fallback_expr := '''00000000-0000-0000-0000-000000000000''::uuid';
        ELSE
            fallback_expr := 'NULL';
        END IF;

        EXECUTE format('
            ALTER TABLE public.%I 
            ALTER COLUMN %I TYPE UUID USING (
                CASE 
                    WHEN %I IS NULL OR trim(%I) = '''' THEN %s
                    WHEN %I ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' 
                    THEN %I::uuid 
                    ELSE %s 
                END
            )
        ', r.table_name, r.column_name, r.column_name, r.column_name, fallback_expr, r.column_name, r.column_name, fallback_expr);
    END LOOP;

    -- Ensure non-UUID document tables stay/revert to VARCHAR
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'port_planning' AND column_name = 'created_by' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.port_planning ALTER COLUMN created_by TYPE VARCHAR(255) USING created_by::text;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'port_planning' AND column_name = 'updated_by' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.port_planning ALTER COLUMN updated_by TYPE VARCHAR(255) USING updated_by::text;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'adjustment_approvals' AND column_name = 'approved_by' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(255) USING approved_by::text;
    END IF;
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'uploaded_by' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(255) USING uploaded_by::text;
    END IF;
END $$;
