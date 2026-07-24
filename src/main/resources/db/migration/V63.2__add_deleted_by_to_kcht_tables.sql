-- V63: Add deleted_by column to all KCHT management tables
-- Tracks who performed the soft-delete

ALTER TABLE cang_bien ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE cau_cang ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE cang_can ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE vung_nuoc ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE giay_to ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE lich_su_thay_doi ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
ALTER TABLE phe_duyet_log ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
