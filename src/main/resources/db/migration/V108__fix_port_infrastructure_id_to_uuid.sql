-- V108: Fix port_infrastructure and port_attachments id column BIGINT → UUID
-- (V105 was modified after Flyway already ran it, so checksum mismatch prevents re-run)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_infrastructure' AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE port_infrastructure ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE port_infrastructure ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_attachments' AND column_name = 'id' AND data_type = 'bigint') THEN
        ALTER TABLE port_attachments ALTER COLUMN id TYPE UUID USING gen_random_uuid();
        ALTER TABLE port_attachments ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;
