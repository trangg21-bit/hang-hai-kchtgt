DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'de_ke') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke' AND column_name = 'ten_de_ke') THEN
            ALTER TABLE public.de_ke ADD COLUMN ten_de_ke varchar(255) NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke' AND column_name = 'thoi_diem_dua_vao_khai_thac') THEN
            ALTER TABLE public.de_ke ADD COLUMN thoi_diem_dua_vao_khai_thac date NULL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke' AND column_name = 'chieu_rong')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'de_ke' AND column_name = 'cao_trinh_dinh') THEN
            ALTER TABLE public.de_ke RENAME COLUMN chieu_rong TO cao_trinh_dinh;
        END IF;
    END IF;
END $$;
