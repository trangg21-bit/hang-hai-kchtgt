-- Keep User.groups (permission inheritance) backed by the same memberships
-- created by F-002 GroupMemberService.
--
-- User#getAllPermissions resolves inherited permissions through User.groups,
-- while group_members is the authoritative membership/audit table. The join
-- table is a projection used by the existing User entity mapping.

CREATE TABLE IF NOT EXISTS user_group_membership (
    user_id       UUID NOT NULL,
    user_group_id UUID NOT NULL,
    CONSTRAINT pk_user_group_membership PRIMARY KEY (user_id, user_group_id),
    CONSTRAINT fk_ugm_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ugm_group FOREIGN KEY (user_group_id) REFERENCES user_groups(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ugm_group_id ON user_group_membership(user_group_id);

-- Backfill active F-002 memberships so existing members retain inherited
-- permissions after the projection is introduced.
INSERT INTO user_group_membership (user_id, user_group_id)
SELECT DISTINCT gm.user_id, gm.user_group_id
FROM group_members gm
WHERE gm.status = 0
ON CONFLICT (user_id, user_group_id) DO NOTHING;
