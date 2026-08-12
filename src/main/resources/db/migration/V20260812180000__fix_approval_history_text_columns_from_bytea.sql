-- Convert legacy BYTEA audit columns to TEXT. PostgreSQL cannot apply LOWER()
-- to BYTEA, which breaks the history search query.
DO $$
DECLARE
    target_column_name text;
BEGIN
    FOREACH target_column_name IN ARRAY ARRAY['changed_field', 'previous_value', 'new_value', 'reason'] LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns c
            WHERE c.table_schema = 'public'
              AND c.table_name = 'approval_history'
              AND c.column_name = target_column_name
              AND c.udt_name = 'bytea'
        ) THEN
            EXECUTE format(
                'ALTER TABLE public.approval_history ALTER COLUMN %I TYPE TEXT USING convert_from(%I, ''UTF8'')',
                target_column_name,
                target_column_name
            );
        END IF;
    END LOOP;
END $$;
