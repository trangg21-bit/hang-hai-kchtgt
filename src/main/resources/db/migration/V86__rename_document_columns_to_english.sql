-- Rename columns from vanban module tables to English
DO $$ 
BEGIN
    -- 1. operation_details
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_details' AND column_name = 'ke_hoach_id') THEN
        ALTER TABLE public.operation_details RENAME COLUMN ke_hoach_id TO operation_plan_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_details' AND column_name = 'mo_ta') THEN
        ALTER TABLE public.operation_details RENAME COLUMN mo_ta TO description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_details' AND column_name = 'san_luong_du_kien') THEN
        ALTER TABLE public.operation_details RENAME COLUMN san_luong_du_kien TO estimated_volume;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_details' AND column_name = 'san_luong_thuc_te') THEN
        ALTER TABLE public.operation_details RENAME COLUMN san_luong_thuc_te TO actual_volume;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_details' AND column_name = 'ghi_chu') THEN
        ALTER TABLE public.operation_details RENAME COLUMN ghi_chu TO notes;
    END IF;

    -- 2. operation_plans
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'ngay_van_hanh') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN ngay_van_hanh TO operation_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'cau_cang') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN cau_cang TO pier;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'thiet_bi') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN thiet_bi TO equipment;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'thoi_gian_bat_dau') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN thoi_gian_bat_dau TO start_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'thoi_gian_ket_thuc') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN thoi_gian_ket_thuc TO end_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'tinh_trang') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN tinh_trang TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN ngay_tao TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_plans' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.operation_plans RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 3. operation_reports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'loai_bao_cao') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN loai_bao_cao TO report_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'ky_bat_dau') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN ky_bat_dau TO period_start;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'ky_ket_thuc') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN ky_ket_thuc TO period_end;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'tong_chi_phi') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN tong_chi_phi TO total_cost;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'duong_dan_file') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN duong_dan_file TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operation_reports' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.operation_reports RENAME COLUMN ngay_tao TO created_at;
    END IF;

    -- 4. maintenance_plans
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'thiet_bi') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN thiet_bi TO equipment;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'loai_bao_tri') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN loai_bao_tri TO maintenance_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'ngay_bat_dau_du_kien') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN ngay_bat_dau_du_kien TO estimated_start_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'ngay_ket_thuc_du_kien') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN ngay_ket_thuc_du_kien TO estimated_end_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'tinh_trang') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN tinh_trang TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'chi_phi_du_kien') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN chi_phi_du_kien TO estimated_cost;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN ngay_tao TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_plans' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.maintenance_plans RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 5. maintenance_results
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'ke_hoach_id') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN ke_hoach_id TO maintenance_plan_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'thoi_gian_bat_dau_thuc_te') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN thoi_gian_bat_dau_thuc_te TO actual_start_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'thoi_gian_ket_thuc_thuc_te') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN thoi_gian_ket_thuc_thuc_te TO actual_end_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'mo_ta_ket_qua') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN mo_ta_ket_qua TO result_description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'phu_ton_thay_the') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN phu_ton_thay_the TO replaced_parts;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'thoi_gian_ngung_hoat_dong') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN thoi_gian_ngung_hoat_dong TO downtime_duration;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'nguoi_ghi_nhan') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN nguoi_ghi_nhan TO recorder;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_results' AND column_name = 'ngay_ghi_nhan') THEN
        ALTER TABLE public.maintenance_results RENAME COLUMN ngay_ghi_nhan TO recorded_date;
    END IF;

    -- 6. maintenance_reports
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'loai_bao_cao') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN loai_bao_cao TO report_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'ky_bat_dau') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN ky_bat_dau TO period_start;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'ky_ket_thuc') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN ky_ket_thuc TO period_end;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'tong_chi_phi') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN tong_chi_phi TO total_cost;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'duong_dan_file') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN duong_dan_file TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_reports' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.maintenance_reports RENAME COLUMN ngay_tao TO created_at;
    END IF;

    -- 7. port_planning
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'ten_do_an') THEN
        ALTER TABLE public.port_planning RENAME COLUMN ten_do_an TO project_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'co_quan_phe_duyet') THEN
        ALTER TABLE public.port_planning RENAME COLUMN co_quan_phe_duyet TO approval_authority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'ngay_phe_duyet') THEN
        ALTER TABLE public.port_planning RENAME COLUMN ngay_phe_duyet TO approval_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'pham_vi_ap_dung') THEN
        ALTER TABLE public.port_planning RENAME COLUMN pham_vi_ap_dung TO application_scope;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'ti_le_ban_do') THEN
        ALTER TABLE public.port_planning RENAME COLUMN ti_le_ban_do TO map_scale;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'tinh_trang') THEN
        ALTER TABLE public.port_planning RENAME COLUMN tinh_trang TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'duong_dan_file') THEN
        ALTER TABLE public.port_planning RENAME COLUMN duong_dan_file TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.port_planning RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.port_planning RENAME COLUMN ngay_tao TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.port_planning RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'port_planning' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.port_planning RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 8. planning_categories
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'quy_hoach_id') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN quy_hoach_id TO port_planning_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'ten_ham_muc') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN ten_ham_muc TO category_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'don_vi_tinh') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN don_vi_tinh TO unit_of_measure;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'gia_tri_ke_hoach') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN gia_tri_ke_hoach TO planned_value;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'gia_tri_thuc_te') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN gia_tri_thuc_te TO actual_value;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_categories' AND column_name = 'trang_thai') THEN
        ALTER TABLE public.planning_categories RENAME COLUMN trang_thai TO status;
    END IF;

    -- 9. planning_files
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'quy_hoach_id') THEN
        ALTER TABLE public.planning_files RENAME COLUMN quy_hoach_id TO port_planning_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'ten_file') THEN
        ALTER TABLE public.planning_files RENAME COLUMN ten_file TO file_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'loai_file') THEN
        ALTER TABLE public.planning_files RENAME COLUMN loai_file TO file_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'duong_dan') THEN
        ALTER TABLE public.planning_files RENAME COLUMN duong_dan TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'kich_thuoc') THEN
        ALTER TABLE public.planning_files RENAME COLUMN kich_thuoc TO file_size;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'ngay_tai_len') THEN
        ALTER TABLE public.planning_files RENAME COLUMN ngay_tai_len TO uploaded_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_files' AND column_name = 'nguoi_tai_len') THEN
        ALTER TABLE public.planning_files RENAME COLUMN nguoi_tai_len TO uploaded_by;
    END IF;

    -- 10. planning_adjustments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'quy_hoach_id') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN quy_hoach_id TO port_planning_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'loai_dieu_chinh') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN loai_dieu_chinh TO adjustment_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'ly_do') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN ly_do TO reason;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'mo_ta_chi_tiet') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN mo_ta_chi_tiet TO detailed_description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'pham_vi_anh_huong') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN pham_vi_anh_huong TO affected_scope;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'tinh_trang') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN tinh_trang TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'nguoi_dang_ky') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN nguoi_dang_ky TO registrant;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'ngay_dang_ky') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN ngay_dang_ky TO registered_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_adjustments' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.planning_adjustments RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 11. adjustment_approvals
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'dieu_chinh_id') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN dieu_chinh_id TO planning_adjustment_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'cap_duyet') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN cap_duyet TO approval_level;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'trang_thai') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN trang_thai TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'nguoi_duyet') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN nguoi_duyet TO approved_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'ngay_duyet') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN ngay_duyet TO approved_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'adjustment_approvals' AND column_name = 'y_kien') THEN
        ALTER TABLE public.adjustment_approvals RENAME COLUMN y_kien TO notes;
    END IF;

    -- 12. incidents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'thoi_gian_phat_hien') THEN
        ALTER TABLE public.incidents RENAME COLUMN thoi_gian_phat_hien TO discovery_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'vi_tri') THEN
        ALTER TABLE public.incidents RENAME COLUMN vi_tri TO location;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'muc_do_nghiem_trong') THEN
        ALTER TABLE public.incidents RENAME COLUMN muc_do_nghiem_trong TO severity_level;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'mo_ta') THEN
        ALTER TABLE public.incidents RENAME COLUMN mo_ta TO description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'tinh_trang_xu_ly') THEN
        ALTER TABLE public.incidents RENAME COLUMN tinh_trang_xu_ly TO processing_status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'nguoi_bao_cao') THEN
        ALTER TABLE public.incidents RENAME COLUMN nguoi_bao_cao TO reporter;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.incidents RENAME COLUMN ngay_tao TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.incidents RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.incidents RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 13. incident_records
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'su_co_id') THEN
        ALTER TABLE public.incident_records RENAME COLUMN su_co_id TO incident_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'mo_ta_chi_tiet') THEN
        ALTER TABLE public.incident_records RENAME COLUMN mo_ta_chi_tiet TO detailed_description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'bien_phap_khac_phuc') THEN
        ALTER TABLE public.incident_records RENAME COLUMN bien_phap_khac_phuc TO remedial_measures;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'thoi_gian_ket_thuc_xu_ly') THEN
        ALTER TABLE public.incident_records RENAME COLUMN thoi_gian_ket_thuc_xu_ly TO processing_end_time;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'nguoi_ghi_nhan') THEN
        ALTER TABLE public.incident_records RENAME COLUMN nguoi_ghi_nhan TO recorder;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incident_records' AND column_name = 'ngay_ghi_nhan') THEN
        ALTER TABLE public.incident_records RENAME COLUMN ngay_ghi_nhan TO recorded_at;
    END IF;

    -- 14. attached_documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'van_ban_id') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN van_ban_id TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'bien_ban_id') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN bien_ban_id TO incident_record_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'ten_tai_lieu') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN ten_tai_lieu TO document_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'duong_dan') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN duong_dan TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'kich_thuoc') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN kich_thuoc TO file_size;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'ngay_tai_len') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN ngay_tai_len TO uploaded_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attached_documents' AND column_name = 'nguoi_tai_len') THEN
        ALTER TABLE public.attached_documents RENAME COLUMN nguoi_tai_len TO uploaded_by;
    END IF;

    -- 15. processing_progress
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_progress' AND column_name = 'su_co_id') THEN
        ALTER TABLE public.processing_progress RENAME COLUMN su_co_id TO incident_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_progress' AND column_name = 'thoi_gian_cap_nhat') THEN
        ALTER TABLE public.processing_progress RENAME COLUMN thoi_gian_cap_nhat TO updated_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_progress' AND column_name = 'mo_ta_tien_do') THEN
        ALTER TABLE public.processing_progress RENAME COLUMN mo_ta_tien_do TO progress_description;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processing_progress' AND column_name = 'nguoi_cap_nhat') THEN
        ALTER TABLE public.processing_progress RENAME COLUMN nguoi_cap_nhat TO updated_by;
    END IF;

    -- 16. legal_documents
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'ten_van_ban') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN ten_van_ban TO document_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'so_hieu') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN so_hieu TO document_number;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'co_quan_ban_hanh') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN co_quan_ban_hanh TO issuing_authority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'loai_van_ban') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN loai_van_ban TO document_type;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'ngay_ban_hanh') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN ngay_ban_hanh TO issue_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'ngay_hieu_luc') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN ngay_hieu_luc TO effective_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'tinh_trang_hieu_luc') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN tinh_trang_hieu_luc TO status;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'mo_ta_tom_tat') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN mo_ta_tom_tat TO summary;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'duong_dan_file') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN duong_dan_file TO file_path;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'nguoi_tao') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN nguoi_tao TO created_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'ngay_tao') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN ngay_tao TO created_at;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'nguoi_sua_doi') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN nguoi_sua_doi TO updated_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'legal_documents' AND column_name = 'ngay_sua_doi') THEN
        ALTER TABLE public.legal_documents RENAME COLUMN ngay_sua_doi TO updated_at;
    END IF;

    -- 17. search_suggestions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_suggestions' AND column_name = 'tu_khoa') THEN
        ALTER TABLE public.search_suggestions RENAME COLUMN tu_khoa TO keyword;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_suggestions' AND column_name = 'so_luong_tim') THEN
        ALTER TABLE public.search_suggestions RENAME COLUMN so_luong_tim TO search_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_suggestions' AND column_name = 'lan_cuoi_tim') THEN
        ALTER TABLE public.search_suggestions RENAME COLUMN lan_cuoi_tim TO last_searched;
    END IF;

    -- 18. search_results
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'van_ban_id') THEN
        ALTER TABLE public.search_results RENAME COLUMN van_ban_id TO document_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'ten_van_ban') THEN
        ALTER TABLE public.search_results RENAME COLUMN ten_van_ban TO document_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'so_hieu') THEN
        ALTER TABLE public.search_results RENAME COLUMN so_hieu TO document_number;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'co_quan_ban_hanh') THEN
        ALTER TABLE public.search_results RENAME COLUMN co_quan_ban_hanh TO issuing_authority;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'ngay_ban_hanh') THEN
        ALTER TABLE public.search_results RENAME COLUMN ngay_ban_hanh TO issue_date;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'diem_phu_hop') THEN
        ALTER TABLE public.search_results RENAME COLUMN diem_phu_hop TO relevance_score;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_results' AND column_name = 'mo_ta_tom_tat') THEN
        ALTER TABLE public.search_results RENAME COLUMN mo_ta_tom_tat TO summary;
    END IF;

    -- 20. search_logs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_logs' AND column_name = 'nguoi_tim_kiem') THEN
        ALTER TABLE public.search_logs RENAME COLUMN nguoi_tim_kiem TO searched_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_logs' AND column_name = 'tu_khoa') THEN
        ALTER TABLE public.search_logs RENAME COLUMN tu_khoa TO keyword;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_logs' AND column_name = 'bo_loc') THEN
        ALTER TABLE public.search_logs RENAME COLUMN bo_loc TO filters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_logs' AND column_name = 'so_luong_ket_qua') THEN
        ALTER TABLE public.search_logs RENAME COLUMN so_luong_ket_qua TO result_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'search_logs' AND column_name = 'ngay_tim_kiem') THEN
        ALTER TABLE public.search_logs RENAME COLUMN ngay_tim_kiem TO searched_at;
    END IF;

    -- 21. lookup_logs
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lookup_logs' AND column_name = 'nguoi_tra_cuu') THEN
        ALTER TABLE public.lookup_logs RENAME COLUMN nguoi_tra_cuu TO searched_by;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lookup_logs' AND column_name = 'tu_khoa') THEN
        ALTER TABLE public.lookup_logs RENAME COLUMN tu_khoa TO keyword;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lookup_logs' AND column_name = 'bo_loc') THEN
        ALTER TABLE public.lookup_logs RENAME COLUMN bo_loc TO filters;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lookup_logs' AND column_name = 'so_luong_ket_qua') THEN
        ALTER TABLE public.lookup_logs RENAME COLUMN so_luong_ket_qua TO result_count;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lookup_logs' AND column_name = 'ngay_tra_cuu') THEN
        ALTER TABLE public.lookup_logs RENAME COLUMN ngay_tra_cuu TO searched_at;
    END IF;
END $$;
