-- Thêm cột log phê duyệt 2 cấp cho bảng piers
-- (tham khảo V112__alter_berths_two_level_approval.sql cho bảng berths)
ALTER TABLE piers ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP;
ALTER TABLE piers ADD COLUMN IF NOT EXISTS submitted_for_approval_by VARCHAR(100);
ALTER TABLE piers ADD COLUMN IF NOT EXISTS port_authority_approved_at TIMESTAMP;
ALTER TABLE piers ADD COLUMN IF NOT EXISTS port_authority_approved_by VARCHAR(100);
ALTER TABLE piers ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMP;
ALTER TABLE piers ADD COLUMN IF NOT EXISTS department_approved_by VARCHAR(100);
