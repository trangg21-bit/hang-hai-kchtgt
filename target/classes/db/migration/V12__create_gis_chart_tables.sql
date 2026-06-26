-- V12: Create GIS chart tables for S-57 / S-63 integration
CREATE TABLE IF NOT EXISTS enc_cells (
    id              UUID PRIMARY KEY,
    cell_name       VARCHAR(100) NOT NULL UNIQUE,
    producer        VARCHAR(100),
    edition         INT,
    scale           INT,
    update_number   INT,
    release_date    DATE,
    is_encrypted    BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS enc_features (
    id              UUID PRIMARY KEY,
    cell_id         UUID NOT NULL,
    feature_name    VARCHAR(200),
    feature_code    VARCHAR(50) NOT NULL, -- e.g. BOYSPP, DEPCNT, LNDARE
    geometry_type   VARCHAR(20) NOT NULL, -- e.g. POINT, LINE, POLYGON
    coordinates     TEXT NOT NULL,        -- WKT or GeoJSON string
    attributes_json TEXT,                 -- JSON attributes
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL,
    CONSTRAINT fk_enc_features_cell FOREIGN KEY (cell_id) REFERENCES enc_cells(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS s63_permits (
    id              UUID PRIMARY KEY,
    cell_name       VARCHAR(100) NOT NULL UNIQUE,
    permit_key      VARCHAR(200) NOT NULL,
    expiry_date     DATE NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_enc_features_cell ON enc_features(cell_id);
CREATE INDEX IF NOT EXISTS idx_enc_features_code ON enc_features(feature_code);
