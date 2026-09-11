-- Migration: Bổ sung cột navigation_channel_id cho bảng infra_assets
-- Phục vụ màn hình: Tài sản luồng hàng hải (/asset/channel)

ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS navigation_channel_id UUID;

CREATE INDEX IF NOT EXISTS idx_infra_assets_navigation_channel_id 
    ON infra_assets(navigation_channel_id);

COMMENT ON COLUMN infra_assets.navigation_channel_id IS 'ID luồng hàng hải liên kết với tài sản KCHT';

ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS beacon_station_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_beacon_station_id ON infra_assets(beacon_station_id);
COMMENT ON COLUMN infra_assets.beacon_station_id IS 'ID trạm đèn biển/tiêu liên kết với tài sản KCHT';

ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS dike_revetment_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_dike_revetment_id ON infra_assets(dike_revetment_id);
COMMENT ON COLUMN infra_assets.dike_revetment_id IS 'ID đê kè liên kết với tài sản KCHT';
