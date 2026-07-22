-- 1. Đổi tên bảng
alter table public.beacon_light rename to den_bien;

-- 2. Đổi tên cột
alter table public.den_bien rename column code to ma_den_bien;
alter table public.den_bien rename column name to ten_den_bien;
alter table public.den_bien rename column description to dia_diem_dat_tram_den;
alter table public.den_bien rename column latitude to vi_do;
alter table public.den_bien rename column longitude to kinh_do;
alter table public.den_bien rename column light_range to tam_hieu_luc_anh_sang;
alter table public.den_bien rename column light_color to mau_sac_ben_ngoai_cua_thap_den;
alter table public.den_bien rename column light_characteristic to chung_loai_den_chinh;
alter table public.den_bien rename column range to dien_tich;
alter table public.den_bien rename column last_maintenance_date to thoi_diem_sua_chua_gan_nhat;
alter table public.den_bien rename column next_maintenance_date to thoi_diem_dua_vao_su_dung;
alter table public.den_bien rename column type to cap_tram_den;

-- 3. Mở rộng độ dài cột
alter table public.den_bien alter column ten_den_bien type varchar(255);
alter table public.den_bien alter column mau_sac_ben_ngoai_cua_thap_den type varchar(500);

-- 4. Unique constraint: xóa cũ, tạo mới trỏ vào ma_den_bien
alter table public.den_bien drop constraint if exists ukbflnjodjjrp150kyn3fct6qwu;
alter table public.den_bien add constraint uk_den_bien_ma unique (ma_den_bien);

-- 5. Bổ sung cột
alter table public.den_bien add column hinh_dang varchar(255);
alter table public.den_bien add column ket_cau varchar(2000);
alter table public.den_bien add column chieu_cao_thap_den numeric(20, 4);
alter table public.den_bien add column chieu_cao_tam_sang numeric(20, 4);
alter table public.den_bien add column tam_hieu_luc_dia_ly varchar(20);
alter table public.den_bien add column chung_loai_den_du_phong varchar(100);
alter table public.den_bien add column nguon_cung_cap_nang_luong_cho_den varchar(500);
alter table public.den_bien add column so_luong_nhan_su_bo_tri numeric(5, 0);
alter table public.den_bien add column dien_tich_su_dung_tram numeric(20, 4);

-- 6. Mở rộng độ dài cột tại bảng lưu lịch sử thay đổi
alter table public.beacon_history alter column changed_field type varchar(500);