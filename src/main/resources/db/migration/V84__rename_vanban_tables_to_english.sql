-- Rename tables from vanban module (Vietnamese -> English)
DO $$ 
BEGIN
    -- 1. legal_documents (was van_ban_phap_ly)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'van_ban_phap_ly') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'legal_documents') THEN
        ALTER TABLE public.van_ban_phap_ly RENAME TO legal_documents;
    END IF;

    -- 2. maintenance_reports (was bao_cao_bao_tri)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bao_cao_bao_tri') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'maintenance_reports') THEN
        ALTER TABLE public.bao_cao_bao_tri RENAME TO maintenance_reports;
    END IF;

    -- 3. operation_reports (was bao_cao_van_hanh)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bao_cao_van_hanh') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'operation_reports') THEN
        ALTER TABLE public.bao_cao_van_hanh RENAME TO operation_reports;
    END IF;

    -- 4. incident_records (was bien_ban_su_co)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bien_ban_su_co') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'incident_records') THEN
        ALTER TABLE public.bien_ban_su_co RENAME TO incident_records;
    END IF;

    -- 5. planning_adjustments (was dieu_chinh_quy_hoach)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'dieu_chinh_quy_hoach') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planning_adjustments') THEN
        ALTER TABLE public.dieu_chinh_quy_hoach RENAME TO planning_adjustments;
    END IF;

    -- 6. planning_files (was file_quy_hoach)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'file_quy_hoach') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planning_files') THEN
        ALTER TABLE public.file_quy_hoach RENAME TO planning_files;
    END IF;

    -- 7. search_suggestions (was goi_y_tim_kiem)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'goi_y_tim_kiem') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'search_suggestions') THEN
        ALTER TABLE public.goi_y_tim_kiem RENAME TO search_suggestions;
    END IF;

    -- 8. planning_categories (was ham_muc_quy_hoach)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ham_muc_quy_hoach') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'planning_categories') THEN
        ALTER TABLE public.ham_muc_quy_hoach RENAME TO planning_categories;
    END IF;

    -- 9. maintenance_plans (was ke_hoach_bao_tri)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ke_hoach_bao_tri') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'maintenance_plans') THEN
        ALTER TABLE public.ke_hoach_bao_tri RENAME TO maintenance_plans;
    END IF;

    -- 10. operation_plans (was ke_hoach_van_hanh)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ke_hoach_van_hanh') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'operation_plans') THEN
        ALTER TABLE public.ke_hoach_van_hanh RENAME TO operation_plans;
    END IF;

    -- 11. maintenance_results (was ket_qua_bao_tri)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ket_qua_bao_tri') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'maintenance_results') THEN
        ALTER TABLE public.ket_qua_bao_tri RENAME TO maintenance_results;
    END IF;

    -- 12. search_results (was ket_qua_tim_kiem)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ket_qua_tim_kiem') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'search_results') THEN
        ALTER TABLE public.ket_qua_tim_kiem RENAME TO search_results;
    END IF;

    -- 13. lookup_results (was ket_qua_tra_cuu)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ket_qua_tra_cuu') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lookup_results') THEN
        ALTER TABLE public.ket_qua_tra_cuu RENAME TO lookup_results;
    END IF;

    -- 14. adjustment_approvals (was phe_duyet_dieu_chinh)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'phe_duyet_dieu_chinh') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'adjustment_approvals') THEN
        ALTER TABLE public.phe_duyet_dieu_chinh RENAME TO adjustment_approvals;
    END IF;

    -- 15. port_planning (was quy_hoach_ben_cang)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quy_hoach_ben_cang') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'port_planning') THEN
        ALTER TABLE public.quy_hoach_ben_cang RENAME TO port_planning;
    END IF;

    -- 16. current_planning (was quy_hoach_hien_hanh)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'quy_hoach_hien_hanh') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'current_planning') THEN
        ALTER TABLE public.quy_hoach_hien_hanh RENAME TO current_planning;
    END IF;

    -- 17. incidents (was su_co)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'su_co') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'incidents') THEN
        ALTER TABLE public.su_co RENAME TO incidents;
    END IF;

    -- 18. attached_documents (was tai_lieu_dinh_kem)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tai_lieu_dinh_kem') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'attached_documents') THEN
        ALTER TABLE public.tai_lieu_dinh_kem RENAME TO attached_documents;
    END IF;

    -- 19. processing_progress (was tien_do_xu_ly)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tien_do_xu_ly') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'processing_progress') THEN
        ALTER TABLE public.tien_do_xu_ly RENAME TO processing_progress;
    END IF;

    -- 20. search_logs (was tim_kiem_log)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tim_kiem_log') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'search_logs') THEN
        ALTER TABLE public.tim_kiem_log RENAME TO search_logs;
    END IF;

    -- 21. lookup_logs (was tra_cuu_log)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tra_cuu_log') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lookup_logs') THEN
        ALTER TABLE public.tra_cuu_log RENAME TO lookup_logs;
    END IF;

    -- 22. operation_details (was van_hanh_chi_tiet)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'van_hanh_chi_tiet') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'operation_details') THEN
        ALTER TABLE public.van_hanh_chi_tiet RENAME TO operation_details;
    END IF;
END $$;
