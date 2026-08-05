-- Force convert buoy_station approved_by to UUID
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'buoy_station' AND column_name = 'approved_by') THEN 
        ALTER TABLE public.buoy_station 
            ALTER COLUMN approved_by TYPE UUID USING (
                CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
                THEN approved_by::text::uuid ELSE NULL END
            );
    END IF; 
END $$;
