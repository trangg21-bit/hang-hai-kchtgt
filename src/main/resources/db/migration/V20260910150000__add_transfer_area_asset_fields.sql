-- Migration bổ sung cột transfer_area_id cho bảng infra_assets phục vụ Tài sản khu chuyển tải
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS transfer_area_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_transfer_area_id ON infra_assets(transfer_area_id);
