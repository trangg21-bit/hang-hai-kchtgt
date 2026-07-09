-- V22: Create vung_nuoc table (Water Zone - Vùng nước)
CREATE TABLE IF NOT EXISTS vung_nuoc (
    id                      UUID PRIMARY KEY,
    ma_vung_nuoc            VARCHAR(50) NOT NULL UNIQUE,
    ten_vung_nuoc           VARCHAR(255) NOT NULL,
    cang_bien_id            UUID NOT NULL,
    dien_tich               NUMERIC(15, 2),
    do_sau_max              NUMERIC(10, 2),
    do_sau_trung_binh       NUMERIC(10, 2),
    loai_vung_nuoc          VARCHAR(100),
    trang_thai_hoat_dong    VARCHAR(50),
    trang_thai_phe_duyet    VARCHAR(50) NOT NULL DEFAULT 'CHO_PHE_DUYET',
    org_unit_id             UUID,
    created_by              VARCHAR(36),
    updated_by              VARCHAR(36),
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at              TIMESTAMP NULL,
    CONSTRAINT fk_vung_nuoc_cang_bien FOREIGN KEY (cang_bien_id) REFERENCES cang_bien(id)
);

CREATE INDEX IF NOT EXISTS idx_vung_nuoc_ma_vung_nuoc ON vung_nuoc(ma_vung_nuoc);
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_cang_bien ON vung_nuoc(cang_bien_id);
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_org_unit ON vung_nuoc(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_trang_thai_phe_duyet ON vung_nuoc(trang_thai_phe_duyet);
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_deleted ON vung_nuoc(deleted_at);
