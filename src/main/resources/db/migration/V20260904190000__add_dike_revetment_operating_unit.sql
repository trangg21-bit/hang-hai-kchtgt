-- Đơn vị vận hành (Đê/Kè F-044..F-049) — tham chiếu danh mục DM_DON_VI_VH_KT (operating_organizations)
-- Chuẩn các thực thể KCHT khác (cctv/scada/vtsassist/radar): lưu operating_unit_id UUID, hiển thị tên phía FE.
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS operating_unit_id UUID;

CREATE INDEX IF NOT EXISTS idx_dike_revetment_operating_unit
    ON public.dike_revetment (operating_unit_id);

-- Ràng buộc duy nhất cho mã đê kè (code) — chặn sinh trùng mã do race condition
-- hoặc lỗi so sánh chuỗi khi tăng độ dài mã (DK-0009 → DK-000010, xem
-- DikeRevetmentService.generateUniqueDikeRevetmentCode()).
-- Dùng CREATE UNIQUE INDEX thay vì ALTER TABLE ADD CONSTRAINT vì PostgreSQL
-- không hỗ trợ "ADD CONSTRAINT IF NOT EXISTS" — cách này vẫn đảm bảo tính
-- duy nhất và giữ được tính idempotent (chạy lại migration không lỗi).
CREATE UNIQUE INDEX IF NOT EXISTS uk_dike_revetment_code
    ON public.dike_revetment (code);
