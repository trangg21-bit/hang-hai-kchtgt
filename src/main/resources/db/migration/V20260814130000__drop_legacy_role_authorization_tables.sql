-- Authorization is now evaluated from direct user permissions and active group membership.
-- V20260812200000 has already materialized legacy role/group grants into user permissions.

DELETE FROM user_permission_override
WHERE permission_code IN ('role:manage', 'roles:read');

DELETE FROM user_group_permissions
WHERE permission IN ('role:manage', 'roles:read');

-- Remove FK rows before deleting the permission catalog entries.
DELETE FROM role_permissions
WHERE permission_id IN (
    SELECT id
    FROM permissions
    WHERE code IN ('role:manage', 'roles:read')
);

DELETE FROM permissions
WHERE code IN ('role:manage', 'roles:read');

ALTER TABLE pending_approvals
    DROP COLUMN IF EXISTS requested_role_code;

DROP TABLE IF EXISTS group_roles CASCADE;
DROP TABLE IF EXISTS user_roles_tracking CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS app_roles CASCADE;

-- role_level was derived from the removed role assignment and is no longer persisted.
ALTER TABLE jwt_sessions
    DROP COLUMN IF EXISTS role_level;
