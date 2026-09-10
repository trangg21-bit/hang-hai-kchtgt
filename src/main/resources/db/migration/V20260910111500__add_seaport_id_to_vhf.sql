-- Bổ sung cột seaport_id cho bảng vhf (Hệ thống thông tin liên lạc VHF thuộc Cảng biển)
ALTER TABLE vhf ADD COLUMN IF NOT EXISTS seaport_id UUID;
CREATE INDEX IF NOT EXISTS idx_vhf_seaport_id ON vhf(seaport_id);
