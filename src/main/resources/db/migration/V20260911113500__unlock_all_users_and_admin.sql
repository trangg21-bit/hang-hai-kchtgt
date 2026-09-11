-- ============================================================================
-- Migration: V20260911113000__unlock_all_users_and_admin.sql
-- Description: Mở khóa tài khoản admin và người dùng, đặt lại số lần đăng nhập sai
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
        UPDATE app_users 
        SET status = 0, 
            account_locked_until = NULL, 
            failed_login_count = 0, 
            failed_totp_count = 0 
        WHERE username = 'admin' 
           OR status = 2 
           OR account_locked_until IS NOT NULL;
    END IF;
END $$;
