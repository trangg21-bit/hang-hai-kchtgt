-- Restore the database-level uniqueness guarantee for VTS system codes.
-- Fail explicitly instead of silently deleting or rewriting duplicate data.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.vts_system
        WHERE code IS NOT NULL
        GROUP BY code
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Không thể khôi phục tính duy nhất: bảng vts_system đang có mã bị trùng';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'vts_system'
          AND c.conname = 'uk_vts_system_code'
    ) THEN
        ALTER TABLE public.vts_system
            ADD CONSTRAINT uk_vts_system_code UNIQUE (code);
    END IF;
END $$;
