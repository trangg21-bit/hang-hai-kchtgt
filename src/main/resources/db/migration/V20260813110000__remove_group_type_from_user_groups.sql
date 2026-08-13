-- groupType is no longer part of the group management domain.
ALTER TABLE user_groups DROP COLUMN IF EXISTS group_type;
ALTER TABLE user_groups ALTER COLUMN description TYPE VARCHAR(1000);
