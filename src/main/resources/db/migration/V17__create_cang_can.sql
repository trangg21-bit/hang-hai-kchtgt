-- V17: Create cang_can table (Inland Port - Cảng cạn)
CREATE TABLE IF NOT EXISTS cang_can (
    id                      UUID PRIMARY KEY,
    ma_cang_can             VARCHAR(50) NOT NULL UNIQUE,
    ten_cang_can            VARCHAR(255) NOT NULL,
    tinh_thanh_pho          VARCHAR(100),
    vi_do                   NUMERIC(10, 6),
    kinh_do                 NUMERIC(10, 6),
    dien_tich               NUMERIC(15, 2),
    cong_suat_teu           NUMERIC(15, 2),
    trang_thai_hoat_dong    VARCHAR(50),
    trang_thai_phe_duyet    VARCHAR(50) NOT NULL DEFAULT 'CHO_PHE_DUYET',
    org_unit_id             UUID,
    created_by              UUID,
    updated_by              UUID,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted                 BOOLEAN DEFAULT FALSE,
    deleted_at              TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_cang_can_ma_cang_can ON cang_can(ma_cang_can);
CREATE INDEX IF NOT EXISTS idx_cang_can_org_unit ON cang_can(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_cang_can_trang_thai_phe_duyet ON cang_can(trang_thai_phe_duyet);
CREATE INDEX IF NOT EXISTS idx_cang_can_deleted ON cang_can(deleted_at);
