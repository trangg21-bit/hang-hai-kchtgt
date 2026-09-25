-- Migration: V20260925120000__alter_channel_route_detail_field_types.sql
-- Description: Tang gioi han ky tu va cap nhat do chinh xac so cho cac truong bang channel_route_detail:
--   - route_name: VARCHAR(255)
--   - turning_basin_location: VARCHAR(2000)
--   - turning_basin_radius_meters: NUMERIC(20,4)
--   - vertical_clearance_meters: NUMERIC(20,4)
--   - channel_length_kilometers: NUMERIC(20,4)
--   - maximum_design_width_meters: NUMERIC(20,4)
--   - minimum_design_width_meters: NUMERIC(20,4)
--   - design_depth_meters: NUMERIC(20,4)
--   - current_depth_meters: NUMERIC(20,4)
--   - design_slope: NUMERIC(20,4)
--   - route_latest_dredging_volume_cubic_meters: NUMERIC(20,4)
--   - protection_scope: NUMERIC(10,4)

DO $$
BEGIN
    -- 1. Tên tuyến luồng: route_name -> VARCHAR(255)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'route_name'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN route_name TYPE VARCHAR(255) COLLATE "vi-VN-x-icu";
    END IF;

    -- 2. Vị trí vũng quay tàu: turning_basin_location -> VARCHAR(2000)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'turning_basin_location'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN turning_basin_location TYPE VARCHAR(2000) COLLATE "vi-VN-x-icu";
    END IF;

    -- 3. Bán kính vũng quay tàu (m): turning_basin_radius_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'turning_basin_radius_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN turning_basin_radius_meters TYPE NUMERIC(20,4);
    END IF;

    -- 4. Chiều cao tĩnh không (m): vertical_clearance_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'vertical_clearance_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN vertical_clearance_meters TYPE NUMERIC(20,4);
    END IF;

    -- 5. Chiều dài luồng (km): channel_length_kilometers -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'channel_length_kilometers'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN channel_length_kilometers TYPE NUMERIC(20,4);
    END IF;

    -- 6. Chiều rộng thiết kế lớn nhất (m): maximum_design_width_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'maximum_design_width_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN maximum_design_width_meters TYPE NUMERIC(20,4);
    END IF;

    -- 7. Chiều rộng thiết kế nhỏ nhất (m): minimum_design_width_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'minimum_design_width_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN minimum_design_width_meters TYPE NUMERIC(20,4);
    END IF;

    -- 8. Độ sâu thiết kế (m): design_depth_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'design_depth_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN design_depth_meters TYPE NUMERIC(20,4);
    END IF;

    -- 9. Độ sâu hiện tại (m): current_depth_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'current_depth_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN current_depth_meters TYPE NUMERIC(20,4);
    END IF;

    -- 10. Mái dốc thiết kế: design_slope -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'design_slope'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN design_slope TYPE NUMERIC(20,4);
    END IF;

    -- 11. Khối lượng nạo vét năm gần nhất (m³): route_latest_dredging_volume_cubic_meters -> NUMERIC(20,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'route_latest_dredging_volume_cubic_meters'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN route_latest_dredging_volume_cubic_meters TYPE NUMERIC(20,4);
    END IF;

    -- 12. Phạm vi bảo vệ luồng: protection_scope -> NUMERIC(10,4)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'protection_scope'
    ) THEN
        ALTER TABLE public.channel_route_detail
            ALTER COLUMN protection_scope TYPE NUMERIC(10,4);
    END IF;
END $$;
