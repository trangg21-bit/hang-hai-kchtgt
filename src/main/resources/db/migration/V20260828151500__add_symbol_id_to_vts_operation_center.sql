-- V20260828151500: Add symbol_id column to vts_operation_center
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS symbol_id UUID;
CREATE INDEX IF NOT EXISTS idx_vts_op_center_symbol ON public.vts_operation_center (symbol_id);

