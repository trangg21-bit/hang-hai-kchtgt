DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'luong_hang_hai') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'luong_hang_hai' AND column_name = 'loai_tau')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'luong_hang_hai' AND column_name = 'ten') THEN
            ALTER TABLE public.luong_hang_hai RENAME COLUMN loai_tau TO ten;
        END IF;
    END IF;
END $$;