-- ====================================================================================
-- Migration: V20260911120000__add_dry_port_asset_support.sql
-- Mô tả: Bổ sung cột dry_port_id và index cho infra_assets phục vụ Tài sản cảng cạn
-- ====================================================================================

ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS dry_port_id UUID;
CREATE INDEX IF NOT EXISTS idx_infra_assets_dry_port_id ON infra_assets(dry_port_id);

-- Cập nhật types nếu có bản ghi DRY_PORT trước đó
UPDATE infra_assets
SET types = 'DRY_PORT'
WHERE asset_type = 10 AND types IS NULL;
