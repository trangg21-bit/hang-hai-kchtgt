-- ====================================================================================
-- Migration: V20260911110000__add_infra_assets_types_and_stations.sql
-- Mô tả: Bổ sung trường types và các trường ID liên kết đài trạm cho infra_assets
-- (TTDH, Inmarsat, Cospas-Sarsat, TTXLTT, LRIT, Bến cảng)
-- ====================================================================================

-- 1. Bổ sung trường types (VARCHAR(100))
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS types VARCHAR(100);

-- 2. Bổ sung các cột liên kết đài trạm chuyên biệt
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS station_id UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS ttdh_station_id UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS inmarsat_station_id UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS cospas_sarsat_station_id UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS ttxltt_station_id UUID;

-- 3. Tạo index phục vụ tìm kiếm & lọc nhanh
CREATE INDEX IF NOT EXISTS idx_infra_assets_types ON infra_assets(types);
CREATE INDEX IF NOT EXISTS idx_infra_assets_station_id ON infra_assets(station_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_ttdh_station_id ON infra_assets(ttdh_station_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_inmarsat_station_id ON infra_assets(inmarsat_station_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_cospas_sarsat_station_id ON infra_assets(cospas_sarsat_station_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_ttxltt_station_id ON infra_assets(ttxltt_station_id);

-- 4. Đồng bộ dữ liệu mặc định cho types từ asset_type hiện có
UPDATE infra_assets
SET types = CASE
    WHEN CAST(asset_type AS VARCHAR) = '4' THEN 'PORT_TERMINAL'
    WHEN CAST(asset_type AS VARCHAR) = '5' THEN 'LRIT_STATION'
    ELSE types
END
WHERE types IS NULL AND asset_type IS NOT NULL;
