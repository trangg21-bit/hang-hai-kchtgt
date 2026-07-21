-- V58__add_luong_hang_hai_extended_fields.sql

-- ============================================================
-- Bước 1: Đổi tên + sửa kiểu các cột tận dụng
-- ============================================================

-- so_luong (INT) → so_luong_tram (INT) — giữ nguyên kiểu
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='so_luong')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='so_luong_tram')
  THEN
    ALTER TABLE luong_hang_hai RENAME COLUMN so_luong TO so_luong_tram;
  END IF;
END $$;

-- ngay_ghi_nhan (DATE) → thoi_diem_sua_chua_tram_gan_nhat — đổi cả kiểu
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='ngay_ghi_nhan')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='thoi_diem_sua_chua_tram_gan_nhat')
  THEN
    ALTER TABLE luong_hang_hai ALTER COLUMN ngay_ghi_nhan TYPE DATE;
    ALTER TABLE luong_hang_hai RENAME COLUMN ngay_ghi_nhan TO thoi_diem_sua_chua_tram_gan_nhat;
  END IF;
END $$;

-- dien_tich_dang_bo (VARCHAR 100) → dien_tich_tram (NUMERIC 20,4) — đổi cả kiểu
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='dien_tich_dang_bo')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='luong_hang_hai' AND column_name='dien_tich_tram')
  THEN
    ALTER TABLE luong_hang_hai ALTER COLUMN dien_tich_dang_bo TYPE numeric(20, 4) USING nullif(dien_tich_dang_bo, '')::numeric(20, 4);
    ALTER TABLE luong_hang_hai RENAME COLUMN dien_tich_dang_bo TO dien_tich_tram;
  END IF;
END $$;

-- ============================================================
-- Bước 2: DROP 2 cột vô dụng
-- ============================================================
alter table luong_hang_hai drop column if exists gio_dien;
alter table luong_hang_hai drop column if exists tai_trong;

-- ============================================================
-- Bước 3: Sửa giới hạn ký tự cột hiện có
-- ============================================================
alter table luong_hang_hai alter column ten type VARCHAR(255);
alter table luong_hang_hai alter column ghi_chu type VARCHAR(2000);

-- ============================================================
-- Bước 4: Thêm 10 cột mới
-- ============================================================
alter table luong_hang_hai add column if not exists ma_luong_hang_hai VARCHAR(50);
alter table luong_hang_hai add column if not exists cang_bien_id UUID;
alter table luong_hang_hai add column if not exists don_vi_van_hanh_id UUID;
alter table luong_hang_hai add column if not exists dia_diem VARCHAR(6);
alter table luong_hang_hai add column if not exists dia_diem_chi_tiet VARCHAR(500);
alter table luong_hang_hai add column if not exists tram_quan_ly_luong VARCHAR(500);
alter table luong_hang_hai add column if not exists so_luong_nhan_su_tai_tram numeric(5, 0) default 0;
alter table luong_hang_hai add column if not exists nam_bao_tri_gan_nhat INT;
alter table luong_hang_hai add column if not exists khoi_luong_nao_vet numeric(20, 4);
alter table luong_hang_hai add column if not exists so_luong_phao INT default 0;
alter table luong_hang_hai add column if not exists so_luong_tieu INT default 0;
alter table luong_hang_hai add column if not exists tinh_trang INT default 1;

create unique index if not exists idx_luong_hang_hai_ma_luong on luong_hang_hai(ma_luong_hang_hai);

-- ============================================================
-- Bước 5: Bảng con Chi tiết tuyến luồng
-- ============================================================
create table if not exists chi_tiet_tuyen_luong (
    id UUID primary key default gen_random_uuid(),
    luong_hang_hai_id UUID not null references luong_hang_hai(id) on delete cascade,
	stt INT not null default 1,
	phan_loai VARCHAR(5) null,
	ma VARCHAR(50) null,
	ten VARCHAR(500) null,
	loai_tuyen_luong INT null,
	do_sau_hien_tai VARCHAR(20) null,
	mai_doc_thiet_ke VARCHAR(20) null,
	created_at TIMESTAMP not null default CURRENT_TIMESTAMP,
	updated_at TIMESTAMP not null default CURRENT_TIMESTAMP
);

create index if not exists idx_cttl_parent on chi_tiet_tuyen_luong(luong_hang_hai_id);