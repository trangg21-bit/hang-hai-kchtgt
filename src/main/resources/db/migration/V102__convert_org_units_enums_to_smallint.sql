-- Convert org unit status/type values to SMALLINT ordinals.
DO $$
DECLARE
    column_type TEXT;
BEGIN
    IF to_regclass('public.org_units') IS NULL THEN
        RETURN;
    END IF;

    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_status_check;
    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_unit_type_check;
    ALTER TABLE public.org_units DROP CONSTRAINT IF EXISTS org_units_type_check;

    SELECT data_type INTO column_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'status';
    IF column_type IN ('character varying', 'text', 'character') THEN
        ALTER TABLE public.org_units ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE public.org_units
            ALTER COLUMN status TYPE smallint
            USING CASE UPPER(TRIM(status::text))
                WHEN 'DRAFT' THEN 0
                WHEN 'PENDING' THEN 1
                WHEN 'APPROVED' THEN 2
                WHEN 'REJECTED' THEN 3
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                ELSE 0
            END::smallint;
    END IF;

    SELECT data_type INTO column_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'unit_type';
    IF column_type IN ('character varying', 'text', 'character') THEN
        ALTER TABLE public.org_units ALTER COLUMN unit_type DROP DEFAULT;
        ALTER TABLE public.org_units
            ALTER COLUMN unit_type TYPE smallint
            USING CASE UPPER(TRIM(unit_type::text))
                WHEN 'CUC' THEN 0
                WHEN 'CHI_CUC' THEN 1
                WHEN 'CANG_VU' THEN 2
                WHEN 'TCT' THEN 3
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                ELSE 0
            END::smallint;
    END IF;

    SELECT data_type INTO column_type
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'org_units' AND column_name = 'type';
    IF column_type IN ('character varying', 'text', 'character') THEN
        ALTER TABLE public.org_units ALTER COLUMN type DROP DEFAULT;
        ALTER TABLE public.org_units
            ALTER COLUMN type TYPE smallint
            USING CASE UPPER(TRIM(type::text))
                WHEN 'CUC' THEN 0
                WHEN 'CHI_CUC' THEN 1
                WHEN 'CANG_VU' THEN 2
                WHEN 'TCT' THEN 3
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                ELSE 0
            END::smallint;
    END IF;
END $$;
