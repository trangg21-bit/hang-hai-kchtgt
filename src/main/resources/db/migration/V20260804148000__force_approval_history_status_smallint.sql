-- Force convert approval_history status to SMALLINT
ALTER TABLE public.approval_history 
    ALTER COLUMN status TYPE SMALLINT USING (
        CASE upper(trim(COALESCE(status::text, '0')))
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
