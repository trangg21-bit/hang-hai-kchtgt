-- V102: Convert remaining columns (approver_level1, approver_level2, actor, statistics_forms.id) to UUID

DO $$
DECLARE
    r record;
    uuid_re CONSTANT text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
    bad_rows bigint;
BEGIN
    -- Handle missing UUID columns
    FOR r IN
        SELECT c.table_name, c.column_name, c.is_nullable, c.data_type
          FROM information_schema.columns c
         WHERE c.table_schema = 'public'
           AND c.column_name IN ('approver_level1', 'approver_level2', 'approver_level3', 'actor')
           AND c.data_type IN ('character varying', 'character', 'text', 'bigint', 'integer')
    LOOP
        -- For text columns, neutralize invalid UUIDs
        IF r.data_type IN ('character varying', 'character', 'text') THEN
            EXECUTE format(
                'UPDATE %I SET %I = %L WHERE %I IS NOT NULL AND %I !~ %L',
                r.table_name, r.column_name,
                CASE WHEN r.is_nullable = 'NO' THEN '00000000-0000-0000-0000-000000000000' END,
                r.column_name, r.column_name, uuid_re);
                
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
            EXECUTE format(
                'ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING NULLIF(%I, '''')::uuid',
                r.table_name, r.column_name, r.column_name);
        ELSE
            -- For numeric columns (bigint/integer), set to NULL if nullable, otherwise nil UUID
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP DEFAULT', r.table_name, r.column_name);
            EXECUTE format(
                'ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING CASE WHEN %L = ''YES'' THEN NULL ELSE ''00000000-0000-0000-0000-000000000000''::uuid END',
                r.table_name, r.column_name, r.is_nullable);
        END IF;
        RAISE NOTICE 'V102: %.% converted to uuid', r.table_name, r.column_name;
    END LOOP;

    -- Handle statistics_forms ID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'statistics_forms' AND column_name = 'id' AND data_type IN ('bigint', 'integer', 'smallint')) THEN
        ALTER TABLE public.statistics_forms ALTER COLUMN id DROP IDENTITY IF EXISTS;
        ALTER TABLE public.statistics_forms ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE public.statistics_forms ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        RAISE NOTICE 'V102: statistics_forms.id converted to uuid';
    END IF;
END $$;
