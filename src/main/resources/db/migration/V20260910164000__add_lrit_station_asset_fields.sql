-- ====================================================================================
-- Migration: V20260910164000__add_lrit_station_asset_fields.sql
-- Mô tả: Bổ sung và đồng bộ toàn diện các trường dữ liệu Tài sản đài LRIT (InfraAsset LRIT_STATION)
-- Theo đúng ma trận trường dữ liệu chi tiết từ Excel (TAB 1 -> TAB 6, STT 1 -> 94)
-- ====================================================================================

-- ------------------------------------------------------------------------------------
-- TAB 1: Thông tin chung & Chỉ số tổng hợp (STT 1 -> 25)
-- ------------------------------------------------------------------------------------
-- 1. Cơ quan quản lý cấp trên: parent_org_unit_id
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS parent_org_unit_id UUID;

-- 2. Đơn vị quản lý: org_unit_id
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS org_unit_id UUID;

-- 3. Đơn vị sử dụng: using_org_unit_id
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS using_org_unit_id UUID;

-- 4. Mã đài (Đài LRIT): lrit_station_id
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS lrit_station_id UUID;

-- 5. Loại tài sản: asset_type (0=BUOY, 1=RADAR_STATION, 2=LIGHTHOUSE, 3=AUXILIARY, 4=PORT_TERMINAL, 5=LRIT_STATION)
-- 6. Mã tài sản: asset_code (VARCHAR(50), UNIQUE)
-- 7. Tên tài sản: asset_name (VARCHAR(2000))
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS asset_name VARCHAR(2000);
ALTER TABLE infra_assets ALTER COLUMN asset_name TYPE VARCHAR(2000);

-- 8. Barcode: barcode
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);

-- 9. Tình trạng tài sản: asset_condition
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS asset_condition VARCHAR(100);

-- 10. Hiện trạng sử dụng: usage_status
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS usage_status VARCHAR(100);

-- 11. Nhóm tài sản: asset_group
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS asset_group VARCHAR(200);

-- 12. Phân nhóm tài sản: asset_subgroup
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS asset_subgroup VARCHAR(200);

-- 13. Địa chỉ: address
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS address VARCHAR(2000);
ALTER TABLE infra_assets ALTER COLUMN address TYPE VARCHAR(2000);

-- 14. Nguồn gốc: origin
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS origin VARCHAR(200);

-- Chỉ số tổng hợp:
-- 15. Số lượng: quantity
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,3);

-- 16. Đơn vị tính: quantity_unit
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS quantity_unit VARCHAR(50);

-- 17. Model: model
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS model VARCHAR(100);

-- 18. Serial: serial_number
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);

-- 19. Xuất xứ: country_of_origin
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS country_of_origin VARCHAR(100);

-- 20. Hãng sản xuất: manufacturer
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(200);

-- 21. Năm xây dựng: construction_year
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS construction_year INTEGER;

-- 22. Ngày sử dụng tài sản: use_date
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS use_date DATE;

-- 23. Diện tích (đất, sàn sử dụng: m2): land_area
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS land_area NUMERIC(15,3);

-- 24. Diện tích (sàn sử dụng: m2): floor_area
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS floor_area NUMERIC(15,3);

-- 25. Vị trí tài sản: asset_location
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS asset_location VARCHAR(2000);
ALTER TABLE infra_assets ALTER COLUMN asset_location TYPE VARCHAR(2000);

-- ------------------------------------------------------------------------------------
-- TAB 2: Hồ sơ tài sản (STT 26)
-- ------------------------------------------------------------------------------------
-- 26. Tên file: attachment_name
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(500);

-- ------------------------------------------------------------------------------------
-- TAB 3: Thông tin chi tiết & Khấu hao (STT 27 -> 38)
-- ------------------------------------------------------------------------------------
-- 27. Ngày kê khai tài sản: declaration_date
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS declaration_date DATE;

-- 28. Nguyên giá: original_value
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS original_value NUMERIC(15,2);

-- 29. Tỷ lệ hao mòn/Khấu hao (%): depreciation_rate
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(7,4);

-- 30. Giá trị còn lại: remaining_value
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS remaining_value NUMERIC(15,2);

-- 31. Đơn vị tính giá trị: value_unit
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS value_unit VARCHAR(20);

-- 32. Số quyết định giao: assignment_decision_number
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS assignment_decision_number VARCHAR(200);

-- 33. Ngày tính khấu hao: depreciation_start_date
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS depreciation_start_date DATE;

-- 34. Số tháng tính khấu hao: depreciation_months
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS depreciation_months INTEGER;

-- 35. Ngày hết khấu hao: depreciation_end_date
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS depreciation_end_date DATE;

-- 36. Khấu hao lũy kế: accumulated_depreciation
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(15,2);

-- 37. Khấu hao tháng: monthly_depreciation
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS monthly_depreciation NUMERIC(15,2);

-- 38. Hình thức xử lý tài sản: disposal_method
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS disposal_method VARCHAR(200);

-- ------------------------------------------------------------------------------------
-- TAB 4: Khai thác tài sản (STT 39 -> 48 - Bảng asset_exploitations)
-- ------------------------------------------------------------------------------------
-- 39. Đơn vị khai thác: operator_org_unit_id
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS operator_org_unit_id UUID;

-- 40. Danh mục tài sản: asset_category
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS asset_category VARCHAR(200);

-- 41. Đơn vị tính: unit_of_measure
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(50);

-- 42. Số lượng: quantity
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,3);

-- 43. Thời hạn khai thác: exploitation_deadline
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS exploitation_deadline DATE;

-- 44. Tổng số tiền thu được (VNĐ): total_revenue
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(15,2);

-- 45. Chi phí có liên quan: related_costs
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS related_costs NUMERIC(15,2);

-- 46. Nộp NSNN: state_budget_payment
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS state_budget_payment NUMERIC(15,2);

-- 47. Số tiền được thực hiện dự án: project_amount
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS project_amount NUMERIC(15,2);

-- 48. Ghi chú (khai thác): description
ALTER TABLE asset_exploitations ADD COLUMN IF NOT EXISTS description VARCHAR(2000);

-- ------------------------------------------------------------------------------------
-- TAB 5: Lịch sử thay đổi nguyên giá (STT 49 -> 83)
-- (Bảng asset_increase_requests & asset_decrease_requests)
-- ------------------------------------------------------------------------------------
-- Tăng nguyên giá (STT 49 -> 66)
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS decision_number VARCHAR(200);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS decision_date DATE;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS adjustment_date DATE;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS adjustment_reason VARCHAR(200);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS adjustment_notes VARCHAR(2000);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS original_value_before NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS original_value_after NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS remaining_value_before NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS remaining_value_after NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS declaration_date DATE;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(7,4);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS value_unit VARCHAR(20);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS assignment_decision_number VARCHAR(200);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS depreciation_start_date DATE;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS depreciation_months INTEGER;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS depreciation_end_date DATE;
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS adjustment_accumulated_depreciation NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS monthly_depreciation NUMERIC(15,2);
ALTER TABLE asset_increase_requests ADD COLUMN IF NOT EXISTS disposal_method VARCHAR(200);

-- Giảm nguyên giá (STT 67 -> 83)
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS decision_number VARCHAR(200);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS decision_date DATE;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS adjustment_date DATE;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS adjustment_reason VARCHAR(200);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS adjustment_notes VARCHAR(2000);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS original_value_before NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS original_value_after NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS remaining_value_before NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS remaining_value_after NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS declaration_date DATE;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(7,4);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS value_unit VARCHAR(20);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS assignment_decision_number VARCHAR(200);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS depreciation_start_date DATE;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS depreciation_months INTEGER;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS depreciation_end_date DATE;
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS adjustment_accumulated_depreciation NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS monthly_depreciation NUMERIC(15,2);
ALTER TABLE asset_decrease_requests ADD COLUMN IF NOT EXISTS disposal_method VARCHAR(200);

-- ------------------------------------------------------------------------------------
-- TAB 6: Xử lý & theo dõi (STT 84 -> 94)
-- (Trạng thái phê duyệt & Cán bộ xét duyệt)
-- ------------------------------------------------------------------------------------
-- 84. Trạng thái phê duyệt: approval_status (0=DRAFT, 1=PENDING_APPROVAL, 2=APPROVED_LEVEL1, 3=APPROVED, 4=REJECTED_LEVEL1, 5=REJECTED)
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS approval_status INTEGER DEFAULT 0;

-- 85. Lý do từ chối: rejection_reason
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(2000);

-- 86. Ý kiến xử lý: processing_opinion
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS processing_opinion VARCHAR(2000);

-- 87-88. Cán bộ & Ngày gửi phê duyệt: submitted_by, submitted_at
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 89-91. Cán bộ, Ngày & Nội dung duyệt cấp Cảng vụ/Chi cục (Cấp 1)
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS port_authority_approved_by UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS port_authority_approved_at TIMESTAMPTZ;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS port_authority_approval_content VARCHAR(2000);
ALTER TABLE infra_assets ALTER COLUMN port_authority_approval_content TYPE VARCHAR(2000);

-- 92-94. Cán bộ, Ngày & Nội dung duyệt cấp Cục (Cấp 2)
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS department_approved_by UUID;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS department_approved_at TIMESTAMPTZ;
ALTER TABLE infra_assets ADD COLUMN IF NOT EXISTS department_approval_content VARCHAR(2000);
ALTER TABLE infra_assets ALTER COLUMN department_approval_content TYPE VARCHAR(2000);

-- ------------------------------------------------------------------------------------
-- Các chỉ mục (Indexes) phục vụ tìm kiếm và hiệu năng
-- ------------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_infra_assets_lrit_station_id ON infra_assets(lrit_station_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_org_unit_id ON infra_assets(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_using_org_unit_id ON infra_assets(using_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_parent_org_unit_id ON infra_assets(parent_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_infra_assets_type_status ON infra_assets(asset_type, approval_status);
CREATE INDEX IF NOT EXISTS idx_infra_assets_use_date ON infra_assets(use_date);
