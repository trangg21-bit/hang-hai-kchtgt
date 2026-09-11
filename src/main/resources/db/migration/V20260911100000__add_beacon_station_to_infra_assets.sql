-- Liên kết tài sản KCHT với danh mục đèn biển/nhà trạm gắn liền đèn biển.
-- Danh mục nghiệp vụ đang được ánh xạ bởi BeaconStation trên bảng beacon_light.
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS beacon_station_id UUID;

CREATE INDEX IF NOT EXISTS idx_infra_assets_beacon_station_id
    ON infra_assets(beacon_station_id);

COMMENT ON COLUMN infra_assets.beacon_station_id IS
    'ID bản ghi beacon_light của đèn biển hoặc nhà trạm gắn liền đèn biển';
