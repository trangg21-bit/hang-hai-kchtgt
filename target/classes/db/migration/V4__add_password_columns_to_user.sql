-- V4: Add password management columns to app_users
ALTER TABLE app_users ADD password_hash_version INT NULL;
ALTER TABLE app_users ADD expires_at DATETIME2 NULL;
ALTER TABLE app_users ADD last_changed_at DATETIME2 NULL;
ALTER TABLE app_users ADD password_strength_score TINYINT NULL;