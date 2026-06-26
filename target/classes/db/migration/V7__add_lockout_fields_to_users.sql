-- V2: Add lockout fields to app_users
ALTER TABLE app_users ADD failed_login_count INT NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD account_locked_until DATETIME2 NULL;