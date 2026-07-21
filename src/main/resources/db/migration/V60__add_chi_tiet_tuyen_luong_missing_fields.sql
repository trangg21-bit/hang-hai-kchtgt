ALTER TABLE chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS chieu_cao_tinh_khong VARCHAR(20);
ALTER TABLE chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS vi_tri_vung_quay_tau VARCHAR(500);
ALTER TABLE chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ban_kinh_vung_quay_tau NUMERIC(20,4);
ALTER TABLE chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS ban_kinh_cong_nho_nhat NUMERIC(20,4);
ALTER TABLE chi_tiet_tuyen_luong ADD COLUMN IF NOT EXISTS pham_vi_bao_ve_luong VARCHAR(500);
