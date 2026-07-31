-- V103: Fix port_coordinates id to use sequence (for tables already created by Hibernate)
DO $$
BEGIN
    -- Create sequence if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_coordinates_id_seq') THEN
        CREATE SEQUENCE port_coordinates_id_seq;
    END IF;
    
    -- Set default for id column to use sequence
    ALTER TABLE port_coordinates ALTER COLUMN id SET DEFAULT nextval('port_coordinates_id_seq');
    
    -- Set the sequence to the max existing id
    PERFORM setval('port_coordinates_id_seq', COALESCE((SELECT MAX(id) FROM port_coordinates), 0) + 1, false);
    
    -- Ensure sequence is owned by the column
    ALTER SEQUENCE port_coordinates_id_seq OWNED BY port_coordinates.id;
END $$;

-- Same for port_infrastructure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_infrastructure_id_seq') THEN
        CREATE SEQUENCE port_infrastructure_id_seq;
    END IF;
    
    ALTER TABLE port_infrastructure ALTER COLUMN id SET DEFAULT nextval('port_infrastructure_id_seq');
    
    PERFORM setval('port_infrastructure_id_seq', COALESCE((SELECT MAX(id) FROM port_infrastructure), 0) + 1, false);
    
    ALTER SEQUENCE port_infrastructure_id_seq OWNED BY port_infrastructure.id;
END $$;

-- Same for port_attachments  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'port_attachments_id_seq') THEN
        CREATE SEQUENCE port_attachments_id_seq;
    END IF;
    
    ALTER TABLE port_attachments ALTER COLUMN id SET DEFAULT nextval('port_attachments_id_seq');
    
    PERFORM setval('port_attachments_id_seq', COALESCE((SELECT MAX(id) FROM port_attachments), 0) + 1, false);
    
    ALTER SEQUENCE port_attachments_id_seq OWNED BY port_attachments.id;
END $$;
