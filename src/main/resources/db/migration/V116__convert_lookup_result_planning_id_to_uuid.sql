CREATE TABLE IF NOT EXISTS lookup_results (
    id UUID PRIMARY KEY,
    quy_hoach_id UUID
);

-- Align lookup_results.quy_hoach_id with LookupResultEntity.planningId.
-- Legacy BIGINT values have no reliable UUID mapping after the planning tables
-- were migrated, so they are cleared rather than replaced with fabricated IDs.
DO $$
DECLARE
    current_type TEXT;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'lookup_results'
          AND column_name = 'quy_hoach_id'
    ) THEN
        SELECT data_type
          INTO current_type
          FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'lookup_results'
           AND column_name = 'quy_hoach_id';

        IF current_type <> 'uuid' THEN
            ALTER TABLE public.lookup_results
                ALTER COLUMN quy_hoach_id TYPE UUID USING NULL;
        END IF;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lookup_results_planning_id
    ON lookup_results(quy_hoach_id);
