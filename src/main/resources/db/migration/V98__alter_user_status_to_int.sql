-- Xóa kiểu ENUM nếu đã được tạo ở version nháp trước đó (để an toàn nếu DB cục bộ đã lỡ chạy V98 cũ)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        -- Chuyển cột status tạm về VARCHAR trước khi ép kiểu xuống INT (nếu đã bị đổi thành ENUM)
        ALTER TABLE app_users ALTER COLUMN status TYPE varchar(20) USING status::varchar;
        DROP TYPE user_status;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_users') THEN
        ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_status_check;
        ALTER TABLE app_users ALTER COLUMN status TYPE smallint USING CASE status
            WHEN 'ACTIVE' THEN 0
            WHEN 'INACTIVE' THEN 1
            WHEN 'LOCKED' THEN 2
            WHEN 'DELETED' THEN 3
            WHEN 'PENDING_VERIFICATION' THEN 4
            WHEN 'PENDING_APPROVAL' THEN 5
            ELSE 0
        END;
    END IF;
END $$;
