-- V20260826180900: Seed sample AIS System records covering all lifecycle and approval statuses

DO $$
DECLARE
    v_admin_id UUID;
    v_approver1_id UUID;
    v_approver2_id UUID;
    v_org_hp UUID;
    v_org_dn UUID;
    v_org_hcm UUID;
    v_org_qn UUID;
    v_org_na UUID;
    v_vts_sys_id UUID;
    v_op_center_hp UUID;
    v_op_center_hcm UUID;
    v_op_center_dn UUID;
BEGIN
    -- 1. Resolve Users
    SELECT id INTO v_admin_id FROM users WHERE username = 'admin' LIMIT 1;
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM users LIMIT 1;
    END IF;
    IF v_admin_id IS NULL THEN
        v_admin_id := gen_random_uuid();
    END IF;

    SELECT id INTO v_approver1_id FROM users WHERE username = 'approver1_ais' LIMIT 1;
    IF v_approver1_id IS NULL THEN
        v_approver1_id := v_admin_id;
    END IF;

    SELECT id INTO v_approver2_id FROM users WHERE username = 'approver2_ais' LIMIT 1;
    IF v_approver2_id IS NULL THEN
        v_approver2_id := v_admin_id;
    END IF;

    -- 2. Resolve OrgUnits
    SELECT id INTO v_org_hp FROM org_units WHERE name ILIKE '%Hải Phòng%' LIMIT 1;
    IF v_org_hp IS NULL THEN
        SELECT id INTO v_org_hp FROM org_units LIMIT 1;
    END IF;
    IF v_org_hp IS NULL THEN
        v_org_hp := gen_random_uuid();
    END IF;

    SELECT id INTO v_org_dn FROM org_units WHERE name ILIKE '%Đà Nẵng%' LIMIT 1;
    IF v_org_dn IS NULL THEN
        v_org_dn := v_org_hp;
    END IF;

    SELECT id INTO v_org_hcm FROM org_units WHERE name ILIKE '%Hồ Chí Minh%' LIMIT 1;
    IF v_org_hcm IS NULL THEN
        v_org_hcm := v_org_hp;
    END IF;

    SELECT id INTO v_org_qn FROM org_units WHERE name ILIKE '%Quy Nhơn%' LIMIT 1;
    IF v_org_qn IS NULL THEN
        v_org_qn := v_org_dn;
    END IF;

    SELECT id INTO v_org_na FROM org_units WHERE name ILIKE '%Nghệ An%' LIMIT 1;
    IF v_org_na IS NULL THEN
        v_org_na := v_org_hp;
    END IF;


    -- 3. Resolve or insert VTS System
    SELECT id INTO v_vts_sys_id FROM vts_system WHERE deleted_at IS NULL LIMIT 1;
    IF v_vts_sys_id IS NULL THEN
        v_vts_sys_id := gen_random_uuid();
        INSERT INTO vts_system (id, code, system_name, org_unit_id, approval_status, condition_status, created_at, updated_at, created_by, updated_by)
        VALUES (v_vts_sys_id, 'VTS-SYS-01', 'Hệ thống VTS Quốc gia', v_org_hp, 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, v_admin_id, v_admin_id);
    END IF;

    -- 4. Resolve or insert VTS Operation Centers
    SELECT id INTO v_op_center_hp FROM vts_operation_center WHERE org_unit_id = v_org_hp AND deleted_at IS NULL LIMIT 1;
    IF v_op_center_hp IS NULL THEN
        v_op_center_hp := gen_random_uuid();
        INSERT INTO vts_operation_center (id, code, name, vts_system_id, org_unit_id, province_id, approval_status, condition_status, created_at, updated_at, created_by, updated_by)
        VALUES (v_op_center_hp, 'VTS-OP-HP-01', 'Trung tâm VTS Luồng Hải Phòng', v_vts_sys_id, v_org_hp, 31, 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, v_admin_id, v_admin_id);
    END IF;

    SELECT id INTO v_op_center_hcm FROM vts_operation_center WHERE (name ILIKE '%Hồ Chí Minh%' OR name ILIKE '%Sài Gòn%') AND deleted_at IS NULL LIMIT 1;
    IF v_op_center_hcm IS NULL THEN
        v_op_center_hcm := gen_random_uuid();
        INSERT INTO vts_operation_center (id, code, name, vts_system_id, org_unit_id, province_id, approval_status, condition_status, created_at, updated_at, created_by, updated_by)
        VALUES (v_op_center_hcm, 'VTS-OP-HCM-01', 'Trung tâm VTS Luồng Sài Gòn - Vũng Tàu', v_vts_sys_id, v_org_hcm, 79, 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, v_admin_id, v_admin_id);
    END IF;

    SELECT id INTO v_op_center_dn FROM vts_operation_center WHERE name ILIKE '%Đà Nẵng%' AND deleted_at IS NULL LIMIT 1;
    IF v_op_center_dn IS NULL THEN
        v_op_center_dn := gen_random_uuid();
        INSERT INTO vts_operation_center (id, code, name, vts_system_id, org_unit_id, province_id, approval_status, condition_status, created_at, updated_at, created_by, updated_by)
        VALUES (v_op_center_dn, 'VTS-OP-DN-01', 'Trung tâm VTS Luồng Đà Nẵng', v_vts_sys_id, v_org_dn, 48, 5, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, v_admin_id, v_admin_id);
    END IF;

    -- 5. Seed 7 diverse AIS Systems
    -- Record 1: Đã duyệt chính thức (APPROVED = 5) - Hải Phòng
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000001' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            approver_level1, approved_date_level1, approver_level2, approved_date_level2,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000001', 'Trạm phát AIS Luồng Lạch Huyện - Trạm số 1',
            v_op_center_hp, v_org_hp, v_org_hp, 31,
            'Đảo Cát Hải, Huyện Cát Hải, TP. Hải Phòng', 0, 1, 'AIS-AALA-T300',
            'Công suất phát 12.5W, dải tần VHF 161.975 - 162.025 MHz, nguồn dự phòng 24VDC 200Ah',
            'Saab TransponderTech AB (Thụy Điển)', 2023, 1,
            'Bảo dưỡng định kỳ 6 tháng/lần bởi TCT Bảo đảm ATHH Miền Bắc',
            'Phục vụ điều tiết luồng hàng hải Lạch Huyện và đón tàu container trọng tải lớn',
            5, v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '120 days', v_approver2_id, CURRENT_TIMESTAMP - INTERVAL '115 days',
            CURRENT_TIMESTAMP - INTERVAL '130 days', CURRENT_TIMESTAMP - INTERVAL '2 days', v_admin_id, v_admin_id
        );
    END IF;

    -- Record 2: Chờ Cục duyệt (APPROVED_LEVEL1 = 3) - Hòn Dáu
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000002' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            approver_level1, approved_date_level1,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000002', 'Hệ thống AIS Trạm Radar Hòn Dáu',
            v_op_center_hp, v_org_hp, v_org_hp, 31,
            'Bán đảo Đồ Sơn, TP. Hải Phòng', 0, 1, 'Kongsberg AIS Base Station',
            'Bộ thu phát AIS bờ chuẩn IALA, tầm phủ 35 hải lý, hỗ trợ tin nhắn an toàn hàng hải',
            'Kongsberg Seatex AS (Na Uy)', 2024, 1,
            'Kiểm tra định kỳ quý 1/2026',
            'Đã được Cảng vụ Hải Phòng phê duyệt Vòng 1, đang chờ Cục Hàng hải duyệt Vòng 2',
            3, v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '15 days',
            CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '1 days', v_admin_id, v_admin_id
        );
    END IF;

    -- Record 3: Lưu tạm (DRAFT = 0) - Chùa Vẽ
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000003' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000003', 'Trạm AIS Cảng Chùa Vẽ - Hải Phòng',
            v_op_center_hp, v_org_hp, v_org_hp, 31,
            'Cảng Chùa Vẽ, Quận Hải An, TP. Hải Phòng', 0, 1, 'Furuno FA-170 AIS',
            'Màn hình màu LCD 4.3 inch, tích hợp bộ thu phát GPS/VHF đạt chuẩn IMO',
            'Furuno Electric Co., Ltd. (Nhật Bản)', 2025, 1,
            'Lắp đặt mới tháng 01/2025',
            'Hồ sơ đang soạn thảo lưu tạm, chuẩn bị trình phê duyệt',
            0,
            CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP, v_admin_id, v_admin_id
        );
    END IF;

    -- Record 4: Chờ Cảng vụ duyệt (PENDING_APPROVAL = 2) - TP.HCM
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000004' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000004', 'Trạm phát AIS Luồng Hàng hải Sài Gòn - Vũng Tàu',
            v_op_center_hcm, v_org_hcm, v_org_hcm, 79,
            'Mũi Đèn Đỏ, Phường Phú Thuận, Quận 7, TP. Hồ Chí Minh', 0, 1, 'AIS Base Station Transceiver T300',
            'Bộ thu phát AIS công suất 12.5W, dải nhiệt độ -25°C đến +55°C',
            'Saab TransponderTech AB', 2024, 1,
            'Bảo dưỡng quý 4/2025',
            'Chuyên viên đã nộp hồ sơ, đang chờ Lãnh đạo Cảng vụ phê duyệt Vòng 1',
            2,
            CURRENT_TIMESTAMP - INTERVAL '8 days', CURRENT_TIMESTAMP - INTERVAL '2 days', v_admin_id, v_admin_id
        );
    END IF;

    -- Record 5: Đã duyệt (APPROVED = 5), Đang bảo trì (MAINTENANCE = 2) - Đà Nẵng
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000005' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            approver_level1, approved_date_level1, approver_level2, approved_date_level2,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000005', 'Trạm AIS Cảng Tiên Sa - Đà Nẵng',
            v_op_center_dn, v_org_dn, v_org_dn, 48,
            'Bán đảo Sơn Trà, TP. Đà Nẵng', 0, 1, 'Weatherdock easyAIS Base Station',
            'Hỗ trợ kênh AIS1, AIS2 và DSC channel 70, cổng kết nối Ethernet IP67',
            'Weatherdock AG (CHLB Đức)', 2022, 2,
            'Đang bảo trì thay thế modul khuếch đại công suất và cáp suy hao thấp',
            'Thiết bị đang trong giai đoạn bảo dưỡng định kỳ năm 2026',
            5, v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '200 days', v_approver2_id, CURRENT_TIMESTAMP - INTERVAL '195 days',
            CURRENT_TIMESTAMP - INTERVAL '210 days', CURRENT_TIMESTAMP - INTERVAL '3 days', v_admin_id, v_admin_id
        );
    END IF;

    -- Record 6: Bị Cảng vụ trả về (REJECTED_LEVEL1 = 8) - Nghệ An
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000006' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            approver_level1, rejection_reason,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000006', 'Trạm AIS Luồng Cửa Lò - Nghệ An',
            v_op_center_hp, v_org_na, v_org_na, 37,
            'Thị xã Cửa Lò, Tỉnh Nghệ An', 0, 1, 'Standard Horizon GX2400 AIS',
            'Tích hợp GPS 66 kênh, bộ giải mã NMEA 2000 và NMEA 0183',
            'Yaesu Musen Co., Ltd.', 2021, 0,
            'Chờ thay mới thiết bị nguồn',
            'Cảng vụ trả về yêu cầu bổ sung phiếu kiểm định thông số kỹ thuật',
            8, v_approver1_id, 'Thiếu phiếu kiểm định thông số kỹ thuật công suất phát và anten dự phòng.',
            CURRENT_TIMESTAMP - INTERVAL '14 days', CURRENT_TIMESTAMP - INTERVAL '4 days', v_admin_id, v_admin_id
        );
    END IF;

    -- Record 7: Bị Cục trả về (REJECTED_LEVEL2 = 9) - Quy Nhơn
    IF NOT EXISTS (SELECT 1 FROM ais_system WHERE code = 'AIS-000007' AND deleted_at IS NULL) THEN
        INSERT INTO ais_system (
            id, code, name, vts_operation_center_id, operating_org_id, org_unit_id, province_id,
            detailed_location, unit_of_measure, quantity, model, specifications, manufacturer,
            commissioning_year, condition_status, maintenance_info, note, approval_status,
            approver_level1, approved_date_level1, rejection_reason,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'AIS-000007', 'Trạm AIS Cảng Quy Nhơn - Bình Định',
            v_op_center_dn, v_org_qn, v_org_qn, 52,
            'Bến Cảng Quy Nhơn, TP. Quy Nhơn, Tỉnh Bình Định', 0, 1, 'Icom MA-510TR Class B AIS',
            'Bộ phát đáp AIS chuẩn Class B, màn hình màu ma trận điểm',
            'Icom Inc. (Nhật Bản)', 2023, 1,
            'Kiểm tra kỹ thuật định kỳ',
            'Cục Hàng hải trả về yêu cầu điều chỉnh tần số phát theo quy hoạch',
            9, v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '45 days',
            'Tọa độ trạm chưa đồng bộ với quy hoạch dải tần số vô tuyến điện khu vực Nam Trung Bộ.',
            CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '5 days', v_admin_id, v_admin_id
        );
    END IF;

END $$;
