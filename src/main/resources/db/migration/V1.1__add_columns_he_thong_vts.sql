DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'he_thong_vts')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'he_thong_vts' AND column_name = 'pham_vi_ap_dung') THEN
        ALTER TABLE public.he_thong_vts ADD COLUMN pham_vi_ap_dung varchar(2000) NULL;
    END IF;
END $$;
