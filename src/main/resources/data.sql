-- Initial database seeding for users and core data

-- 1. App Users
INSERT INTO app_users (id, username, password, email, full_name, phone, status, created_at, updated_at, failed_login_count, failed_totp_count)
VALUES
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be1', 'admin',    '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'admin@hh.gov.vn',   'Nguyễn Văn An',  '0912345678', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be2', 'trantmai', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'trantmai@hh.gov.vn', 'Trần Thị Mai',   '0912345679', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be3', 'leantuan', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'leantuan@hh.gov.vn', 'Lê Anh Tuan',    '0912345680', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be4', 'phamdm',   '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamdm@hh.gov.vn',   'Phạm Đức Minh',  '0912345681', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469be5', 'buivanh',  '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'buivanh@hh.gov.vn',  'Bùi Văn Anh',    '0912345682', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf1', 'nguyenthib', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenthib@hh.gov.vn', 'Nguyễn Thị Bình', '0912345683', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf2', 'phamvancl', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamvancl@hh.gov.vn', 'Phạm Văn Cường', '0912345684', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf3', 'hoangthid', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'hoangthid@hh.gov.vn', 'Hoàng Thị Dung', '0912345685', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf4', 'vuvanem', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvanem@hh.gov.vn', 'Vũ Văn Em', '0912345686', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf5', 'lethif', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'lethif@hh.gov.vn', 'Lê Thị Hoa', '0912345687', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf6', 'nguyenvang', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenvang@hh.gov.vn', 'Nguyễn Văn Giáp', '0912345688', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf7', 'tranvanh', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvanh@hh.gov.vn', 'Trần Văn Hải', '0912345689', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf8', 'phamthii', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamthii@hh.gov.vn', 'Phạm Thị Inh', '0912345690', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bf9', 'vuvank', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvank@hh.gov.vn', 'Vũ Văn Khánh', '0912345691', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfa', 'lethil', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'lethil@hh.gov.vn', 'Lê Thị Lan', '0912345692', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfb', 'nguyenvanm', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'nguyenvanm@hh.gov.vn', 'Nguyễn Văn Minh', '0912345693', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfc', 'tranvann', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvann@hh.gov.vn', 'Trần Văn Nam', '0912345694', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfd', 'phamthio', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'phamthio@hh.gov.vn', 'Phạm Thị Oanh', '0912345695', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bfe', 'vuvap', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'vuvap@hh.gov.vn', 'Vũ Văn Phong', '0912345696', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0),
  ('5d6b49e1-2cbe-4b45-8f6a-115f21469bff', 'tranvanb', '$2a$10$eOMdO1.kRTS150bCD7dh2.JegLn8.srSS9.fqT2KvtD4vqC/gM1za', 'tranvanb@hh.gov.vn', 'Trần Văn Bình', '0912345697', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 0);

-- 2. Core Direct Permission Overrides
INSERT INTO user_permission_override (id, user_id, permission_code, is_granted, created_at, updated_at)
VALUES
  (gen_random_uuid(), '5d6b49e1-2cbe-4b45-8f6a-115f21469be1', 'admin:all', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), '5d6b49e1-2cbe-4b45-8f6a-115f21469bff', 'admin:all', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
