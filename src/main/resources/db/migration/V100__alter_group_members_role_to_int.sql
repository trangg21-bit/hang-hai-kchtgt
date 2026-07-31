DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'group_members' 
        AND column_name = 'role' 
        AND data_type = 'character varying'
    ) THEN
        -- Create an integer column for role
        ALTER TABLE group_members ADD COLUMN role_int SMALLINT DEFAULT 2;

        -- Migrate data
        UPDATE group_members SET role_int = 0 WHERE role = 'owner';
        UPDATE group_members SET role_int = 1 WHERE role = 'admin';
        UPDATE group_members SET role_int = 2 WHERE role = 'member';
        UPDATE group_members SET role_int = 3 WHERE role = 'viewer';

        -- Drop old column and rename new one
        ALTER TABLE group_members DROP COLUMN role;
        ALTER TABLE group_members RENAME COLUMN role_int TO role;

        -- Add not null constraint
        ALTER TABLE group_members ALTER COLUMN role SET NOT NULL;
    END IF;
END $$;
