-- Drop the existing absolute unique constraint on group code
ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS uk_groups_code;
DROP INDEX IF EXISTS uk_groups_code;

-- Recreate it as a partial index to allow reusing codes from soft-deleted groups
CREATE UNIQUE INDEX uk_groups_code ON user_groups (code) WHERE deleted_at IS NULL;
