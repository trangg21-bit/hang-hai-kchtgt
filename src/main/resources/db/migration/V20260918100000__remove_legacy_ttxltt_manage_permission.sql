-- TTXLTT station and TTXLTT assets are separate resources.  The legacy
-- ttxltt:* resource made a station-level manage grant unlock every action.
DO $$
DECLARE
    action_name text;
    legacy_code text;
    canonical_code text;
BEGIN
    FOREACH action_name IN ARRAY ARRAY['read', 'create', 'update', 'delete', 'approvec1', 'approvec2', 'history']
    LOOP
        legacy_code := 'ttxltt:' || action_name;
        canonical_code := 'coastalstationhaiphong:' || action_name;

        -- Flyway runs before the Java seeder, therefore make every canonical target
        -- available before migrating legacy group/role assignments.
        IF to_regclass('public.permissions') IS NOT NULL THEN
            INSERT INTO permissions (id, code, name, resource, action, description, created_at, updated_at)
            SELECT gen_random_uuid(), canonical_code, 'Quyền Đài TTXLTT - ' || action_name,
                   'coastalstationhaiphong', action_name,
                   'Chuẩn hóa từ quyền ttxltt cũ', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = canonical_code);
        END IF;

        IF to_regclass('public.user_permission_override') IS NOT NULL THEN
            INSERT INTO user_permission_override (id, user_id, permission_code, reason, created_at, updated_at, created_by, updated_by)
            SELECT gen_random_uuid(), legacy.user_id, canonical_code,
                   'Chuẩn hóa quyền Đài TTXLTT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                   legacy.created_by, legacy.updated_by
            FROM user_permission_override legacy
            WHERE legacy.permission_code = legacy_code
              AND legacy.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM user_permission_override current_permission
                  WHERE current_permission.user_id = legacy.user_id
                    AND current_permission.permission_code = canonical_code
                    AND current_permission.deleted_at IS NULL
              );
            DELETE FROM user_permission_override WHERE permission_code = legacy_code;
        END IF;

        IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
            INSERT INTO user_group_permissions (user_group_id, permission)
            SELECT legacy.user_group_id, canonical_code
            FROM user_group_permissions legacy
            WHERE legacy.permission = legacy_code
              AND NOT EXISTS (
                  SELECT 1 FROM user_group_permissions current_permission
                  WHERE current_permission.user_group_id = legacy.user_group_id
                    AND current_permission.permission = canonical_code
              );
            DELETE FROM user_group_permissions WHERE permission = legacy_code;
        END IF;

        IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT legacy.role_id, target.id
            FROM role_permissions legacy
            JOIN permissions source ON source.id = legacy.permission_id AND source.code = legacy_code
            JOIN permissions target ON target.code = canonical_code
            WHERE NOT EXISTS (
                SELECT 1 FROM role_permissions current_permission
                WHERE current_permission.role_id = legacy.role_id AND current_permission.permission_id = target.id
            );
            DELETE FROM role_permissions
            WHERE permission_id IN (SELECT id FROM permissions WHERE code = legacy_code);
        END IF;
    END LOOP;

    IF to_regclass('public.user_permission_override') IS NOT NULL THEN
        DELETE FROM user_permission_override WHERE permission_code = 'ttxltt:manage';
    END IF;
    IF to_regclass('public.user_group_permissions') IS NOT NULL THEN
        DELETE FROM user_group_permissions WHERE permission = 'ttxltt:manage';
    END IF;
    IF to_regclass('public.role_permissions') IS NOT NULL AND to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE code = 'ttxltt:manage');
    END IF;
    IF to_regclass('public.permissions') IS NOT NULL THEN
        DELETE FROM permissions WHERE code LIKE 'ttxltt:%';
    END IF;
END $$;
