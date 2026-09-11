-- Migration bổ sung cột storm_shelter_id cho bảng infra_assets phục vụ Tài sản khu tránh, trú bão
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS storm_shelter_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_storm_shelter_id ON infra_assets(storm_shelter_id);
