-- Migration bổ sung cột buoy_berth_id cho bảng infra_assets phục vụ Tài sản bến phao
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS buoy_berth_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_buoy_berth_id ON infra_assets(buoy_berth_id);
