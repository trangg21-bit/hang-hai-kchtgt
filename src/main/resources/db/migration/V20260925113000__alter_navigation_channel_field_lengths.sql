-- Migration: V20260925113000__alter_navigation_channel_field_lengths.sql
-- Description: Tang gioi han ky tu cac truong trong bang navigation_channel:
--   - channel_name: VARCHAR(255)
--   - detailed_location: VARCHAR(500)
--   - management_station: VARCHAR(500)
--   - announcement_decision_issuer: VARCHAR(255)

DO $$
BEGIN
    -- 1. Tên luồng hàng hải: channel_name -> VARCHAR(255)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_name'
    ) THEN
        ALTER TABLE public.navigation_channel
            ALTER COLUMN channel_name TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;

    -- 2. Địa điểm chi tiết: detailed_location -> VARCHAR(500)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'detailed_location'
    ) THEN
        ALTER TABLE public.navigation_channel
            ALTER COLUMN detailed_location TYPE VARCHAR(500) COLLATE "vi-VN-x-icu";
    END IF;

    -- 3. Trạm quản lý luồng: management_station -> VARCHAR(500)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'management_station'
    ) THEN
        ALTER TABLE public.navigation_channel
            ALTER COLUMN management_station TYPE VARCHAR(500) COLLATE "vi-VN-x-icu";
    END IF;

    -- 4. Đơn vị ra quyết định công bố: announcement_decision_issuer -> VARCHAR(255)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'announcement_decision_issuer'
    ) THEN
        ALTER TABLE public.navigation_channel
            ALTER COLUMN announcement_decision_issuer TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;
END $$;
