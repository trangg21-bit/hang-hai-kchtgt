-- Thêm cột nội dung phê duyệt cho bảng piers
-- (tham khảo berths — portAuthorityApprovalContent / departmentApprovalContent)
ALTER TABLE piers ADD COLUMN IF NOT EXISTS port_authority_approval_content VARCHAR(1000);
ALTER TABLE piers ADD COLUMN IF NOT EXISTS department_approval_content VARCHAR(1000);
