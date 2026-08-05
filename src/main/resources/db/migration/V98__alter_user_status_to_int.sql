-- Convert app_users.status to the ordinal SMALLINT representation used by User.
-- Supports legacy VARCHAR values and the old PostgreSQL user_status enum.
DO $$
DECLARE
    column_type TEXT;
    enum_type TEXT;
BEGIN
    SELECT c.data_type, c.udt_name
      INTO column_type, enum_type
      FROM information_schema.columns c
     WHERE c.table_schema = 'public'
       AND c.table_name = 'app_users'
       AND c.column_name = 'status';

    IF column_type = 'USER-DEFINED' AND enum_type = 'user_status' THEN
        ALTER TABLE app_users ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE app_users ALTER COLUMN status TYPE varchar(20) USING status::text;
        DROP TYPE user_status;
    END IF;
END $$;

DO $$
DECLARE
    column_type TEXT;
BEGIN
    SELECT data_type INTO column_type
      FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'app_users'
       AND column_name = 'status';

    IF column_type IN ('character varying', 'text', 'character') THEN
        ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_status_check;
        ALTER TABLE app_users ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE app_users
            ALTER COLUMN status TYPE smallint
            USING CASE UPPER(TRIM(status::text))
                WHEN 'ACTIVE' THEN 0
                WHEN 'INACTIVE' THEN 1
                WHEN 'LOCKED' THEN 2
                WHEN 'DELETED' THEN 3
                WHEN 'PENDING_VERIFICATION' THEN 4
                WHEN 'PENDING_APPROVAL' THEN 5
                WHEN '0' THEN 0
                WHEN '1' THEN 1
                WHEN '2' THEN 2
                WHEN '3' THEN 3
                WHEN '4' THEN 4
                WHEN '5' THEN 5
                ELSE 0
            END::smallint;
    ELSIF column_type IN ('integer', 'bigint') THEN
        ALTER TABLE app_users ALTER COLUMN status DROP DEFAULT;
        ALTER TABLE app_users
            ALTER COLUMN status TYPE smallint
            USING status::smallint;
    END IF;
END $$;
