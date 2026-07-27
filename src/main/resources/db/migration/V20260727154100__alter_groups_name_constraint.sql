-- Drop the existing absolute unique constraint on group name
ALTER TABLE user_groups DROP CONSTRAINT IF EXISTS uk_groups_name;
DROP INDEX IF EXISTS uk_groups_name;

-- Recreate it as a partial index to allow reusing names from soft-deleted groups
CREATE UNIQUE INDEX uk_groups_name ON user_groups (name) WHERE deleted_at IS NULL;
