-- Store audit event times with time, minute and second precision.
-- The application maps this column to java.time.LocalDateTime.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'approval_history'
          AND column_name = 'approved_date'
    ) THEN
        ALTER TABLE public.approval_history
            ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE
            USING approved_date::timestamp;

        ALTER TABLE public.approval_history
            ALTER COLUMN approved_date SET DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
