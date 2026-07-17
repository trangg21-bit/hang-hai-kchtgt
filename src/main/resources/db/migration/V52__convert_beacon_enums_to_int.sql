-- Drop existing check constraints from STRING-based @Enumerated mappings
ALTER TABLE public.beacon_light DROP CONSTRAINT IF EXISTS beacon_light_type_check;
ALTER TABLE public.beacon_light DROP CONSTRAINT IF EXISTS beacon_light_status_check;
ALTER TABLE public.beacon_light DROP CONSTRAINT IF EXISTS beacon_light_approval_status_check;

ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS buoy_type_check;
ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS buoy_status_check;
ALTER TABLE public.buoy DROP CONSTRAINT IF EXISTS buoy_approval_status_check;

ALTER TABLE public.nha_tram_den DROP CONSTRAINT IF EXISTS nha_tram_den_type_check;
ALTER TABLE public.nha_tram_phao DROP CONSTRAINT IF EXISTS nha_tram_phao_type_check;

-- Convert beacon_light type, status, approval_status to integer
UPDATE public.beacon_light SET type = '1' WHERE type ILIKE 'LIGHTHOUSE' OR type IS NULL;
UPDATE public.beacon_light SET type = '2' WHERE type ILIKE 'BEACON_LIGHT';
UPDATE public.beacon_light SET type = '3' WHERE type ILIKE 'BEACON_MARK';
ALTER TABLE public.beacon_light ALTER COLUMN type TYPE integer USING (type::integer);

UPDATE public.beacon_light SET status = '0' WHERE status ILIKE 'DRAFT' OR status IS NULL;
UPDATE public.beacon_light SET status = '1' WHERE status ILIKE 'PENDING_APPROVAL';
UPDATE public.beacon_light SET status = '2' WHERE status ILIKE 'APPROVED_L1';
UPDATE public.beacon_light SET status = '3' WHERE status ILIKE 'APPROVED_L2';
UPDATE public.beacon_light SET status = '4' WHERE status ILIKE 'PUBLISHED';
UPDATE public.beacon_light SET status = '5' WHERE status ILIKE 'REJECTED';
UPDATE public.beacon_light SET status = '6' WHERE status ILIKE 'DELETED';
ALTER TABLE public.beacon_light ALTER COLUMN status TYPE integer USING (status::integer);

UPDATE public.beacon_light SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
UPDATE public.beacon_light SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
UPDATE public.beacon_light SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
ALTER TABLE public.beacon_light ALTER COLUMN approval_status TYPE integer USING (approval_status::integer);

-- Convert buoy type, status, approval_status to integer
UPDATE public.buoy SET type = '1' WHERE type ILIKE 'CARDINAL' OR type IS NULL;
UPDATE public.buoy SET type = '2' WHERE type ILIKE 'SECTOR';
UPDATE public.buoy SET type = '3' WHERE type ILIKE 'SPECIAL';
UPDATE public.buoy SET type = '4' WHERE type ILIKE 'SAFE_WATER';
UPDATE public.buoy SET type = '5' WHERE type ILIKE 'ISOLATED_DANGER';
ALTER TABLE public.buoy ALTER COLUMN type TYPE integer USING (type::integer);

UPDATE public.buoy SET status = '0' WHERE status ILIKE 'DRAFT' OR status IS NULL;
UPDATE public.buoy SET status = '1' WHERE status ILIKE 'PENDING_APPROVAL';
UPDATE public.buoy SET status = '2' WHERE status ILIKE 'APPROVED_L1';
UPDATE public.buoy SET status = '3' WHERE status ILIKE 'APPROVED_L2';
UPDATE public.buoy SET status = '4' WHERE status ILIKE 'PUBLISHED';
UPDATE public.buoy SET status = '5' WHERE status ILIKE 'REJECTED';
UPDATE public.buoy SET status = '6' WHERE status ILIKE 'DELETED';
ALTER TABLE public.buoy ALTER COLUMN status TYPE integer USING (status::integer);

UPDATE public.buoy SET approval_status = '0' WHERE approval_status ILIKE 'PENDING' OR approval_status IS NULL;
UPDATE public.buoy SET approval_status = '1' WHERE approval_status ILIKE 'APPROVED';
UPDATE public.buoy SET approval_status = '2' WHERE approval_status ILIKE 'REJECTED';
ALTER TABLE public.buoy ALTER COLUMN approval_status TYPE integer USING (approval_status::integer);

-- Convert nha_tram_den type to integer
UPDATE public.nha_tram_den SET type = '1' WHERE type ILIKE 'LIGHTHOUSE' OR type IS NULL;
UPDATE public.nha_tram_den SET type = '2' WHERE type ILIKE 'BEACON_LIGHT';
UPDATE public.nha_tram_den SET type = '3' WHERE type ILIKE 'BEACON_MARK';
ALTER TABLE public.nha_tram_den ALTER COLUMN type TYPE integer USING (type::integer);

-- Convert nha_tram_phao type to integer
UPDATE public.nha_tram_phao SET type = '1' WHERE type ILIKE 'CARDINAL' OR type IS NULL;
UPDATE public.nha_tram_phao SET type = '2' WHERE type ILIKE 'SECTOR';
UPDATE public.nha_tram_phao SET type = '3' WHERE type ILIKE 'SPECIAL';
UPDATE public.nha_tram_phao SET type = '4' WHERE type ILIKE 'SAFE_WATER';
UPDATE public.nha_tram_phao SET type = '5' WHERE type ILIKE 'ISOLATED_DANGER';
ALTER TABLE public.nha_tram_phao ALTER COLUMN type TYPE integer USING (type::integer);
