-- V14: Create cang_bien table (Port - Cảng biển)
CREATE TABLE IF NOT EXISTS cang_bien (
    id                      UUID PRIMARY KEY,
    ma_cang                 VARCHAR(50) NOT NULL UNIQUE,
    ten_cang                VARCHAR(255) NOT NULL,
    tinh_thanh_pho          VARCHAR(100),
    vi_do                   NUMERIC(10, 6),
    kinh_do                 NUMERIC(10, 6),
    dien_tich               NUMERIC(15, 2),
    kha_nang_tiep_nhan      NUMERIC(15, 2),
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

CREATE INDEX IF NOT EXISTS idx_cang_bien_ma_cang ON cang_bien(ma_cang);
CREATE INDEX IF NOT EXISTS idx_cang_bien_org_unit ON cang_bien(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_cang_bien_trang_thai_phe_duyet ON cang_bien(trang_thai_phe_duyet);
CREATE INDEX IF NOT EXISTS idx_cang_bien_deleted ON cang_bien(deleted_at);
