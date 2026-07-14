-- Enable pg_trgm extension if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for cau_cang (Cầu cảng)
CREATE INDEX IF NOT EXISTS idx_cau_cang_ten_cau_trgm ON public.cau_cang USING gin (ten_cau gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cau_cang_ma_cau_trgm ON public.cau_cang USING gin (ma_cau gin_trgm_ops);

-- Index for ben_cang (Bến cảng)
CREATE INDEX IF NOT EXISTS idx_ben_cang_ten_ben_trgm ON public.ben_cang USING gin (ten_ben gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ben_cang_ma_ben_trgm ON public.ben_cang USING gin (ma_ben gin_trgm_ops);

-- Index for cang_bien (Cảng biển)
CREATE INDEX IF NOT EXISTS idx_cang_bien_ten_cang_trgm ON public.cang_bien USING gin (ten_cang gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cang_bien_ma_cang_trgm ON public.cang_bien USING gin (ma_cang gin_trgm_ops);

-- Index for vung_nuoc (Vùng nước)
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_ten_vn_trgm ON public.vung_nuoc USING gin (ten_vung_nuoc gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_vung_nuoc_ma_vn_trgm ON public.vung_nuoc USING gin (ma_vung_nuoc gin_trgm_ops);

-- Index for cang_can (Cảng cạn)
CREATE INDEX IF NOT EXISTS idx_cang_can_ten_cang_can_trgm ON public.cang_can USING gin (ten_cang_can gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cang_can_ma_cang_can_trgm ON public.cang_can USING gin (ma_cang_can gin_trgm_ops);
