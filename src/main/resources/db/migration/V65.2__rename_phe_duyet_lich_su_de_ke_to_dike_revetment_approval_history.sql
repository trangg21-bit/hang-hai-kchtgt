-- Rename the legacy Vietnamese approval-history table and columns.
-- Some shared databases already contain part of the English schema, so every
-- rename must be conditional to keep this migration safe on both layouts.
DO $$
BEGIN
    IF to_regclass('public.phe_duyet_lich_su_de_ke') IS NOT NULL
       AND to_regclass('public.dike_revetment_approval_history') IS NULL THEN
        ALTER TABLE public.phe_duyet_lich_su_de_ke
            RENAME TO dike_revetment_approval_history;
    END IF;

    IF to_regclass('public.dike_revetment_approval_history') IS NULL THEN
        RETURN;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.dike_revetment_approval_history'::regclass
          AND conname = 'phe_duyet_lich_su_de_ke_pkey'
    ) AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'public.dike_revetment_approval_history'::regclass
          AND conname = 'dike_revetment_approval_history_pkey'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME CONSTRAINT phe_duyet_lich_su_de_ke_pkey
            TO dike_revetment_approval_history_pkey;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'de_ke_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'dike_revetment_id'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN de_ke_id TO dike_revetment_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'cap_phe_duyet'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'approval_level'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN cap_phe_duyet TO approval_level;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'ly_do'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'reason'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN ly_do TO reason;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'ngay_phe_duyet'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'approval_date'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN ngay_phe_duyet TO approval_date;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'nguoi_phe_duyet'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'approver'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN nguoi_phe_duyet TO approver;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'trang_thai'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
          AND column_name = 'status'
    ) THEN
        ALTER TABLE public.dike_revetment_approval_history
            RENAME COLUMN trang_thai TO status;
    END IF;

    ALTER TABLE public.dike_revetment_approval_history
        DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_de_ke_de_ke;

    IF to_regclass('public.dike_revetment') IS NOT NULL
       AND EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'dike_revetment_approval_history'
             AND column_name = 'dike_revetment_id'
       )
       AND NOT EXISTS (
           SELECT 1 FROM pg_constraint
           WHERE conrelid = 'public.dike_revetment_approval_history'::regclass
             AND conname = 'fk_dike_revetment_approval_history'
       ) THEN
        -- Shared legacy databases can contain history pointing at an already
        -- removed legacy dike. Preserve that audit trail while enforcing the
        -- relationship for every record created after this migration.
        IF EXISTS (
            SELECT 1
            FROM public.dike_revetment_approval_history history
            LEFT JOIN public.dike_revetment dike
                ON dike.id = history.dike_revetment_id
            WHERE dike.id IS NULL
        ) THEN
            ALTER TABLE public.dike_revetment_approval_history
                ADD CONSTRAINT fk_dike_revetment_approval_history
                FOREIGN KEY (dike_revetment_id)
                REFERENCES public.dike_revetment(id) NOT VALID;
        ELSE
            ALTER TABLE public.dike_revetment_approval_history
                ADD CONSTRAINT fk_dike_revetment_approval_history
                FOREIGN KEY (dike_revetment_id)
                REFERENCES public.dike_revetment(id);
        END IF;
    END IF;
END
$$;
