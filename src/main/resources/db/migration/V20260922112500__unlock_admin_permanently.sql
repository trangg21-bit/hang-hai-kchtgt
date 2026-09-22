-- Migration: Unlock admin account and reset lockout counters
-- Timestamp: 20260922112500

UPDATE app_users
SET status = 0,
    account_locked_until = NULL,
    failed_login_count = 0,
    failed_totp_count = 0
WHERE username = 'admin';
