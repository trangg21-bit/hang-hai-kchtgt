-- V16: Create cau_cang table (Crane/Gantry - Cầu cảng)
CREATE TABLE IF NOT EXISTS cau_cang (
    id                      UUID PRIMARY KEY,
    ma_cau                  VARCHAR(50) NOT NULL UNIQUE,
    ten_cau                 VARCHAR(255) NOT NULL,
    ben_cang_id             UUID NOT NULL,
    chieu_dai               NUMERIC(15, 2),
    tai_trong               NUMERIC(15, 2),
    loai_cau                VARCHAR(100),
    trang_thai_hoat_dong    VARCHAR(50),
    trang_thai_phe_duyet    VARCHAR(50) NOT NULL DEFAULT 'CHO_PHE_DUYET',
    org_unit_id             UUID,
    created_by              UUID,
    updated_by              UUID,
    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted                 BOOLEAN DEFAULT FALSE,
    deleted_at              TIMESTAMP NULL,
    CONSTRAINT fk_cau_cang_ben_cang FOREIGN KEY (ben_cang_id) REFERENCES ben_cang(id)
);

CREATE INDEX IF NOT EXISTS idx_cau_cang_ma_cau ON cau_cang(ma_cau);
CREATE INDEX IF NOT EXISTS idx_cau_cang_ben_cang ON cau_cang(ben_cang_id);
CREATE INDEX IF NOT EXISTS idx_cau_cang_org_unit ON cau_cang(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_cau_cang_trang_thai_phe_duyet ON cau_cang(trang_thai_phe_duyet);
CREATE INDEX IF NOT EXISTS idx_cau_cang_deleted ON cau_cang(deleted_at);
