-- Migration: Tạo bảng danh mục Đơn vị khai thác (operating_units) — cấu trúc GIỐNG bảng
-- operating_organizations (Đơn vị vận hành & Khai thác), dùng riêng cho trường "Đơn vị khai thác".
-- Seed: import TOÀN BỘ dữ liệu từ operating_organizations (giữ nguyên id để tương thích bản ghi cũ).
CREATE TABLE IF NOT EXISTS public.operating_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    parent_code VARCHAR(50),
    name VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_operating_units_code ON public.operating_units (code);

-- Import dữ liệu giống bảng Đơn vị vận hành (giữ nguyên id)
INSERT INTO public.operating_units (id, code, parent_code, name)
SELECT id, code, parent_code, name FROM public.operating_organizations
ON CONFLICT (code) DO NOTHING;
