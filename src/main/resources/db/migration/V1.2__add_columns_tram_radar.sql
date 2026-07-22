DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tram_radar') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tram_radar' AND column_name = 'he_thong_vts_id') THEN
            ALTER TABLE public.tram_radar ADD COLUMN he_thong_vts_id int8 NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tram_radar' AND column_name = 'chieu_cao_thap_radar') THEN
            ALTER TABLE public.tram_radar ADD COLUMN chieu_cao_thap_radar NUMERIC(20, 4) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tram_radar' AND column_name = 'tam_hieu_luc_radar') THEN
            ALTER TABLE public.tram_radar ADD COLUMN tam_hieu_luc_radar NUMERIC(20, 0) NULL;
        END IF;
    END IF;
END $$;
