-- Repair migration for environments where the original user profile migration
-- was skipped because a later migration version had already been applied.
-- All columns are nullable and safe for existing app_users rows.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS department VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS position VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS note VARCHAR(500) NULL;
