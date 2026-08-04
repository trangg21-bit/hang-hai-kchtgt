-- Direct ALTER TABLE to convert approver_level1, approver_level2 to UUID
ALTER TABLE public.dike_revetment 
    ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END),
    ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);

ALTER TABLE public.navigation_channel 
    ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END),
    ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);

ALTER TABLE public.vts_system 
    ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END),
    ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);

ALTER TABLE public.ship_repair_facility 
    ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END),
    ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);

ALTER TABLE public.radar_station 
    ALTER COLUMN approver_level1 TYPE UUID USING (CASE WHEN approver_level1::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level1::text::uuid ELSE NULL END),
    ALTER COLUMN approver_level2 TYPE UUID USING (CASE WHEN approver_level2::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approver_level2::text::uuid ELSE NULL END);
