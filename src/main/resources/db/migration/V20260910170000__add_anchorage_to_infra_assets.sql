-- Liên kết tài sản KCHT với khu neo đậu và hỗ trợ lọc theo mã khu neo đậu.
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS anchorage_id UUID;

CREATE INDEX IF NOT EXISTS idx_infra_assets_anchorage_id
    ON infra_assets(anchorage_id);

COMMENT ON COLUMN infra_assets.anchorage_id IS 'ID khu neo đậu liên kết với tài sản KCHT';
