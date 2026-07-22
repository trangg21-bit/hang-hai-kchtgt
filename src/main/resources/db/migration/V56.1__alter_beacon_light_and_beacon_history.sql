-- Make V56.1 migration fully idempotent
DO $$
BEGIN
    -- 1. Đổi tên bảng nếu beacon_light tồn tại và den_bien chưa tồn tại
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beacon_light')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'den_bien') THEN
        ALTER TABLE public.beacon_light RENAME TO den_bien;
    END IF;

    -- 2. Đổi tên cột nếu bảng den_bien tồn tại
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'den_bien') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'code') THEN
            ALTER TABLE public.den_bien RENAME COLUMN code TO ma_den_bien;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'name') THEN
            ALTER TABLE public.den_bien RENAME COLUMN name TO ten_den_bien;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'description') THEN
            ALTER TABLE public.den_bien RENAME COLUMN description TO dia_diem_dat_tram_den;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'latitude') THEN
            ALTER TABLE public.den_bien RENAME COLUMN latitude TO vi_do;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'longitude') THEN
            ALTER TABLE public.den_bien RENAME COLUMN longitude TO kinh_do;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'light_range') THEN
            ALTER TABLE public.den_bien RENAME COLUMN light_range TO tam_hieu_luc_anh_sang;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'light_color') THEN
            ALTER TABLE public.den_bien RENAME COLUMN light_color TO mau_sac_ben_ngoai_cua_thap_den;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'light_characteristic') THEN
            ALTER TABLE public.den_bien RENAME COLUMN light_characteristic TO chung_loai_den_chinh;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'range') THEN
            ALTER TABLE public.den_bien RENAME COLUMN range TO dien_tich;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'last_maintenance_date') THEN
            ALTER TABLE public.den_bien RENAME COLUMN last_maintenance_date TO thoi_diem_sua_chua_gan_nhat;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'next_maintenance_date') THEN
            ALTER TABLE public.den_bien RENAME COLUMN next_maintenance_date TO thoi_diem_dua_vao_su_dung;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'type') THEN
            ALTER TABLE public.den_bien RENAME COLUMN type TO cap_tram_den;
        END IF;

        -- 3. Mở rộng độ dài cột
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'ten_den_bien') THEN
            ALTER TABLE public.den_bien ALTER COLUMN ten_den_bien TYPE varchar(255);
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'mau_sac_ben_ngoai_cua_thap_den') THEN
            ALTER TABLE public.den_bien ALTER COLUMN mau_sac_ben_ngoai_cua_thap_den TYPE varchar(500);
        END IF;

        -- 4. Unique constraint: xóa cũ, tạo mới trỏ vào ma_den_bien
        ALTER TABLE public.den_bien DROP CONSTRAINT IF EXISTS ukbflnjodjjrp150kyn3fct6qwu;
        ALTER TABLE public.den_bien DROP CONSTRAINT IF EXISTS uk_den_bien_ma;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'ma_den_bien') THEN
            ALTER TABLE public.den_bien ADD CONSTRAINT uk_den_bien_ma UNIQUE (ma_den_bien);
        END IF;

        -- 5. Bổ sung cột
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'hinh_dang') THEN
            ALTER TABLE public.den_bien ADD COLUMN hinh_dang varchar(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'ket_cau') THEN
            ALTER TABLE public.den_bien ADD COLUMN ket_cau varchar(2000);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'chieu_cao_thap_den') THEN
            ALTER TABLE public.den_bien ADD COLUMN chieu_cao_thap_den numeric(20, 4);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'chieu_cao_tam_sang') THEN
            ALTER TABLE public.den_bien ADD COLUMN chieu_cao_tam_sang numeric(20, 4);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'tam_hieu_luc_dia_ly') THEN
            ALTER TABLE public.den_bien ADD COLUMN tam_hieu_luc_dia_ly varchar(20);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'chung_loai_den_du_phong') THEN
            ALTER TABLE public.den_bien ADD COLUMN chung_loai_den_du_phong varchar(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'nguon_cung_cap_nang_luong_cho_den') THEN
            ALTER TABLE public.den_bien ADD COLUMN nguon_cung_cap_nang_luong_cho_den varchar(500);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'so_luong_nhan_su_bo_tri') THEN
            ALTER TABLE public.den_bien ADD COLUMN so_luong_nhan_su_bo_tri numeric(5, 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'den_bien' AND column_name = 'dien_tich_su_dung_tram') THEN
            ALTER TABLE public.den_bien ADD COLUMN dien_tich_su_dung_tram numeric(20, 4);
        END IF;
    END IF;

    -- 6. Mở rộng độ dài cột tại bảng lưu lịch sử thay đổi
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'beacon_history') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'beacon_history' AND column_name = 'changed_field') THEN
            ALTER TABLE public.beacon_history ALTER COLUMN changed_field TYPE varchar(500);
        END IF;
    END IF;
END $$;