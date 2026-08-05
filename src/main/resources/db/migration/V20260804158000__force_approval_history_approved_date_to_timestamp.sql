-- Force convert approval_history.approved_date to TIMESTAMP
ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP USING approved_date::timestamp;
