-- V63: Add deleted_by column to all KCHT management tables
-- Tracks who performed the soft-delete

DO $$
BEGIN
    -- 1. cang_bien
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cang_bien') THEN
        ALTER TABLE public.cang_bien ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 1b. ports
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ports') THEN
        ALTER TABLE public.ports ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 2. ben_cang
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ben_cang') THEN
        ALTER TABLE public.ben_cang ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 2b. berths
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'berths') THEN
        ALTER TABLE public.berths ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 3. cau_cang
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cau_cang') THEN
        ALTER TABLE public.cau_cang ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 3b. piers
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'piers') THEN
        ALTER TABLE public.piers ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 4. cang_can
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'cang_can') THEN
        ALTER TABLE public.cang_can ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 4b. dry_ports
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'dry_ports') THEN
        ALTER TABLE public.dry_ports ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 5. vung_nuoc
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'vung_nuoc') THEN
        ALTER TABLE public.vung_nuoc ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 5b. water_zones
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'water_zones') THEN
        ALTER TABLE public.water_zones ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 6. giay_to
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'giay_to') THEN
        ALTER TABLE public.giay_to ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 6b. documents
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'documents') THEN
        ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 7. lich_su_thay_doi
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lich_su_thay_doi') THEN
        ALTER TABLE public.lich_su_thay_doi ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 7b. change_logs
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'change_logs') THEN
        ALTER TABLE public.change_logs ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;

    -- 8. phe_duyet_log
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'phe_duyet_log') THEN
        ALTER TABLE public.phe_duyet_log ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
    -- 8b. approval_logs
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'approval_logs') THEN
        ALTER TABLE public.approval_logs ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(36);
    END IF;
END $$;
