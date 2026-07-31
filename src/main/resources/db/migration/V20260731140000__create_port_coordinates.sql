-- V100: Create port_coordinates table (PostgreSQL)
CREATE SEQUENCE IF NOT EXISTS port_coordinates_id_seq;

CREATE TABLE IF NOT EXISTS port_coordinates (
    id          BIGINT       NOT NULL DEFAULT nextval('port_coordinates_id_seq'),
    port_id     UUID         NOT NULL,
    latitude    DECIMAL(9,6) NOT NULL,
    longitude   DECIMAL(9,6) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    DEFAULT NOW(),

    PRIMARY KEY (id),
    CONSTRAINT fk_port_coordinates_port
        FOREIGN KEY (port_id) REFERENCES ports(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_port_coordinates_port_id ON port_coordinates (port_id);
CREATE INDEX IF NOT EXISTS idx_port_coordinates_sort_order ON port_coordinates (port_id, sort_order);

ALTER SEQUENCE port_coordinates_id_seq OWNED BY port_coordinates.id;
