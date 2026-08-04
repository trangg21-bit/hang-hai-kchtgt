ALTER TABLE IF EXISTS public.approval_history
    ADD COLUMN IF NOT EXISTS changed_field VARCHAR(1000);

ALTER TABLE IF EXISTS public.approval_history
    ADD COLUMN IF NOT EXISTS previous_value TEXT;

ALTER TABLE IF EXISTS public.approval_history
    ADD COLUMN IF NOT EXISTS new_value TEXT;
