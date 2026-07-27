-- V80: Rename Asset Movement management tables and columns from Vietnamese to English
-- This migration converts all remaining tables in the asset movement module

DO $$
BEGIN
    -- 1. inventory_reports (was bao_cao_kiem_ke)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bao_cao_kiem_ke') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_reports') THEN
        ALTER TABLE public.bao_cao_kiem_ke RENAME TO inventory_reports;
        ALTER TABLE public.inventory_reports RENAME COLUMN ke_hoach_id TO plan_id;
        ALTER TABLE public.inventory_reports RENAME COLUMN tong_so_tai_san TO total_assets;
        ALTER TABLE public.inventory_reports RENAME COLUMN so_thua TO surplus_count;
        ALTER TABLE public.inventory_reports RENAME COLUMN so_thieu TO missing_count;
        ALTER TABLE public.inventory_reports RENAME COLUMN so_khac_thuong TO abnormal_count;
        ALTER TABLE public.inventory_reports RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.inventory_reports RENAME COLUMN trang_thai TO status;
    END IF;

    -- 2. asset_processing_records (was ho_so_xu_ly_tai_san)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ho_so_xu_ly_tai_san') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'asset_processing_records') THEN
        ALTER TABLE public.ho_so_xu_ly_tai_san RENAME TO asset_processing_records;
        ALTER TABLE public.asset_processing_records RENAME COLUMN tai_san_id TO asset_id;
        ALTER TABLE public.asset_processing_records RENAME COLUMN loai_xu_ly TO processing_type;
        ALTER TABLE public.asset_processing_records RENAME COLUMN ben_nhan TO recipient;
        ALTER TABLE public.asset_processing_records RENAME COLUMN ly_do_xu_ly TO processing_reason;
        ALTER TABLE public.asset_processing_records RENAME COLUMN gia_tri_thanh_ly TO liquidation_value;
        ALTER TABLE public.asset_processing_records RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.asset_processing_records RENAME COLUMN trang_thai TO status;
    END IF;

    -- 3. inventory_plans (was ke_hoach_kiem_ke)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ke_hoach_kiem_ke') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_plans') THEN
        ALTER TABLE public.ke_hoach_kiem_ke RENAME TO inventory_plans;
        ALTER TABLE public.inventory_plans RENAME COLUMN ten_ke_hoach TO plan_name;
        ALTER TABLE public.inventory_plans RENAME COLUMN loai_kiem_ke TO inventory_type;
        ALTER TABLE public.inventory_plans RENAME COLUMN pham_vi TO scope;
        ALTER TABLE public.inventory_plans RENAME COLUMN ngay_bat_dau TO start_date;
        ALTER TABLE public.inventory_plans RENAME COLUMN ngay_ket_thuc TO end_date;
        ALTER TABLE public.inventory_plans RENAME COLUMN to_truong_kiem_ke TO inventory_leader;
        ALTER TABLE public.inventory_plans RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.inventory_plans RENAME COLUMN trang_thai TO status;
    END IF;

    -- 4. asset_exploitations (was khai_thac_tai_san)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'khai_thac_tai_san') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'asset_exploitations') THEN
        ALTER TABLE public.khai_thac_tai_san RENAME TO asset_exploitations;
        ALTER TABLE public.asset_exploitations RENAME COLUMN tai_san_id TO asset_id;
        ALTER TABLE public.asset_exploitations RENAME COLUMN thoi_gian_hoat_dong TO operating_time;
        ALTER TABLE public.asset_exploitations RENAME COLUMN muc_do_khai_thac TO exploitation_level;
        ALTER TABLE public.asset_exploitations RENAME COLUMN chi_phi_van_hanh TO operating_cost;
        ALTER TABLE public.asset_exploitations RENAME COLUMN chi_phi_bao_duong TO maintenance_cost;
        ALTER TABLE public.asset_exploitations RENAME COLUMN tinh_trang_ky_thuat TO technical_status;
        ALTER TABLE public.asset_exploitations RENAME COLUMN thang_khai_thac TO exploitation_month;
        ALTER TABLE public.asset_exploitations RENAME COLUMN nam_khai_thac TO exploitation_year;
        ALTER TABLE public.asset_exploitations RENAME COLUMN mo_ta TO description;
    END IF;

    -- 5. approval_records (was luu_phe_duyệt or luu_phe_duyet)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'luu_phe_duyệt') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'approval_records') THEN
        ALTER TABLE public."luu_phe_duyệt" RENAME TO approval_records;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'luu_phe_duyet') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'approval_records') THEN
        ALTER TABLE public.luu_phe_duyet RENAME TO approval_records;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'approval_records') THEN
        -- Only rename columns if they exist (in case it was already renamed partially)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='approval_records' AND column_name='yeu_cau_id') THEN
            ALTER TABLE public.approval_records RENAME COLUMN yeu_cau_id TO request_id;
            ALTER TABLE public.approval_records RENAME COLUMN cap_phe_duyet TO approval_level;
            ALTER TABLE public.approval_records RENAME COLUMN nguoi_phe_duyet TO approver_name;
            ALTER TABLE public.approval_records RENAME COLUMN ket_qua TO result;
            ALTER TABLE public.approval_records RENAME COLUMN ly_do TO reason;
            ALTER TABLE public.approval_records RENAME COLUMN ngay_phe_duyet TO approval_date;
            ALTER TABLE public.approval_records RENAME COLUMN mo_ta TO description;
        END IF;
    END IF;

    -- 6. infra_assets (was tai_san_kcht)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tai_san_kcht') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'infra_assets') THEN
        ALTER TABLE public.tai_san_kcht RENAME TO infra_assets;
        ALTER TABLE public.infra_assets RENAME COLUMN ma_tai_san TO asset_code;
        ALTER TABLE public.infra_assets RENAME COLUMN ten_tai_san TO asset_name;
        ALTER TABLE public.infra_assets RENAME COLUMN loai_tai_san TO asset_type;
        ALTER TABLE public.infra_assets RENAME COLUMN vi_tri TO location;
        ALTER TABLE public.infra_assets RENAME COLUMN thong_so_ky_thuat TO technical_specs;
        ALTER TABLE public.infra_assets RENAME COLUMN nguon_kinh_phi TO funding_source;
        ALTER TABLE public.infra_assets RENAME COLUMN nguyen_gia TO original_value;
        ALTER TABLE public.infra_assets RENAME COLUMN trang_thai TO status;
    END IF;

    -- 7. inventory_assets (was tai_san_kiem_ke)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tai_san_kiem_ke') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'inventory_assets') THEN
        ALTER TABLE public.tai_san_kiem_ke RENAME TO inventory_assets;
        ALTER TABLE public.inventory_assets RENAME COLUMN ke_hoach_id TO plan_id;
        ALTER TABLE public.inventory_assets RENAME COLUMN tai_san_id TO asset_id;
        ALTER TABLE public.inventory_assets RENAME COLUMN gia_tri_sach TO book_value;
        ALTER TABLE public.inventory_assets RENAME COLUMN gia_tri_thuc_te TO actual_value;
        ALTER TABLE public.inventory_assets RENAME COLUMN chenh_lech TO difference;
        ALTER TABLE public.inventory_assets RENAME COLUMN trang_thai_kiem_ke TO inventory_status;
        ALTER TABLE public.inventory_assets RENAME COLUMN ghi_chu TO notes;
    END IF;

    -- 8. movement_requests (was yeu_cau_bien_dong)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'yeu_cau_bien_dong') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'movement_requests') THEN
        ALTER TABLE public.yeu_cau_bien_dong RENAME TO movement_requests;
        ALTER TABLE public.movement_requests RENAME COLUMN loai_bien_dong TO movement_type;
        ALTER TABLE public.movement_requests RENAME COLUMN tieu_de TO title;
        ALTER TABLE public.movement_requests RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.movement_requests RENAME COLUMN nguoi_tao TO creator_name;
        ALTER TABLE public.movement_requests RENAME COLUMN trang_thai TO status;
    END IF;

    -- 9. asset_decrease_requests (was yeu_cau_giam_tai_san)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'yeu_cau_giam_tai_san') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'asset_decrease_requests') THEN
        ALTER TABLE public.yeu_cau_giam_tai_san RENAME TO asset_decrease_requests;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN tai_san_id TO asset_id;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN nguyen_nhan_giam TO decrease_reason;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN ngay_giam TO decrease_date;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN bien_ban_kiem_tra TO inspection_report;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN hao_mon_luc_ke TO accumulated_depreciation;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN gia_tri_con_lai TO remaining_value;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.asset_decrease_requests RENAME COLUMN trang_thai TO status;
    END IF;

    -- 10. asset_increase_requests (was yeu_cau_tang_tai_san)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'yeu_cau_tang_tai_san') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'asset_increase_requests') THEN
        ALTER TABLE public.yeu_cau_tang_tai_san RENAME TO asset_increase_requests;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN tai_san_id TO asset_id;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN loai_tai_san TO asset_type;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN vi_tri TO location;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN thong_so_ky_thuat TO technical_specs;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN nguon_kinh_phi TO funding_source;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN nguyen_gia TO original_value;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN mo_ta TO description;
        ALTER TABLE public.asset_increase_requests RENAME COLUMN trang_thai TO status;
    END IF;

END $$;

-- Update RBAC Permissions (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'roles_permissions') THEN
        UPDATE roles_permissions SET permission = 'asset:increase-request' WHERE permission = 'asset:yeu-cau-tang';
        UPDATE roles_permissions SET permission = 'asset:decrease-request' WHERE permission = 'asset:yeu-cau-giam';
        UPDATE roles_permissions SET permission = 'asset:movement-request' WHERE permission = 'asset:yeu-cau-bien-dong';
        UPDATE roles_permissions SET permission = 'asset:inventory-report' WHERE permission = 'asset:bao-cao-kiem-ke';
        UPDATE roles_permissions SET permission = 'asset:inventory-plan' WHERE permission = 'asset:ke-hoach-kiem-ke';
        UPDATE roles_permissions SET permission = 'asset:inventory-asset' WHERE permission = 'asset:tai-san-kiem-ke';
        UPDATE roles_permissions SET permission = 'asset:infra-asset' WHERE permission = 'asset:tai-san';
        UPDATE roles_permissions SET permission = 'asset:processing-record' WHERE permission = 'asset:ho-so-xu-ly';
        UPDATE roles_permissions SET permission = 'asset:approval-record' WHERE permission = 'asset:luu-phe-duyet';
        UPDATE roles_permissions SET permission = 'asset:inventory' WHERE permission = 'asset:kiem-ke';
        UPDATE roles_permissions SET permission = 'asset:exploitation' WHERE permission = 'asset:khai-thac';
    END IF;
END $$;
