-- V20260830180500: Add symbol_id column to ais_system
ALTER TABLE public.ais_system ADD COLUMN IF NOT EXISTS symbol_id UUID;
CREATE INDEX IF NOT EXISTS idx_ais_system_symbol ON public.ais_system (symbol_id);
