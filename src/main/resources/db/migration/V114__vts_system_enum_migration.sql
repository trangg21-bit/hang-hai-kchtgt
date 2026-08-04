CREATE TABLE IF NOT EXISTS vts_system (
    id UUID PRIMARY KEY
);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vts_system' AND column_name='condition_status' AND udt_name NOT IN ('int2', 'int4', 'int8', 'smallint', 'integer')) THEN
    ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS condition_status_new SMALLINT;
    UPDATE vts_system SET condition_status_new = 
      CASE condition_status::text
        WHEN 'TOT' THEN 0 WHEN 'XUONG_CAP' THEN 1 WHEN 'HU_HONG' THEN 2
        ELSE NULL END;
    ALTER TABLE vts_system DROP COLUMN condition_status;
    ALTER TABLE vts_system RENAME COLUMN condition_status_new TO condition_status;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vts_system' AND column_name='approval_status' AND udt_name NOT IN ('int2', 'int4', 'int8', 'smallint', 'integer')) THEN
    ALTER TABLE vts_system ADD COLUMN IF NOT EXISTS approval_status_new SMALLINT;
    UPDATE vts_system SET approval_status_new = 
      CASE approval_status::text
        WHEN 'PROPOSED' THEN 0 WHEN 'UNDER_REVIEW' THEN 1
        WHEN 'APPROVED' THEN 2 WHEN 'REJECTED' THEN 3
        ELSE 0 END;
    ALTER TABLE vts_system DROP COLUMN approval_status;
    ALTER TABLE vts_system RENAME COLUMN approval_status_new TO approval_status;
  END IF;
END $$;
