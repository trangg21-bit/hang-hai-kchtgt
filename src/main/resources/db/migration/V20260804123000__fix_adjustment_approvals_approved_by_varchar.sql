ALTER TABLE public.adjustment_approvals ALTER COLUMN approved_by TYPE VARCHAR(100) USING approved_by::text;
