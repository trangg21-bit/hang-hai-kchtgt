-- V36: Create and seed map_symbols table with sample data

-- Create table map_symbols if it does not exist (robust check to prevent conflict with hibernate ddl-auto)
CREATE TABLE IF NOT EXISTS map_symbols (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    symbol_value VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    created_by VARCHAR(50),
    updated_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Insert sample records if not already exist (avoiding conflicts via ON CONFLICT)
INSERT INTO map_symbols (id, code, name, description, category, icon, color, symbol_value, status, created_by, created_at, updated_at, deleted_at) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445501', 'SYM-HD', 'Hướng đi', 'Ký hiệu hướng đi của tàu thuyền', 'navigation', 'ArrowRightOutlined', '#1677ff', 'HD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445502', 'SYM-DC', 'Đường chính', 'Ký hiệu luồng hàng hải chính', 'road', 'LineOutlined', '#52c41a', 'DC', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445503', 'SYM-TT', 'Tọa độ', 'Ký hiệu điểm mốc tọa độ hải văn', 'position', 'MapOutlined', '#faad14', 'TT', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445504', 'SYM-CC', 'Chia cắt', 'Ký hiệu phân làn giao thông hàng hải', 'division', 'DividerOutlined', '#f5222d', 'CC', 'inactive', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445505', 'SYM-CT', 'Cửa tầng', 'Ký hiệu cửa thu nước cảng biển', 'building', 'DoorOutlined', '#722ed1', 'CT', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445506', 'SYM-BN', 'Bến ngầm', 'Ký hiệu bến đậu ngầm của tàu ngầm', 'transport', 'ShipOutlined', '#13c2c2', 'BN', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445507', 'SYM-OD', 'Địa điểm', 'Ký hiệu địa điểm cảng vụ', 'location', 'EnvironmentOutlined', '#eb2f96', 'OD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445508', 'SYM-PTA', 'Phao loại A', 'Ký hiệu phao tiêu chỉ giới loại A', 'navigation', 'InfoCircleOutlined', '#2f54eb', 'PTA', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445509', 'SYM-PTB', 'Phao loại B', 'Ký hiệu phao tiêu chỉ giới loại B', 'navigation', 'InfoCircleFilled', '#722ed1', 'PTB', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445510', 'SYM-DB1', 'Đèn biển chính', 'Hải đăng cấp 1 khu vực ven bờ', 'navigation', 'BulbOutlined', '#fa8c16', 'DB1', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445511', 'SYM-DB2', 'Đèn biển phụ', 'Đèn báo hiệu phụ lối vào luồng', 'navigation', 'BulbFilled', '#fadb14', 'DB2', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445512', 'SYM-VTC', 'Vùng cấm', 'Ký hiệu vùng cấm neo đậu hàng hải', 'division', 'StopOutlined', '#ff4d4f', 'VTC', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445513', 'SYM-VQD', 'Vùng quay đầu', 'Ký hiệu vùng dành cho tàu quay đầu', 'navigation', 'SyncOutlined', '#52c41a', 'VQD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445514', 'SYM-NBD', 'Neo bão', 'Ký hiệu khu vực trú bão của tàu', 'location', 'HomeOutlined', '#13c2c2', 'NBD', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL),
  ('a1b2c3d4-e5f6-7a8b-9c0d-112233445515', 'SYM-QY', 'Quét lôi', 'Ký hiệu khu vực đang rà quét chướng ngại vật', 'navigation', 'RadarChartOutlined', '#faad14', 'QY', 'active', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
ON CONFLICT (code) DO NOTHING;
