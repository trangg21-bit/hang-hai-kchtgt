-- V28: Add cong_nang_khai_thac column to point_objects, ben_cang, and cau_cang tables
ALTER TABLE point_objects ADD COLUMN IF NOT EXISTS cong_nang_khai_thac VARCHAR(255);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS cong_nang_khai_thac VARCHAR(255);
ALTER TABLE cau_cang ADD COLUMN IF NOT EXISTS cong_nang_khai_thac VARCHAR(255);
