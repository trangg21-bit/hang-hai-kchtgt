-- F-002: group membership no longer stores an internal role.
-- Permissions are inherited from Roles assigned to the group.
ALTER TABLE group_members DROP COLUMN IF EXISTS role;
