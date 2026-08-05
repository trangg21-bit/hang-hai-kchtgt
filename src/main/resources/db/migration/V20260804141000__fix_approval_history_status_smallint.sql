-- Force alter approval_history status to SMALLINT, approved_date to TIMESTAMP, approved_by to UUID
DO $$
BEGIN
    -- 1. Ensure ref_id and ref_type exist
    ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS ref_id UUID;
    ALTER TABLE public.approval_history ADD COLUMN IF NOT EXISTS ref_type SMALLINT;

    -- 2. approved_by drop NOT NULL and convert to UUID
    BEGIN
        ALTER TABLE public.approval_history ALTER COLUMN approved_by DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        ALTER TABLE public.approval_history ALTER COLUMN approved_by TYPE UUID USING (CASE WHEN approved_by::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN approved_by::text::uuid ELSE NULL END);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 3. approved_date -> TIMESTAMP WITHOUT TIME ZONE
    BEGIN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 4. status -> SMALLINT
    BEGIN
        ALTER TABLE public.approval_history ALTER COLUMN status TYPE SMALLINT USING (
            CASE upper(trim(status::text))
                WHEN 'CREATED' THEN 0
                WHEN 'PROPOSED' THEN 1
                WHEN 'UNDER_REVIEW' THEN 2
                WHEN 'APPROVED' THEN 3
                WHEN 'REJECTED' THEN 4
                WHEN 'UPDATED' THEN 5
                WHEN 'DELETED' THEN 6
                WHEN 'ATTACHMENT_UPLOADED' THEN 7
                WHEN 'ATTACHMENT_DELETED' THEN 8
                ELSE CASE WHEN status::text ~ '^[0-9]+$' THEN status::text::smallint ELSE 0 END
            END
        );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
END $$;
