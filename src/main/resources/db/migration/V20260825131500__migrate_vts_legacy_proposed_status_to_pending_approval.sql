-- Migrate legacy PROPOSED (1) status to PENDING_APPROVAL (2) for VTS System
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE LOWER(table_name) = 'vts_system' 
      AND LOWER(column_name) = 'approval_status'
  ) THEN
    UPDATE public.vts_system 
    SET approval_status = 2 
    WHERE approval_status = 1;
  END IF;
END $$;
