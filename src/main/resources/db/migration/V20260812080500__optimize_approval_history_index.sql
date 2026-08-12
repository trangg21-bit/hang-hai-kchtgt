-- Optimize index for approval_history table to include approved_date DESC for sorting performance
DROP INDEX IF EXISTS public.idx_approval_history_ref;

CREATE INDEX IF NOT EXISTS idx_approval_history_ref ON public.approval_history (ref_type, ref_id, approved_date DESC);
CREATE INDEX IF NOT EXISTS idx_approval_history_ref_id_date ON public.approval_history (ref_id, approved_date DESC);
