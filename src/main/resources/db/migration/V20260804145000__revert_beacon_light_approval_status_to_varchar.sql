-- Revert beacon_light approval_status to VARCHAR(255) as expected by BeaconLight entity
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.beacon_light ALTER COLUMN approval_status TYPE VARCHAR(255) USING approval_status::text;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
