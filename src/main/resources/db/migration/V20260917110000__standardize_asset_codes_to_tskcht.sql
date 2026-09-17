-- Migration: Chuẩn hóa định dạng mã tài sản KCHT sang chuẩn TSKCHT_{LOẠI}-... (ví dụ TSKCHT_BC-000011, TSKCHT_TD-000001)

-- 1. Cập nhật bảng infra_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'infra_assets') THEN
        UPDATE infra_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 2. Cập nhật bảng transmission_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transmission_assets') THEN
        UPDATE transmission_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 3. Cập nhật bảng vts_system_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vts_system_assets') THEN
        UPDATE vts_system_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 4. Cập nhật bảng radar_station_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'radar_station_assets') THEN
        UPDATE radar_station_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 5. Cập nhật bảng ais_system_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ais_system_assets') THEN
        UPDATE ais_system_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 6. Cập nhật bảng coastal_station_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coastal_station_assets') THEN
        UPDATE coastal_station_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 7. Cập nhật bảng cctv_system_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cctv_system_assets') THEN
        UPDATE cctv_system_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;

-- 8. Cập nhật bảng scada_system_assets
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scada_system_assets') THEN
        UPDATE scada_system_assets
        SET asset_code = 'TSKCHT_' || SUBSTRING(asset_code FROM 4)
        WHERE asset_code LIKE 'TS-%'
          AND asset_code NOT LIKE 'TSKCHT_%';
    END IF;
END $$;
