-- Migration: V20260925110000__set_kcht_related_tables_collation_vi_vn.sql
-- Description: Cau hinh collation tieng Viet (vi-VN-x-icu) cho cac cot text lien quan den luong hang hai (org_unit.name, ports.port_name, provinces.name, navigation_channel.channel_code, detailed_location, management_station)

DO $$
BEGIN
    -- org_unit.name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'org_unit' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.org_unit ALTER COLUMN name TYPE VARCHAR(200) COLLATE "vi-VN-x-icu";
    END IF;

    -- ports.port_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ports' AND column_name = 'port_name'
    ) THEN
        ALTER TABLE public.ports ALTER COLUMN port_name TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;

    -- provinces.name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'provinces' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.provinces ALTER COLUMN name TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;

    -- navigation_channel.channel_code
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_code'
    ) THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN channel_code TYPE VARCHAR(50) COLLATE "vi-VN-x-icu";
    END IF;

    -- navigation_channel.detailed_location
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'detailed_location'
    ) THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN detailed_location TYPE VARCHAR(500) COLLATE "vi-VN-x-icu";
    END IF;

    -- navigation_channel.management_station
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'management_station'
    ) THEN
        ALTER TABLE public.navigation_channel ALTER COLUMN management_station TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;
END $$;