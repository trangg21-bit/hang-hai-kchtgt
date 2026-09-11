-- Migration bổ sung cột pier_id cho bảng infra_assets phục vụ Tài sản cầu cảng
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS pier_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_pier_id ON infra_assets(pier_id);
