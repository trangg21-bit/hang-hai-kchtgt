-- V15: Create ben_cang table (Berth - Bến cảng)
CREATE TABLE IF NOT EXISTS ben_cang (
    id                      UUID PRIMARY KEY,
    ma_ben                  VARCHAR(50) NOT NULL UNIQUE,
    ten_ben                 VARCHAR(255) NOT NULL,
    cang_bien_id            UUID NOT NULL,
    tuyen_duong_thuy        VARCHAR(255),
    vi_do                   NUMERIC(10, 6),
    kinh_do                 NUMERIC(10, 6),
    chieu_dai               NUMERIC(15, 2),
    chieu_rong              NUMERIC(15, 2),
    loai_ben                VARCHAR(100),
    do_sau_luong            NUMERIC(10, 2),
    trang_thai_hoat_dong    VARCHAR(50),
    trang_thai_phe_duyet    VARCHAR(50) NOT NULL DEFAULT 'CHO_PHE_DUYET',
    org_unit_id             UUID,
    created_by              UUID,
    updated_by              UUID,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted                 BOOLEAN DEFAULT FALSE,
    deleted_at              TIMESTAMP NULL,
    CONSTRAINT fk_ben_cang_cang_bien FOREIGN KEY (cang_bien_id) REFERENCES cang_bien(id)
);

CREATE INDEX IF NOT EXISTS idx_ben_cang_ma_ben ON ben_cang(ma_ben);
CREATE INDEX IF NOT EXISTS idx_ben_cang_cang_bien ON ben_cang(cang_bien_id);
CREATE INDEX IF NOT EXISTS idx_ben_cang_org_unit ON ben_cang(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_ben_cang_trang_thai_phe_duyet ON ben_cang(trang_thai_phe_duyet);
CREATE INDEX IF NOT EXISTS idx_ben_cang_deleted ON ben_cang(deleted_at);
