-- Convert user group and membership enum columns to SMALLINT ordinals.
DO $$
DECLARE
    column_type TEXT;
BEGIN
    IF to_regclass('public.user_groups') IS NOT NULL THEN
        ALTER TABLE public.user_groups DROP CONSTRAINT IF EXISTS user_groups_grouptype_check;
        ALTER TABLE public.user_groups DROP CONSTRAINT IF EXISTS chk_user_groups_group_type;
        ALTER TABLE public.user_groups DROP CONSTRAINT IF EXISTS user_groups_status_check;

        SELECT data_type INTO column_type
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'group_type';
        IF column_type IN ('character varying', 'text', 'character') THEN
            ALTER TABLE public.user_groups ALTER COLUMN group_type DROP DEFAULT;
            ALTER TABLE public.user_groups
                ALTER COLUMN group_type TYPE smallint
                USING CASE LOWER(TRIM(group_type::text))
                    WHEN 'department' THEN 0
                    WHEN 'project' THEN 1
                    WHEN 'custom' THEN 2
                    WHEN '0' THEN 0
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    ELSE 2
                END::smallint;
        END IF;
        ALTER TABLE public.user_groups ALTER COLUMN group_type SET DEFAULT 2;

        SELECT data_type INTO column_type
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'user_groups' AND column_name = 'status';
        IF column_type IN ('character varying', 'text', 'character') THEN
            ALTER TABLE public.user_groups ALTER COLUMN status DROP DEFAULT;
            ALTER TABLE public.user_groups
                ALTER COLUMN status TYPE smallint
                USING CASE UPPER(TRIM(status::text))
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'INACTIVE' THEN 1
                    WHEN '0' THEN 0
                    WHEN '1' THEN 1
                    ELSE 1
                END::smallint;
        END IF;
        ALTER TABLE public.user_groups ALTER COLUMN status SET DEFAULT 0;
    END IF;
END $$;

DO $$
DECLARE
    column_type TEXT;
BEGIN
    IF to_regclass('public.group_members') IS NOT NULL THEN
        ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_status_check;
        SELECT data_type INTO column_type
          FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'status';
        IF column_type IN ('character varying', 'text', 'character') THEN
            ALTER TABLE public.group_members ALTER COLUMN status DROP DEFAULT;
            ALTER TABLE public.group_members
                ALTER COLUMN status TYPE smallint
                USING CASE UPPER(TRIM(status::text))
                    WHEN 'ACTIVE' THEN 0
                    WHEN 'REMOVED' THEN 1
                    WHEN 'BANNED' THEN 2
                    WHEN '0' THEN 0
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    ELSE 1
                END::smallint;
        END IF;
        ALTER TABLE public.group_members ALTER COLUMN status SET DEFAULT 0;
    END IF;
END $$;
