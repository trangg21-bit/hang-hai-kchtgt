-- V51: Add extended fields to ben_cang table (from hh.csdl legacy Qlkc038Dto)
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS dia_diem VARCHAR(100);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS dia_diem_chi_tiet VARCHAR(500);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS he_quy_chieu INT;
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS quy_tac_hien_thi INT;
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS don_vi_khai_thac VARCHAR(255);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS tong_dien_tich NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS nang_luc_thong_qua_thiet_ke NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS nang_luc_thong_qua_hien_trang NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS co_tau_tiep_nhan_lon_nhat NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS quy_hoach_nang_luc_thong_qua NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS san_luong_hang_hoa_nam_gan_nhat NUMERIC(19, 4);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS thoi_diem_cong_bo_mo TIMESTAMP;
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS quyet_dinh_cong_bo VARCHAR(500);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS van_ban_thoa_thuan_dau_tu VARCHAR(2000);
