ALTER TABLE app_users DROP COLUMN IF EXISTS password_strength_score;
ALTER TABLE app_users DROP COLUMN IF EXISTS last_totp_code;
ALTER TABLE org_units DROP COLUMN IF EXISTS scope_id;
