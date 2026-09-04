-- Bổ sung an toàn cột symbol_id cho bảng vts_operation_center và ais_system.
-- Phục vụ liên kết biểu tượng bản đồ (MapSymbol) đồng bộ với entity JPA và kho GIS.

ALTER TABLE public.vts_operation_center
    ADD COLUMN IF NOT EXISTS symbol_id UUID;

CREATE INDEX IF NOT EXISTS idx_vts_op_center_symbol
    ON public.vts_operation_center (symbol_id);

ALTER TABLE public.ais_system
    ADD COLUMN IF NOT EXISTS symbol_id UUID;

CREATE INDEX IF NOT EXISTS idx_ais_system_symbol
    ON public.ais_system (symbol_id);

