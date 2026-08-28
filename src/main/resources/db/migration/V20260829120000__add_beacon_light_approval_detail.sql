-- Nâng cấp phê duyệt Đèn biển (beacon_light) lên 2 cấp: Cảng vụ/Chi cục (L1) → Cục (L2)
-- Bổ sung thông tin phê duyệt chi tiết (người gửi, ngày gửi, người duyệt + nội dung từng cấp)
ALTER TABLE beacon_light
    ADD COLUMN submitted_by UUID NULL,
    ADD COLUMN submitted_at TIMESTAMP NULL,
    ADD COLUMN approver_level1 UUID NULL,
    ADD COLUMN approved_date_level1 TIMESTAMP NULL,
    ADD COLUMN approval_content_level1 VARCHAR(500) NULL,
    ADD COLUMN approver_level2 UUID NULL,
    ADD COLUMN approved_date_level2 TIMESTAMP NULL,
    ADD COLUMN approval_content_level2 VARCHAR(500) NULL;
