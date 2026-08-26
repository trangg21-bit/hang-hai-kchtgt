-- Reset password for admin to 'Asdqwe@123' and unlock account
-- MD5('Asdqwe@123') = 5f3f337895ab940372a202a7a84c4c55
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
        ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
        ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0;
        ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS failed_totp_count INT DEFAULT 0;

        UPDATE app_users 
        SET password = '5f3f337895ab940372a202a7a84c4c55', 
            account_locked_until = NULL, 
            failed_login_count = 0, 
            failed_totp_count = 0, 
            status = 1 
        WHERE username = 'admin' OR LOWER(email) = 'admin@hh.gov.vn';
    END IF;
END $$;

