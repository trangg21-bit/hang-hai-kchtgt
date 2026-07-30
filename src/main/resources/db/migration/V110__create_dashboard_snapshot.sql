CREATE TABLE IF NOT EXISTS dashboard_snapshot (
    id UUID PRIMARY KEY,
    snapshot_year INT NOT NULL,
    province_id INT,
    total_count BIGINT NOT NULL,
    operating_count BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboard_snapshot_year ON dashboard_snapshot(snapshot_year);
CREATE UNIQUE INDEX idx_dashboard_snapshot_unique ON dashboard_snapshot(snapshot_year, COALESCE(province_id, -1));

CREATE TABLE IF NOT EXISTS dashboard_snapshot_detail (
    id UUID PRIMARY KEY,
    snapshot_id UUID NOT NULL,
    kcht_type VARCHAR(100) NOT NULL,
    total_count BIGINT NOT NULL,
    operating_count BIGINT NOT NULL,
    pending_count BIGINT NOT NULL,
    suspended_count BIGINT NOT NULL,
    sequence_no INT NOT NULL,
    CONSTRAINT fk_snapshot_detail FOREIGN KEY (snapshot_id) REFERENCES dashboard_snapshot(id) ON DELETE CASCADE
);

CREATE INDEX idx_snapshot_detail_snapshot_id ON dashboard_snapshot_detail(snapshot_id);

-- Seed fake data for 2025 (National)
INSERT INTO dashboard_snapshot (id, snapshot_year, province_id, total_count, operating_count, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', 2025, NULL, 5000, 4800, CURRENT_TIMESTAMP);

INSERT INTO dashboard_snapshot_detail (id, snapshot_id, kcht_type, total_count, operating_count, pending_count, suspended_count, sequence_no)
VALUES 
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Bến cảng', 300, 280, 10, 10, 1),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Đèn biển', 4700, 4520, 90, 90, 2);
