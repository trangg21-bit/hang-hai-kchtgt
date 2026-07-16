-- V52: Add loai_ket_cau column to ben_cang table (from hh.csdl legacy LOAI_KET_CAU)
ALTER TABLE ben_cang ADD COLUMN IF NOT EXISTS loai_ket_cau INT;
