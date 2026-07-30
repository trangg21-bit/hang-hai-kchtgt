-- Tạo bảng port_infrastructure lưu danh sách công trình KCHT trực thuộc mỗi Cảng biển
CREATE TABLE port_infrastructure (
    id BIGSERIAL PRIMARY KEY,
    port_id UUID NOT NULL REFERENCES ports(id) ON DELETE CASCADE,
    stt INTEGER NOT NULL,
    infra_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index để truy vấn nhanh theo port_id
CREATE INDEX idx_port_infrastructure_port_id ON port_infrastructure(port_id);
