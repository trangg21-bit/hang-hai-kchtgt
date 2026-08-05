-- Fix port_coordinates id to use sequence (only if id column is numeric/bigint)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'port_coordinates' 
        AND column_name = 'id' AND data_type IN ('bigint', 'integer', 'smallint', 'numeric')
        AND is_identity = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_coordinates_id_seq') THEN
            CREATE SEQUENCE port_coordinates_id_seq;
        END IF;
        
        ALTER TABLE port_coordinates ALTER COLUMN id SET DEFAULT nextval('port_coordinates_id_seq');
        PERFORM setval('port_coordinates_id_seq', COALESCE((SELECT MAX(id) FROM port_coordinates), 0) + 1, false);
        ALTER SEQUENCE port_coordinates_id_seq OWNED BY port_coordinates.id;
    END IF;
END $$;

-- Same for port_infrastructure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'port_infrastructure' 
        AND column_name = 'id' AND data_type IN ('bigint', 'integer', 'smallint', 'numeric')
        AND is_identity = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_infrastructure_id_seq') THEN
            CREATE SEQUENCE port_infrastructure_id_seq;
        END IF;
        
        ALTER TABLE port_infrastructure ALTER COLUMN id SET DEFAULT nextval('port_infrastructure_id_seq');
        PERFORM setval('port_infrastructure_id_seq', COALESCE((SELECT MAX(id) FROM port_infrastructure), 0) + 1, false);
        ALTER SEQUENCE port_infrastructure_id_seq OWNED BY port_infrastructure.id;
    END IF;
END $$;

-- Same for port_attachments  
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'port_attachments' 
        AND column_name = 'id' AND data_type IN ('bigint', 'integer', 'smallint', 'numeric')
        AND is_identity = 'NO'
    ) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_attachments_id_seq') THEN
            CREATE SEQUENCE port_attachments_id_seq;
        END IF;
        
        ALTER TABLE port_attachments ALTER COLUMN id SET DEFAULT nextval('port_attachments_id_seq');
        PERFORM setval('port_attachments_id_seq', COALESCE((SELECT MAX(id) FROM port_attachments), 0) + 1, false);
        ALTER SEQUENCE port_attachments_id_seq OWNED BY port_attachments.id;
    END IF;
END $$;
