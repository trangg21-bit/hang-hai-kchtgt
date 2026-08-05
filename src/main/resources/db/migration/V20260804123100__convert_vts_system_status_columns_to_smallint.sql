-- Convert vts_system status columns to SMALLINT matching EnumType.ORDINAL
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'condition_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.vts_system ALTER COLUMN condition_status TYPE SMALLINT USING CASE WHEN condition_status::text ~ '^[0-9]+$' THEN condition_status::integer::smallint ELSE 0 END;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system' AND column_name = 'approval_status' AND udt_name != 'int2') THEN
        ALTER TABLE public.vts_system ALTER COLUMN approval_status TYPE SMALLINT USING CASE WHEN approval_status::text ~ '^[0-9]+$' THEN approval_status::integer::smallint ELSE 0 END;
    END IF;
END $$;
