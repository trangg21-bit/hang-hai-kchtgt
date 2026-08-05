-- Force alter approval_history approved_date to TIMESTAMP WITHOUT TIME ZONE
ALTER TABLE public.approval_history 
    ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING (CASE WHEN approved_date IS NULL THEN NULL ELSE approved_date::timestamp END);
