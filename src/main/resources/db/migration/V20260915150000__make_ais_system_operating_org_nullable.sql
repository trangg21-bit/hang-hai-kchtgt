-- V20260915150000: Bỏ ràng buộc bắt buộc (NOT NULL) cho trường Đơn vị khai thác (operating_org_id) của Hệ thống AIS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ais_system'
          AND column_name = 'operating_org_id'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.ais_system ALTER COLUMN operating_org_id DROP NOT NULL;
    END IF;
END $$;
