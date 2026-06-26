-- V13__create_trade_flows_table.sql
-- F-105: Bảng dữ liệu trao đổi thương mại cho Biểu đồ trao đổi thương mại

CREATE TABLE IF NOT EXISTS trade_flows (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_port VARCHAR(100)  NOT NULL COMMENT 'Cảng nguồn',
    dest_port   VARCHAR(100)  NOT NULL COMMENT 'Cảng đích',
    cargo_type  VARCHAR(50)   NOT NULL COMMENT 'Loại hàng hóa',
    quantity    DECIMAL(15,2) NOT NULL COMMENT 'Khối lượng (tấn)',
    period      VARCHAR(20)   NOT NULL COMMENT 'Tháng/Năm, vd: 06/2026',
    created_at  DATE          NOT NULL DEFAULT (CURRENT_DATE),
    INDEX idx_source_port (source_port),
    INDEX idx_dest_port (dest_port),
    INDEX idx_period (period),
    INDEX idx_cargo_type (cargo_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
