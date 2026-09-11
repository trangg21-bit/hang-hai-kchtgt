-- Migration: Bổ sung cột buoy_id và buoy_station_id cho bảng infra_assets
-- Phục vụ màn hình: Tài sản phao, tiêu và nhà trạm quản lý vận hành phao, tiêu

ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS buoy_id UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS buoy_station_id UUID;

CREATE INDEX IF NOT EXISTS idx_infra_assets_buoy_id ON infra_assets(buoy_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_buoy_station_id ON infra_assets(buoy_station_id);

COMMENT ON COLUMN infra_assets.buoy_id IS 'ID phao, tiêu liên kết';
COMMENT ON COLUMN infra_assets.buoy_station_id IS 'ID nhà trạm quản lý vận hành phao, tiêu liên kết';
