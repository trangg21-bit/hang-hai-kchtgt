-- ==============================================================================
-- Migration: Add symbol_id to vts_zone table
-- Timestamp: 20260910134500
-- ==============================================================================

ALTER TABLE public.vts_zone ADD COLUMN IF NOT EXISTS symbol_id UUID;
COMMENT ON COLUMN public.vts_zone.symbol_id IS 'Khóa ngoại biểu tượng bản đồ (map_symbols)';
