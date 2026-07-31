DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'luong_hang_hai') AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'navigation_channel') THEN
        -- Rename table + PK
        ALTER TABLE public.luong_hang_hai RENAME TO navigation_channel;
        ALTER TABLE public.navigation_channel RENAME CONSTRAINT luong_hang_hai_pkey TO navigation_channel_pkey;

        -- Rename columns
        ALTER TABLE public.navigation_channel RENAME COLUMN ten TO channel_name;
        ALTER TABLE public.navigation_channel RENAME COLUMN tinh_trang TO status;
        ALTER TABLE public.navigation_channel RENAME COLUMN trang_thai_phe_duyet TO approval_status;
        ALTER TABLE public.navigation_channel RENAME COLUMN ly_do_tu_choi TO rejection_reason;
        ALTER TABLE public.navigation_channel RENAME COLUMN ghi_chu TO note;
        ALTER TABLE public.navigation_channel RENAME COLUMN cang_bien_id TO seaport_id;
        ALTER TABLE public.navigation_channel RENAME COLUMN chieu_cao_tinh_khong TO clearance_height;
        ALTER TABLE public.navigation_channel RENAME COLUMN dia_diem TO "location";
        ALTER TABLE public.navigation_channel RENAME COLUMN dia_diem_chi_tiet TO detailed_location;
        ALTER TABLE public.navigation_channel RENAME COLUMN dien_tich_tram TO station_area;
        ALTER TABLE public.navigation_channel RENAME COLUMN don_vi_van_hanh_id TO operating_unit_id;
        ALTER TABLE public.navigation_channel RENAME COLUMN khoi_luong_nao_vet TO dredging_volume;
        ALTER TABLE public.navigation_channel RENAME COLUMN ma_luong_hang_hai TO channel_code;
        ALTER TABLE public.navigation_channel RENAME COLUMN nam_bao_tri_gan_nhat TO latest_maintenance_year;
        ALTER TABLE public.navigation_channel RENAME COLUMN ngay_phe_duyet_c1 TO approved_date_level1;
        ALTER TABLE public.navigation_channel RENAME COLUMN ngay_phe_duyet_c2 TO approved_date_level2;
        ALTER TABLE public.navigation_channel RENAME COLUMN nguoi_phe_duyet_c1 TO approver_level1;
        ALTER TABLE public.navigation_channel RENAME COLUMN nguoi_phe_duyet_c2 TO approver_level2;
        ALTER TABLE public.navigation_channel RENAME COLUMN phe_duyet_c1 TO is_approved_level1;
        ALTER TABLE public.navigation_channel RENAME COLUMN phe_duyet_c2 TO is_approved_level2;
        ALTER TABLE public.navigation_channel RENAME COLUMN so_luong_nhan_su_tai_tram TO station_staff_amount;
        ALTER TABLE public.navigation_channel RENAME COLUMN so_luong_phao TO buoy_amount;
        ALTER TABLE public.navigation_channel RENAME COLUMN so_luong_tieu TO beacon_amount;
        ALTER TABLE public.navigation_channel RENAME COLUMN so_luong_tram TO station_amountt;
        ALTER TABLE public.navigation_channel RENAME COLUMN thoi_diem_sua_chua_tram_gan_nhat TO latest_station_repair_date;
        ALTER TABLE public.navigation_channel RENAME COLUMN tram_quan_ly_luong TO channel_management_station;

        -- Rename child table + FK
        ALTER TABLE public.luong_hang_hai_attachment RENAME TO navigation_channel_attachment;
        ALTER TABLE public.navigation_channel_attachment RENAME COLUMN luong_hang_hai_id TO navigation_channel_id;

        ALTER TABLE public.chi_tiet_tuyen_luong RENAME COLUMN luong_hang_hai_id TO navigation_channel_id;
        ALTER TABLE public.phe_duyet_lich_su RENAME COLUMN luong_hang_hai_id TO navigation_channel_id;


-- Add DEFAULT to id
ALTER TABLE public.navigation_channel ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add new columns
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS registered_area varchar(100);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS operating_hours varchar(50);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS recorded_date date;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS quantity int4;
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS load_capacity varchar(100);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS deleted_at timestamp(6);
ALTER TABLE public.navigation_channel ADD COLUMN IF NOT EXISTS deleted_by varchar(100);

    END IF;
END $$;
