-- Migration: V20260925100000__set_navigation_channel_collation_vi_vn.sql
-- Description: Cau hinh collation tieng Viet (vi-VN-x-icu) cho cot channel_name cua bang navigation_channel

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'navigation_channel'
          AND column_name = 'channel_name'
    ) THEN
        ALTER TABLE public.navigation_channel
            ALTER COLUMN channel_name TYPE VARCHAR(100) COLLATE "vi-VN-x-icu";
    END IF;
END $$;