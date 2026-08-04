CREATE TABLE IF NOT EXISTS vts_system_attachment (
    id UUID PRIMARY KEY,
    uploaded_by VARCHAR(100)
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vts_system_attachment' AND column_name='uploaded_by' AND udt_name <> 'uuid') THEN
    ALTER TABLE vts_system_attachment ADD COLUMN IF NOT EXISTS uploaded_by_new UUID;
    UPDATE vts_system_attachment
    SET uploaded_by_new = CASE
        WHEN uploaded_by IS NULL OR btrim(uploaded_by::text) = '' THEN NULL
        WHEN btrim(uploaded_by::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            THEN btrim(uploaded_by::text)::UUID
        ELSE NULL
    END;
    ALTER TABLE vts_system_attachment DROP COLUMN uploaded_by;
    ALTER TABLE vts_system_attachment RENAME COLUMN uploaded_by_new TO uploaded_by;
  END IF;
END $$;
