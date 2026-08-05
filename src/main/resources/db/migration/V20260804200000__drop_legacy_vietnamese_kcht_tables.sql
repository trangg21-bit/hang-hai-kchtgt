-- V20260804200000: Sync remaining data and drop legacy Vietnamese KCHT tables

DO $$
BEGIN
    -- 1. Sync data from cang_bien to ports if both exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cang_bien')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ports') THEN
        EXECUTE 'INSERT INTO public.ports (id, port_code, port_name, org_unit_id, approval_status, created_by, updated_by, created_at, updated_at)
                 SELECT id, ma_cang, ten_cang, org_unit_id, 0, created_by, updated_by, created_at, updated_at
                 FROM public.cang_bien ON CONFLICT (id) DO NOTHING';
    END IF;

    -- 2. Sync data from ben_cang to berths if both exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ben_cang')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'berths') THEN
        EXECUTE 'INSERT INTO public.berths (id, berth_code, berth_name, port_id, org_unit_id, approval_status, created_by, updated_by, created_at, updated_at)
                 SELECT id, ma_ben, ten_ben, cang_bien_id, org_unit_id, 0, created_by, updated_by, created_at, updated_at
                 FROM public.ben_cang ON CONFLICT (id) DO NOTHING';
    END IF;

    -- 3. Sync data from cau_cang to piers if both exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cau_cang')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'piers') THEN
        EXECUTE 'INSERT INTO public.piers (id, pier_code, pier_name, berth_id, org_unit_id, approval_status, created_by, updated_by, created_at, updated_at)
                 SELECT id, ma_cau, ten_cau, ben_cang_id, org_unit_id, 0, created_by, updated_by, created_at, updated_at
                 FROM public.cau_cang ON CONFLICT (id) DO NOTHING';
    END IF;

    -- 4. Sync data from vung_nuoc to water_zones if both exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vung_nuoc')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'water_zones') THEN
        EXECUTE 'INSERT INTO public.water_zones (id, water_zone_code, water_zone_name, port_id, org_unit_id, approval_status, created_by, updated_by, created_at, updated_at)
                 SELECT id, ma_vung_nuoc, ten_vung_nuoc, cang_bien_id, org_unit_id, 0, created_by, updated_by, created_at, updated_at
                 FROM public.vung_nuoc ON CONFLICT (id) DO NOTHING';
    END IF;

    -- 5. Sync data from cang_can to dry_ports if both exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cang_can')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dry_ports') THEN
        EXECUTE 'INSERT INTO public.dry_ports (id, dry_port_code, dry_port_name, org_unit_id, approval_status, created_by, updated_by, created_at, updated_at)
                 SELECT id, ma_cang_can, ten_cang_can, org_unit_id, 0, created_by, updated_by, created_at, updated_at
                 FROM public.cang_can ON CONFLICT (id) DO NOTHING';
    END IF;
END $$;

-- Drop all legacy Vietnamese tables
DROP TABLE IF EXISTS public.cang_bien CASCADE;
DROP TABLE IF EXISTS public.ben_cang CASCADE;
DROP TABLE IF EXISTS public.cau_cang CASCADE;
DROP TABLE IF EXISTS public.vung_nuoc CASCADE;
DROP TABLE IF EXISTS public.cang_can CASCADE;
DROP TABLE IF EXISTS public.luong_hang_hai CASCADE;
DROP TABLE IF EXISTS public.co_sua_chua_dong_tau CASCADE;
DROP TABLE IF EXISTS public.tram_radar CASCADE;
DROP TABLE IF EXISTS public.he_thong_vts CASCADE;
DROP TABLE IF EXISTS public.de_ke CASCADE;
DROP TABLE IF EXISTS public.giay_to CASCADE;
DROP TABLE IF EXISTS public.lich_su_thay_doi CASCADE;
DROP TABLE IF EXISTS public.phe_duyet_log CASCADE;
