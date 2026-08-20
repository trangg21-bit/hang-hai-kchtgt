-- Fix PostgreSQL logical replication error when deleting members or group permissions:
-- "ERROR: cannot delete from table because it does not have a replica identity and publishes deletes"

-- 1. Set REPLICA IDENTITY FULL FIRST so PostgreSQL allows DELETEs/UPDATEs on published tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_group_membership') THEN
        ALTER TABLE user_group_membership REPLICA IDENTITY FULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_group_permissions') THEN
        ALTER TABLE user_group_permissions REPLICA IDENTITY FULL;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_members') THEN
        ALTER TABLE group_members REPLICA IDENTITY FULL;
    END IF;
END $$;

-- 2. Now delete duplicates (if any) and ensure Primary Keys exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_group_membership') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pk_user_group_membership'
        ) THEN
            DELETE FROM user_group_membership a USING user_group_membership b
            WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.user_group_id = b.user_group_id;

            ALTER TABLE user_group_membership
                ADD CONSTRAINT pk_user_group_membership PRIMARY KEY (user_id, user_group_id);
        END IF;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_group_permissions') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'pk_user_group_permissions'
        ) THEN
            DELETE FROM user_group_permissions a USING user_group_permissions b
            WHERE a.ctid < b.ctid AND a.user_group_id = b.user_group_id AND a.permission = b.permission;

            ALTER TABLE user_group_permissions
                ADD CONSTRAINT pk_user_group_permissions PRIMARY KEY (user_group_id, permission);
        END IF;
    END IF;
END $$;
