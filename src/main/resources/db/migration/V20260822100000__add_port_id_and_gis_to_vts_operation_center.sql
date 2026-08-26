-- V20260822100000: Add port_id and GIS fields to vts_operation_center
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS port_id UUID;
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(50);
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS coordinates TEXT;
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS coordinate_system VARCHAR(100);
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS display_rule VARCHAR(255);
ALTER TABLE public.vts_operation_center ADD COLUMN IF NOT EXISTS symbol_id UUID;

CREATE INDEX IF NOT EXISTS idx_vts_op_center_port ON public.vts_operation_center (port_id);
