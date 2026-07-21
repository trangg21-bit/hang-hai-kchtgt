-- Convert approval_status in buoy from varchar to integer if it is not already integer
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'buoy' 
          AND column_name = 'approval_status' 
          AND data_type = 'character varying'
    ) THEN
        ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS buoy_approval_status_check;
        UPDATE public.buoy SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
        UPDATE public.buoy SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
        UPDATE public.buoy SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
        ALTER TABLE public.buoy ALTER COLUMN approval_status TYPE integer USING (approval_status::integer);
    END IF;
END $$;
