-- V85__convert_audit_fields_to_uuid.sql
-- Converts all created_by, updated_by, deleted_by, and approved_by text columns to UUID natively.
-- Uses `USING NULLIF(column, '')::uuid` to ensure that empty strings become null instead of failing on cast.

DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name IN ('created_by', 'updated_by', 'deleted_by', 'approved_by', 'nguoi_tao', 'nguoi_sua_doi', 'nguoi_ky', 'nguoi_phe_duyet', 'nguoi_dang_ky')
          AND data_type IN ('character varying', 'text', 'varchar')
    LOOP
        EXECUTE format(
            'ALTER TABLE %I ALTER COLUMN %I TYPE UUID USING NULLIF(%I, '''')::uuid;',
            row.table_name, row.column_name, row.column_name
        );
    END LOOP;
END;
$$;
