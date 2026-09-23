-- ============================================================================
-- V20260923090000: Standardize navigation_channel channel_code format to LHH-000001
-- ============================================================================

DO $$
BEGIN
    -- 1. Chuẩn hóa channel_code từ LHH000001 sang LHH-000001 trong bảng navigation_channel
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'navigation_channel')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel' AND column_name = 'channel_code') THEN
        
        UPDATE public.navigation_channel nc
           SET channel_code = 'LHH-' || SUBSTRING(nc.channel_code FROM 4)
         WHERE nc.channel_code ~ '^LHH[0-9]+$'
           AND NOT EXISTS (
               SELECT 1 FROM public.navigation_channel nc2
                WHERE nc2.org_unit_id = nc.org_unit_id
                  AND nc2.channel_code = 'LHH-' || SUBSTRING(nc.channel_code FROM 4)
                  AND nc2.deleted_at IS NULL
                  AND nc2.id <> nc.id
           );
    END IF;

    -- 2. Chuẩn hóa route_code trong bảng channel_route_detail từ LHH000001-01 sang LHH-000001-01
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'channel_route_detail')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'channel_route_detail' AND column_name = 'route_code') THEN
        
        UPDATE public.channel_route_detail crd
           SET route_code = 'LHH-' || SUBSTRING(crd.route_code FROM 4)
         WHERE crd.route_code ~ '^LHH[0-9]+-[0-9]+$';
    END IF;
END $$;
