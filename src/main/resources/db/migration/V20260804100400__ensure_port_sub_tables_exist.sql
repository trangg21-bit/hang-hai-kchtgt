-- V20260804100400: Ensure port_coordinates, port_infrastructures, port_attachments exist
CREATE TABLE IF NOT EXISTS port_coordinates (
    id UUID NOT NULL DEFAULT gen_random_uuid(), port_id UUID NOT NULL REFERENCES ports(id),
    latitude DECIMAL(9,6) NOT NULL, longitude DECIMAL(9,6) NOT NULL,
    sort_order INTEGER DEFAULT 0, created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(), deleted_at TIMESTAMP,
    created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_coordinates PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_coordinates_port_id ON port_coordinates(port_id);

CREATE TABLE IF NOT EXISTS port_infrastructures (
    id UUID NOT NULL DEFAULT gen_random_uuid(), port_id UUID NOT NULL REFERENCES ports(id),
    sequence_number INTEGER NOT NULL, infrastructure_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP, created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_infrastructures PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_infrastructures_port_id ON port_infrastructures(port_id);

CREATE TABLE IF NOT EXISTS port_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid(), port_id UUID NOT NULL REFERENCES ports(id),
    file_name VARCHAR(255) NOT NULL, file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL, content_type VARCHAR(100), uploaded_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(), updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP, created_by UUID, updated_by UUID, deleted_by UUID,
    CONSTRAINT pk_port_attachments PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_port_attachments_port_id ON port_attachments(port_id);
