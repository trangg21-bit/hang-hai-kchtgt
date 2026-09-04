-- Thêm cột đơn vị khai thác (operating_org_id) cho bảng berths — đồng bộ logic với bến phao (buoy_berths)
ALTER TABLE berths ADD COLUMN IF NOT EXISTS operating_org_id UUID;
CREATE INDEX IF NOT EXISTS idx_berths_operating_org ON berths(operating_org_id);
