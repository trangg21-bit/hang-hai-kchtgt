-- F-002: remove retired group copy and group history capabilities.
-- The group history table is intentionally retained as legacy data; no application
-- code or permission can access it after this migration.

DO $$
BEGIN
    IF to_regclass('public.role_permissions') IS NOT NULL
       AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions
        WHERE permission_id IN (
            SELECT id FROM permissions
            WHERE code IN ('group:copy', 'group:history')
        );
    END IF;

    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions
        WHERE lower(permission) IN ('group:copy', 'group:history');
    END IF;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override
        WHERE lower(permission_code) IN ('group:copy', 'group:history');
    END IF;

    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions
        WHERE code IN ('group:copy', 'group:history');
    END IF;
END $$;
