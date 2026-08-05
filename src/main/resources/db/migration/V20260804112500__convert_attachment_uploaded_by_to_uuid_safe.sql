-- V20260804112500: Convert uploaded_by to UUID across all attachment tables with NOT NULL fallback
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND udt_name != 'uuid'
          AND column_name = 'uploaded_by'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING CASE WHEN %I IS NULL OR %I::text = '''' THEN ''00000000-0000-0000-0000-000000000000''::uuid WHEN %I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::text::uuid ELSE ''00000000-0000-0000-0000-000000000000''::uuid END',
            r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name
        );
    END LOOP;
END $$;
