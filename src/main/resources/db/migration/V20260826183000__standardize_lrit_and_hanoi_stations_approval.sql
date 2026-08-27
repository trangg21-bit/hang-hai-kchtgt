-- V20260826183000: Standardize LRIT and Haiphong/Hanoi Coastal Stations for 2-Level Approval & Seed Samples

-- 1. Ensure columns on coastal_station_lrit
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS terminal_id VARCHAR(255);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS reporting_interval INTEGER;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_height DOUBLE PRECISION;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS power_output DOUBLE PRECISION;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS antenna_type VARCHAR(255);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS data_format VARCHAR(255);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS communication_channel VARCHAR(255);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS description VARCHAR(2000);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS province_id INT;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS operating_org_id UUID;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS condition_status SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS imo_number VARCHAR(100);
ALTER TABLE public.coastal_station_lrit ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000);

-- Sync unit_id to org_unit_id if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_lrit' AND column_name = 'unit_id') THEN
        UPDATE public.coastal_station_lrit SET org_unit_id = unit_id WHERE org_unit_id IS NULL AND unit_id IS NOT NULL;
        UPDATE public.coastal_station_lrit SET unit_id = org_unit_id WHERE unit_id IS NULL AND org_unit_id IS NOT NULL;
    END IF;
END $$;

-- 2. Ensure columns on coastal_station_haiphong
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS location_address VARCHAR(1000);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS port_name VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS ward VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS operational_license VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS inspector_phone VARCHAR(50);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS last_inspection_date DATE;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS next_inspection_date DATE;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS coverage_area VARCHAR(1000);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS communication_frequency VARCHAR(255);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS description VARCHAR(2000);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS province_id INT;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS operating_org_id UUID;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS condition_status SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS approver_level1 UUID;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS approved_date_level1 TIMESTAMP;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS approver_level2 UUID;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS approved_date_level2 TIMESTAMP;
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS services_provided VARCHAR(1000);
ALTER TABLE public.coastal_station_haiphong ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(1000);




-- Sync unit_id to org_unit_id if needed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'coastal_station_haiphong' AND column_name = 'unit_id') THEN
        UPDATE public.coastal_station_haiphong SET org_unit_id = unit_id WHERE org_unit_id IS NULL AND unit_id IS NOT NULL;
        UPDATE public.coastal_station_haiphong SET unit_id = org_unit_id WHERE unit_id IS NULL AND org_unit_id IS NOT NULL;
    END IF;
END $$;


-- 3. Seed 6 diverse LRIT Station sample records
DO $$
DECLARE
    v_admin_id UUID;
    v_approver1_id UUID;
    v_approver2_id UUID;
    v_org_hp UUID;
    v_org_dn UUID;
    v_org_hcm UUID;
    v_org_hn UUID;
BEGIN
    SELECT id INTO v_admin_id FROM users WHERE username = 'admin' LIMIT 1;
    IF v_admin_id IS NULL THEN SELECT id INTO v_admin_id FROM users LIMIT 1; END IF;
    IF v_admin_id IS NULL THEN v_admin_id := gen_random_uuid(); END IF;

    SELECT id INTO v_approver1_id FROM users WHERE username = 'approver1_ais' OR username = 'cv_leader' LIMIT 1;
    IF v_approver1_id IS NULL THEN v_approver1_id := v_admin_id; END IF;

    SELECT id INTO v_approver2_id FROM users WHERE username = 'approver2_ais' OR username = 'tc_leader' OR username = 'admin' LIMIT 1;
    IF v_approver2_id IS NULL THEN v_approver2_id := v_admin_id; END IF;

    SELECT id INTO v_org_hp FROM org_units WHERE name ILIKE '%Hải Phòng%' LIMIT 1;
    IF v_org_hp IS NULL THEN SELECT id INTO v_org_hp FROM org_units LIMIT 1; END IF;
    IF v_org_hp IS NULL THEN v_org_hp := gen_random_uuid(); END IF;

    SELECT id INTO v_org_dn FROM org_units WHERE name ILIKE '%Đà Nẵng%' LIMIT 1;
    IF v_org_dn IS NULL THEN v_org_dn := v_org_hp; END IF;

    SELECT id INTO v_org_hcm FROM org_units WHERE name ILIKE '%Hồ Chí Minh%' LIMIT 1;
    IF v_org_hcm IS NULL THEN v_org_hcm := v_org_hp; END IF;

    SELECT id INTO v_org_hn FROM org_units WHERE name ILIKE '%Hà Nội%' OR name ILIKE '%Cục%' LIMIT 1;
    IF v_org_hn IS NULL THEN v_org_hn := v_org_hp; END IF;


    -- LRIT-0001: Đã duyệt (APPROVED = 5) - Hải Phòng
    IF NOT EXISTS (SELECT 1 FROM coastal_station_lrit WHERE code = 'LRIT-0001') THEN
        INSERT INTO coastal_station_lrit (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            terminal_id, imo_number, reporting_interval, antenna_height, power_output,
            antenna_type, data_format, communication_channel, coverage_area,
            services_provided, description,
            approver_level1, approved_date_level1, approver_level2, approved_date_level2,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'LRIT-0001', 'Đài thông tin LRIT Trung tâm Hải Phòng',
            v_org_hp, v_org_hp, v_org_hp, 31,
            'Số 4 Hoàng Diệu, Phường Minh Khai, Quận Hồng Bàng, TP. Hải Phòng',
            1, 5,
            'TERM-LRIT-HP-01', 'IMO-9876543', 15, 45.0, 50.0,
            'Omnidirectional VHF/Satellite', 'LRIT Protocol v2.0 / NMEA', 'Inmarsat-C / Iridium', 'Toàn bộ vùng biển Vịnh Bắc Bộ và Bắc Biển Đông',
            'LRIT, INMARSAT, DSC, MSI NAVTEX', 'Đài thu nhận và xử lý dữ liệu nhận dạng tầm xa tàu biển khu vực phía Bắc',
            v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '90 days', v_approver2_id, CURRENT_TIMESTAMP - INTERVAL '85 days',
            CURRENT_TIMESTAMP - INTERVAL '100 days', CURRENT_TIMESTAMP - INTERVAL '2 days', v_admin_id, v_admin_id
        );
    END IF;

    -- LRIT-0002: Chờ Cục duyệt (APPROVED_LEVEL1 = 3) - TP.HCM
    IF NOT EXISTS (SELECT 1 FROM coastal_station_lrit WHERE code = 'LRIT-0002') THEN
        INSERT INTO coastal_station_lrit (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            terminal_id, imo_number, reporting_interval, antenna_height, power_output,
            antenna_type, data_format, communication_channel, coverage_area,
            services_provided, description,
            approver_level1, approved_date_level1,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'LRIT-0002', 'Đài thông tin LRIT TP. Hồ Chí Minh',
            v_org_hcm, v_org_hcm, v_org_hcm, 79,
            'Số 1A Trương Đình Hợi, Phường 18, Quận 4, TP. Hồ Chí Minh',
            1, 3,
            'TERM-LRIT-HCM-01', 'IMO-9876544', 15, 38.0, 50.0,
            'Directional Satellite Antenna', 'LRIT Protocol v2.0', 'Inmarsat-C', 'Vùng biển Đông Nam Bộ và Tây Nam Bộ',
            'LRIT, DSC, Kết nối TT hàng hải', 'Cảng vụ TP.HCM đã thẩm tra và phê duyệt Vòng 1, chờ Cục Hàng hải duyệt Vòng 2',
            v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '10 days',
            CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '1 days', v_admin_id, v_admin_id
        );
    END IF;

    -- LRIT-0003: Chờ Cảng vụ duyệt (PENDING_APPROVAL = 2) - Đà Nẵng
    IF NOT EXISTS (SELECT 1 FROM coastal_station_lrit WHERE code = 'LRIT-0003') THEN
        INSERT INTO coastal_station_lrit (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            terminal_id, imo_number, reporting_interval, antenna_height, power_output,
            antenna_type, data_format, communication_channel, coverage_area,
            services_provided, description,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'LRIT-0003', 'Đài thông tin LRIT Sơn Trà - Đà Nẵng',
            v_org_dn, v_org_dn, v_org_dn, 48,
            'Bán đảo Sơn Trà, TP. Đà Nẵng',
            1, 2,
            'TERM-LRIT-DN-01', 'IMO-9876545', 30, 52.0, 60.0,
            'High-Gain Satellite Yagi', 'LRIT Protocol / XML', 'Iridium Next / Inmarsat', 'Vùng biển Miền Trung và Quần đảo Hoàng Sa',
            'LRIT, COSPAS-SARSAT, MSI RTP', 'Chuyên viên đã gửi hồ sơ trình phê duyệt Vòng 1',
            CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP, v_admin_id, v_admin_id
        );
    END IF;

    -- LRIT-0004: Lưu tạm (DRAFT = 0)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_lrit WHERE code = 'LRIT-0004') THEN
        INSERT INTO coastal_station_lrit (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            terminal_id, imo_number, reporting_interval, antenna_height, power_output,
            antenna_type, data_format, communication_channel, coverage_area,
            services_provided, description,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'LRIT-0004', 'Đài thông tin LRIT Trạm vệ tinh Cát Hải',
            v_org_hp, v_org_hp, v_org_hp, 31,
            'Thị trấn Cát Bà, Huyện Cát Hải, TP. Hải Phòng',
            1, 0,
            'TERM-LRIT-HP-02', 'IMO-9876546', 15, 30.0, 45.0,
            'Omnidirectional', 'LRIT Protocol', 'Inmarsat', 'Luồng Lạch Huyện và vùng phụ cận',
            'LRIT', 'Hồ sơ lưu tạm đang hoàn thiện thông số kiểm định',
            CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP, v_admin_id, v_admin_id
        );
    END IF;

    -- LRIT-0005: Từ chối (REJECTED_LEVEL1 = 8)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_lrit WHERE code = 'LRIT-0005') THEN
        INSERT INTO coastal_station_lrit (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            terminal_id, imo_number, reporting_interval, antenna_height, power_output,
            antenna_type, data_format, communication_channel, coverage_area,
            services_provided, description, rejection_reason,
            approver_level1,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'LRIT-0005', 'Đài thông tin LRIT Vũng Tàu',
            v_org_hcm, v_org_hcm, v_org_hcm, 77,
            'Phường Thắng Nhì, TP. Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu',
            0, 8,
            'TERM-LRIT-VT-01', 'IMO-9876547', 15, 25.0, 40.0,
            'Omnidirectional', 'LRIT Protocol', 'Inmarsat', 'Vùng biển Vũng Tàu',
            'LRIT', 'Cảng vụ từ chối do chưa cập nhật giấy phép tần số vệ tinh mới.',
            'Chưa cập nhật giấy phép sử dụng tần số vô tuyến điện vệ tinh năm 2026.',
            v_approver1_id,
            CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '3 days', v_admin_id, v_admin_id
        );
    END IF;

    -- 4. Seed 6 diverse Haiphong/Hanoi Station sample records (Đài TTXLTT Hà Nội)
    -- TTXLTT-0001: Đã duyệt (APPROVED = 5) - Trung tâm Hà Nội
    IF NOT EXISTS (SELECT 1 FROM coastal_station_haiphong WHERE code = 'TTXLTT-0001') THEN
        INSERT INTO coastal_station_haiphong (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            port_name, district, ward, operational_license, license_expiry,
            inspector_name, inspector_phone, last_inspection_date, next_inspection_date,
            coverage_area, equipment_type, communication_frequency, services_provided, description,
            approver_level1, approved_date_level1, approver_level2, approved_date_level2,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'TTXLTT-0001', 'Trung tâm Xử lý Thông tin Hàng hải Hà Nội',
            v_org_hn, v_org_hn, v_org_hn, 1,
            'Số 8 Phạm Hùng, Phường Mai Dịch, Quận Cầu Giấy, TP. Hà Nội',
            1, 5,
            'Toàn quốc', 'Cầu Giấy', 'Mai Dịch', 'GP-TTXLTT-HN-2024/01', '2029-12-31',
            'Nguyễn Văn An', '0912345678', '2025-06-15', '2026-06-15',
            'Toàn bộ vùng nước cảng biển và vùng biển Việt Nam',
            'Hệ thống máy chủ xử lý dữ liệu viễn thông hàng hải tập trung', 'VHF CH16, 70 DSC, Inmarsat, Cospas',
            'INMARSAT, COSPAS-SARSAT, DSC, RTP, MSI RTP, MSI NAVTEX, MSI EGC, LRIT, Kết nối TT hàng hải',
            'Trung tâm tiếp nhận, xử lý và phân phối thông tin an toàn hàng hải cấp quốc gia',
            v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '150 days', v_approver2_id, CURRENT_TIMESTAMP - INTERVAL '145 days',
            CURRENT_TIMESTAMP - INTERVAL '160 days', CURRENT_TIMESTAMP - INTERVAL '2 days', v_admin_id, v_admin_id
        );
    END IF;

    -- TTXLTT-0002: Chờ Cục duyệt (APPROVED_LEVEL1 = 3)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_haiphong WHERE code = 'TTXLTT-0002') THEN
        INSERT INTO coastal_station_haiphong (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            port_name, district, ward, operational_license, license_expiry,
            inspector_name, inspector_phone, last_inspection_date, next_inspection_date,
            coverage_area, equipment_type, communication_frequency, services_provided, description,
            approver_level1, approved_date_level1,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'TTXLTT-0002', 'Đài TTXLTT Hàng hải Hải Phòng',
            v_org_hp, v_org_hp, v_org_hp, 31,
            'Số 4 Hoàng Diệu, Quận Hồng Bàng, TP. Hải Phòng',
            1, 3,
            'Khu vực Cảng Hải Phòng', 'Hồng Bàng', 'Minh Khai', 'GP-TTXLTT-HP-2025/02', '2030-01-01',
            'Trần Đình Trọng', '0987654321', '2025-11-20', '2026-11-20',
            'Vùng biển Hải Phòng, Quảng Ninh và Vịnh Bắc Bộ',
            'Hệ thống thu phát thông tin duyên hải và chuyển tiếp dữ liệu VTS', 'VHF CH16, CH70, MF/HF',
            'DSC, RTP, MSI NAVTEX, Kết nối TT hàng hải',
            'Cảng vụ Hải Phòng đã phê duyệt Vòng 1, đang chờ Cục phê duyệt Vòng 2',
            v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '8 days',
            CURRENT_TIMESTAMP - INTERVAL '12 days', CURRENT_TIMESTAMP - INTERVAL '1 days', v_admin_id, v_admin_id
        );
    END IF;

    -- TTXLTT-0003: Chờ Cảng vụ duyệt (PENDING_APPROVAL = 2)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_haiphong WHERE code = 'TTXLTT-0003') THEN
        INSERT INTO coastal_station_haiphong (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            port_name, district, ward, operational_license, license_expiry,
            inspector_name, inspector_phone, last_inspection_date, next_inspection_date,
            coverage_area, equipment_type, communication_frequency, services_provided, description,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'TTXLTT-0003', 'Đài TTXLTT Hàng hải Đà Nẵng',
            v_org_dn, v_org_dn, v_org_dn, 48,
            'Đường Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
            1, 2,
            'Khu vực Cảng Đà Nẵng', 'Hải Châu', 'Thạch Thang', 'GP-TTXLTT-DN-2025/03', '2030-05-01',
            'Lê Văn Hùng', '0905123456', '2025-08-10', '2026-08-10',
            'Vùng biển Trung Trung Bộ',
            'Trạm thu phát thông tin hàng hải duyên hải Đà Nẵng', 'VHF CH16, MF/HF',
            'DSC, MSI RTP, LRIT',
            'Hồ sơ đã nộp, đang chờ Lãnh đạo Cảng vụ phê duyệt Vòng 1',
            CURRENT_TIMESTAMP - INTERVAL '4 days', CURRENT_TIMESTAMP, v_admin_id, v_admin_id
        );
    END IF;

    -- TTXLTT-0004: Lưu tạm (DRAFT = 0)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_haiphong WHERE code = 'TTXLTT-0004') THEN
        INSERT INTO coastal_station_haiphong (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            port_name, district, ward, operational_license, license_expiry,
            inspector_name, inspector_phone, last_inspection_date, next_inspection_date,
            coverage_area, equipment_type, communication_frequency, services_provided, description,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'TTXLTT-0004', 'Đài TTXLTT Hàng hải Quy Nhơn',
            v_org_dn, v_org_dn, v_org_dn, 52,
            'Số 2 Phan Chu Trinh, TP. Quy Nhơn, Tỉnh Bình Định',
            1, 0,
            'Khu vực Cảng Quy Nhơn', 'TP Quy Nhơn', 'Hải Cảng', 'GP-TTXLTT-QN-2025/04', '2030-08-01',
            'Phạm Thanh Tùng', '0935123789', '2025-09-05', '2026-09-05',
            'Vùng biển Nam Trung Bộ',
            'Trạm thu thập dữ liệu thông tin phụ trợ', 'VHF CH16',
            'DSC, RTP',
            'Hồ sơ lưu tạm đang rà soát tọa độ GIS',
            CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP, v_admin_id, v_admin_id
        );
    END IF;

    -- TTXLTT-0005: Từ chối (REJECTED_LEVEL2 = 9)
    IF NOT EXISTS (SELECT 1 FROM coastal_station_haiphong WHERE code = 'TTXLTT-0005') THEN
        INSERT INTO coastal_station_haiphong (
            id, code, name, unit_id, org_unit_id, operating_org_id, province_id,
            location_address, condition_status, approval_status,
            port_name, district, ward, operational_license, license_expiry,
            inspector_name, inspector_phone, last_inspection_date, next_inspection_date,
            coverage_area, equipment_type, communication_frequency, services_provided, description,
            rejection_reason, approver_level1, approved_date_level1,
            created_at, updated_at, created_by, updated_by
        ) VALUES (
            gen_random_uuid(), 'TTXLTT-0005', 'Đài TTXLTT Hàng hải Cần Thơ',
            v_org_hcm, v_org_hcm, v_org_hcm, 92,
            'Đường Nam Sông Hậu, Quận Cái Răng, TP. Cần Thơ',
            1, 9,
            'Khu vực Cảng Cần Thơ', 'Cái Răng', 'Phú Thứ', 'GP-TTXLTT-CT-2025/05', '2030-10-01',
            'Đỗ Hoàng Nam', '0945678901', '2025-10-12', '2026-10-12',
            'Khu vực luồng Định An và sông Hậu',
            'Hệ thống trạm thu phát thông tin sông biển', 'VHF CH16',
            'RTP, MSI NAVTEX',
            'Cục Hàng hải trả về yêu cầu bổ sung cấu hình kết nối cáp quang dự phòng về TTXLTT Hà Nội.',
            'Yêu cầu bổ sung phương án đường truyền cáp quang dự phòng kết nối trung tâm Hà Nội.',
            v_approver1_id, CURRENT_TIMESTAMP - INTERVAL '20 days',
            CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '5 days', v_admin_id, v_admin_id
        );
    END IF;

END $$;
