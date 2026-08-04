-- V20260804112800: Revert all uploaded_by columns across all public tables to VARCHAR(100)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND udt_name = 'uuid'
          AND column_name = 'uploaded_by'
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE VARCHAR(100) USING %I::text',
            r.table_name, r.column_name, r.column_name
        );
    END LOOP;
END $$;
