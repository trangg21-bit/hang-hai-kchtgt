-- Đơn vị vận hành (Đê/Kè F-044..F-049) — tham chiếu danh mục DM_DON_VI_VH_KT (operating_organizations)
-- Chuẩn các thực thể KCHT khác (cctv/scada/vtsassist/radar): lưu operating_unit_id UUID, hiển thị tên phía FE.
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS operating_unit_id UUID;

CREATE INDEX IF NOT EXISTS idx_dike_revetment_operating_unit
    ON public.dike_revetment (operating_unit_id);
