DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'de_ke') AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'dike_revetment') THEN
        ALTER TABLE public.de_ke RENAME TO dike_revetment;
        ALTER TABLE public.dike_revetment RENAME CONSTRAINT de_ke_pkey TO dike_revetment_pkey;
        ALTER TABLE public.dike_revetment RENAME COLUMN ten_de_ke TO dike_revetment_name;
        ALTER TABLE public.dike_revetment RENAME COLUMN vi_tri TO "location";
        ALTER TABLE public.dike_revetment RENAME COLUMN chieu_cao TO height;
        ALTER TABLE public.dike_revetment RENAME COLUMN chieu_dai TO length;
        ALTER TABLE public.dike_revetment RENAME COLUMN chieu_rong TO width;
        ALTER TABLE public.dike_revetment RENAME COLUMN cao_trinh_dinh TO crest_elevation;
        ALTER TABLE public.dike_revetment RENAME COLUMN loai_de TO dike_revetment_type;
        ALTER TABLE public.dike_revetment RENAME COLUMN mat_vat_lieu TO surface_material;
        ALTER TABLE public.dike_revetment RENAME COLUMN tinh_trang TO status;
        ALTER TABLE public.dike_revetment RENAME COLUMN thoi_diem_dua_vao_khai_thac TO commissioning_date;
        ALTER TABLE public.dike_revetment RENAME COLUMN ghi_chu TO note;
        ALTER TABLE public.dike_revetment RENAME COLUMN ly_do_tu_choi TO rejection_reason;
        ALTER TABLE public.dike_revetment RENAME COLUMN trang_thai_phe_duyet TO approval_status;
        ALTER TABLE public.dike_revetment RENAME COLUMN phe_duyet_c1 TO is_approved_level1;
        ALTER TABLE public.dike_revetment RENAME COLUMN phe_duyet_c2 TO is_approved_level2;
        ALTER TABLE public.dike_revetment RENAME COLUMN nguoi_phe_duyet_c1 TO approver_level1;
        ALTER TABLE public.dike_revetment RENAME COLUMN nguoi_phe_duyet_c2 TO approver_level2;
        ALTER TABLE public.dike_revetment RENAME COLUMN ngay_phe_duyet_c1 TO approved_date_level1;
        ALTER TABLE public.dike_revetment RENAME COLUMN ngay_phe_duyet_c2 TO approved_date_level2;
        
        ALTER TABLE public.de_ke_attachment RENAME TO dike_revetment_attachment;
        ALTER TABLE public.dike_revetment_attachment RENAME COLUMN de_ke_id TO dike_revetment_id;
        ALTER TABLE public.dike_revetment_attachment RENAME COLUMN ten_tai_lieu TO file_name;
        ALTER TABLE public.dike_revetment_attachment RENAME COLUMN duong_dan TO file_path;
        ALTER TABLE public.dike_revetment_attachment RENAME COLUMN kich_thuoc TO file_size;
        ALTER TABLE public.dike_revetment_attachment RENAME COLUMN ngay_tai_len TO upload_date;
    END IF;
END $$;

ALTER TABLE public.dike_revetment ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS deleted_at timestamp(6);
ALTER TABLE public.dike_revetment ADD COLUMN IF NOT EXISTS deleted_by varchar(100);