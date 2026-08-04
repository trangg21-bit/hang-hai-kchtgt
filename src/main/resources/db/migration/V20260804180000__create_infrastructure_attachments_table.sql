-- V20260804180000: Create unified infrastructure_attachments table with SMALLINT file_type, migrate legacy attachment records, and drop legacy attachment tables

CREATE TABLE IF NOT EXISTS public.infrastructure_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_id UUID NOT NULL,
    ref_type SMALLINT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    file_type SMALLINT DEFAULT 10,
    uploaded_by UUID,
    uploaded_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_attachment_ref ON public.infrastructure_attachments (ref_type, ref_id);

DO $$
BEGIN
    -- 1. vts_system_attachment
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vts_system_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'vts_system_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, vts_system_id, 10, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.vts_system_attachment ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vts_system_attachment' AND column_name = 'he_thong_vts_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, he_thong_vts_id, 10, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.vts_system_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 2. radar_station_attachment
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'radar_station_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'radar_station_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, radar_station_id, 12, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.radar_station_attachment ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'radar_station_attachment' AND column_name = 'tram_radar_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, tram_radar_id, 12, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.radar_station_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 3. ship_repair_facility_attachment & co_sua_chua_dong_tau_attachment
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ship_repair_facility_attachment' AND column_name = 'ship_repair_facility_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, ship_repair_facility_id, 7, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.ship_repair_facility_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'co_sua_chua_dong_tau_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'co_sua_chua_dong_tau_attachment' AND column_name = 'ten_tep') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, co_sua_chua_id, 7, ten_tep, duong_dan, dung_luong, 10, NULL, CURRENT_TIMESTAMP FROM public.co_sua_chua_dong_tau_attachment ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'co_sua_chua_dong_tau_attachment' AND column_name = 'file_name') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, co_sua_chua_id, 7, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.co_sua_chua_dong_tau_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 4. navigation_channel_attachment & luong_hang_hai_attachment
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'navigation_channel_attachment' AND column_name = 'navigation_channel_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, navigation_channel_id, 6, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.navigation_channel_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'luong_hang_hai_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'luong_hang_hai_attachment' AND column_name = 'ten_tep') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, luong_hang_hai_id, 6, ten_tep, duong_dan, dung_luong, 10, NULL, CURRENT_TIMESTAMP FROM public.luong_hang_hai_attachment ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'luong_hang_hai_attachment' AND column_name = 'file_name') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, luong_hang_hai_id, 6, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.luong_hang_hai_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 5. dike_revetment_attachment & de_ke_attachment
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dike_revetment_attachment' AND column_name = 'dike_revetment_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, dike_revetment_id, 5, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.dike_revetment_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'de_ke_attachment') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke_attachment' AND column_name = 'ten_tep') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, de_ke_id, 5, ten_tep, duong_dan, dung_luong, 10, NULL, CURRENT_TIMESTAMP FROM public.de_ke_attachment ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke_attachment' AND column_name = 'file_name') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, de_ke_id, 5, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.de_ke_attachment ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 6. point_attachments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'point_attachments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'point_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, point_id, 0, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.point_attachments ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'point_attachments' AND column_name = 'object_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, CASE WHEN object_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN object_id::uuid ELSE id END, 0, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.point_attachments ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 7. line_attachments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'line_attachments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'line_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, line_id, 1, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.line_attachments ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'line_attachments' AND column_name = 'object_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, CASE WHEN object_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN object_id::uuid ELSE id END, 1, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.line_attachments ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 8. polygon_attachments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'polygon_attachments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'polygon_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, polygon_id, 2, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.polygon_attachments ON CONFLICT (id) DO NOTHING';
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'polygon_attachments' AND column_name = 'object_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, CASE WHEN object_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'' THEN object_id::uuid ELSE id END, 2, file_name, file_url, NULL, 10, NULL, CURRENT_TIMESTAMP FROM public.polygon_attachments ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;

    -- 9. port_attachments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'port_attachments') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'port_attachments' AND column_name = 'port_id') THEN
            EXECUTE 'INSERT INTO public.infrastructure_attachments (id, ref_id, ref_type, file_name, file_path, file_size, file_type, uploaded_by, uploaded_date)
                     SELECT id, port_id, 0, file_name, file_path, file_size, 10, NULL, CURRENT_TIMESTAMP FROM public.port_attachments ON CONFLICT (id) DO NOTHING';
        END IF;
    END IF;
END $$;

-- Drop all legacy attachment tables (both English & Vietnamese names)
DROP TABLE IF EXISTS public.vts_system_attachment CASCADE;
DROP TABLE IF EXISTS public.radar_station_attachment CASCADE;
DROP TABLE IF EXISTS public.ship_repair_facility_attachment CASCADE;
DROP TABLE IF EXISTS public.co_sua_chua_dong_tau_attachment CASCADE;
DROP TABLE IF EXISTS public.navigation_channel_attachment CASCADE;
DROP TABLE IF EXISTS public.luong_hang_hai_attachment CASCADE;
DROP TABLE IF EXISTS public.dike_revetment_attachment CASCADE;
DROP TABLE IF EXISTS public.de_ke_attachment CASCADE;
DROP TABLE IF EXISTS public.point_attachments CASCADE;
DROP TABLE IF EXISTS public.line_attachments CASCADE;
DROP TABLE IF EXISTS public.polygon_attachments CASCADE;
DROP TABLE IF EXISTS public.port_attachments CASCADE;
DROP TABLE IF EXISTS public.attached_documents CASCADE;
