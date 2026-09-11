-- Liên kết tài sản KCHT với danh mục đê/kè hiện có trên bảng dike_revetment.
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS dike_revetment_id UUID;

CREATE INDEX IF NOT EXISTS idx_infra_assets_dike_revetment_id
    ON infra_assets(dike_revetment_id);

COMMENT ON COLUMN infra_assets.dike_revetment_id IS
    'ID bản ghi dike_revetment liên kết với tài sản KCHT';
