-- V58: Create bcc157_report table for BCC_157 (F-142) CRUD feature
-- Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng

CREATE TABLE bcc157_report (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    org_unit_id UUID NOT NULL REFERENCES org_units(id),
    report_year INT NOT NULL,
    nguon_du_lieu VARCHAR(10) DEFAULT '1',
    status VARCHAR(20) DEFAULT 'DRAFT',

    -- Section 1: Nguyên giá
    ma_so_nguyen_gia_so_du_dau_nam VARCHAR(20),
    tai_san_nguyen_gia_so_du_dau_nam DECIMAL(20,4),
    ma_so_nguyen_gia_tang_trong_nam VARCHAR(20),
    tai_san_nguyen_gia_tang_trong_nam DECIMAL(20,4),
    ma_so_nguyen_gia_giam_trong_nam VARCHAR(20),
    tai_san_nguyen_gia_giam_trong_nam DECIMAL(20,4),
    ma_so_nguyen_gia_so_du_cuoi_nam VARCHAR(20),
    tai_san_nguyen_gia_so_du_cuoi_nam DECIMAL(20,4),

    -- Section 2: Giá trị hao mòn lũy kế
    ma_so_gia_tri_hao_mon_so_du_dau_nam VARCHAR(20),
    tai_san_gia_tri_hao_mon_so_du_dau_nam DECIMAL(20,4),
    ma_so_gia_tri_hao_mon_tang_trong_nam VARCHAR(20),
    tai_san_gia_tri_hao_mon_tang_trong_nam DECIMAL(20,4),
    ma_so_gia_tri_hao_mon_giam_trong_nam VARCHAR(20),
    tai_san_gia_tri_hao_mon_giam_trong_nam DECIMAL(20,4),
    ma_so_gia_tri_hao_mon_so_du_cuoi_nam VARCHAR(20),
    tai_san_gia_tri_hao_mon_so_du_cuoi_nam DECIMAL(20,4),

    -- Section 3: Giá trị còn lại
    ma_so_gia_tri_con_lai_tu_ngay_dau_nam VARCHAR(20),
    tai_san_gia_tri_con_lai_tu_ngay_dau_nam DECIMAL(20,4),
    ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam VARCHAR(20),
    tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam DECIMAL(20,4),

    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),

    CONSTRAINT uk_bcc157_report UNIQUE (org_unit_id, report_year, nguon_du_lieu)
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_bcc157_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bcc157_report_updated_at
    BEFORE UPDATE ON bcc157_report
    FOR EACH ROW
    EXECUTE FUNCTION update_bcc157_report_updated_at();
