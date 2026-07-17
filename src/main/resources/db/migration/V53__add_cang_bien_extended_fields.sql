-- V53: Add extended fields to cang_bien table (from hh.csdl legacy Qlkc037Dto)
-- These columns mirror the zobjDataSub and other fields from the original project.
-- All columns are nullable (optional) to maintain backward compatibility.

ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS dia_diem_chi_tiet VARCHAR(500);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS phan_cap INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS he_quy_chieu INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS quy_tac_hien_thi INT;

-- zobjDataSub fields
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS pham_vi_vung_nuoc VARCHAR(2000);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_ben_cang INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_khu_neo_dau_chuyen_tai INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_tuyen_luong_cong_cong INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_tuyen_luong_chuyen_dung INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_chieu_dai_luong_cong_cong NUMERIC(19,4);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_chieu_dai_luong_chuyen_dung NUMERIC(19,4);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_phao_tieu_bao_hieu INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_de_ke INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_chieu_dai_de_ke NUMERIC(19,4);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS tong_so_den_bien_dang_tieu INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS so_luong_ben_phao INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS so_luong_khu_neo_dau INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS so_luong_khu_chuyen_tai INT;
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS cac_khu_nuoc_khac VARCHAR(2000);
ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS ghi_chu VARCHAR(2000);
