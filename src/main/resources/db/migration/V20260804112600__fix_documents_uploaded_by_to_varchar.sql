-- V20260804112600: Revert documents.uploaded_by to VARCHAR(36) and convert attachment tables uploaded_by to UUID
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Revert documents.uploaded_by to VARCHAR(36)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by' AND udt_name = 'uuid') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by TYPE VARCHAR(36) USING uploaded_by::text;
    END IF;

    -- 2. Convert uploaded_by to UUID for attachment tables ending with _attachment or _attachments
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND udt_name != 'uuid'
          AND column_name = 'uploaded_by'
          AND (table_name LIKE '%\_attachment' ESCAPE '\' OR table_name LIKE '%\_attachments' ESCAPE '\')
    LOOP
        EXECUTE format(
            'ALTER TABLE public.%I ALTER COLUMN %I TYPE UUID USING CASE WHEN %I IS NULL OR %I::text = '''' THEN NULL WHEN %I::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN %I::text::uuid ELSE NULL END',
            r.table_name, r.column_name, r.column_name, r.column_name, r.column_name, r.column_name
        );
    END LOOP;
END $$;
