-- Fixture: shape of the UAT database before V82, so the migration test exercises
-- the real rename paths instead of skipping them through their IF EXISTS guards.
--
-- Station and beacon tables are created the way Hibernate ddl-auto=update made
-- them: coordinates still present, status as varchar carrying a CHECK constraint,
-- audit columns as text holding usernames.

-- === Station tables ===
CREATE TABLE buoy_station (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO buoy_station (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE lighthouse_station (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO lighthouse_station (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE coastal_station_vts (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO coastal_station_vts (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE coastal_station_lrit (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO coastal_station_lrit (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE coastal_station_inmarsat (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO coastal_station_inmarsat (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE coastal_station_haiphong (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO coastal_station_haiphong (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');
CREATE TABLE coastal_station_cospas_sarsat (
    id              UUID PRIMARY KEY,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    status          VARCHAR(50) DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','PENDING_APPROVAL','APPROVED_L1','APPROVED_L2','PUBLISHED','DELETED')),
    approval_status VARCHAR(50) DEFAULT 'PENDING'
                    CHECK (approval_status IN ('PENDING','APPROVED_L1','APPROVED_L2','REJECTED')),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    deleted_by      VARCHAR(100)
);
INSERT INTO coastal_station_cospas_sarsat (id, latitude, longitude, status, approval_status, created_by, updated_by)
VALUES (gen_random_uuid(), 20.5, 106.7, 'PUBLISHED', 'APPROVED_L2',
        'admin', '3f1a7c2e-9b4d-4e18-8a55-2c6f0d9e7b31');

-- === Beacon tables ===
CREATE TABLE beacon_light (
    id         UUID PRIMARY KEY,
    latitude   DOUBLE PRECISION,
    longitude  DOUBLE PRECISION,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);
CREATE TABLE buoy (
    id         UUID PRIMARY KEY,
    latitude   DOUBLE PRECISION,
    longitude  DOUBLE PRECISION,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- === Document module tables, still carrying their Vietnamese column names ===
-- Generated from the IF EXISTS guards in V86, so every rename it performs runs.
CREATE TABLE adjustment_approvals (
    id UUID PRIMARY KEY,
    cap_duyet VARCHAR(200),
    dieu_chinh_id VARCHAR(200),
    ngay_duyet VARCHAR(200),
    nguoi_duyet VARCHAR(200),
    trang_thai VARCHAR(200),
    y_kien VARCHAR(200)
);
CREATE TABLE attached_documents (
    id UUID PRIMARY KEY,
    bien_ban_id VARCHAR(200),
    duong_dan VARCHAR(200),
    kich_thuoc VARCHAR(200),
    ngay_tai_len VARCHAR(200),
    nguoi_tai_len VARCHAR(200),
    ten_tai_lieu VARCHAR(200),
    van_ban_id VARCHAR(200)
);
CREATE TABLE incident_records (
    id UUID PRIMARY KEY,
    bien_phap_khac_phuc VARCHAR(200),
    mo_ta_chi_tiet VARCHAR(200),
    ngay_ghi_nhan VARCHAR(200),
    nguoi_ghi_nhan VARCHAR(200),
    su_co_id VARCHAR(200),
    thoi_gian_ket_thuc_xu_ly VARCHAR(200)
);
CREATE TABLE incidents (
    id UUID PRIMARY KEY,
    mo_ta VARCHAR(200),
    muc_do_nghiem_trong VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_bao_cao VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    thoi_gian_phat_hien VARCHAR(200),
    tinh_trang_xu_ly VARCHAR(200),
    vi_tri VARCHAR(200)
);
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY,
    co_quan_ban_hanh VARCHAR(200),
    duong_dan_file VARCHAR(200),
    loai_van_ban VARCHAR(200),
    mo_ta_tom_tat VARCHAR(200),
    ngay_ban_hanh VARCHAR(200),
    ngay_hieu_luc VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    nguoi_tao VARCHAR(200),
    so_hieu VARCHAR(200),
    ten_van_ban VARCHAR(200),
    tinh_trang_hieu_luc VARCHAR(200)
);
CREATE TABLE lookup_logs (
    id UUID PRIMARY KEY,
    bo_loc VARCHAR(200),
    ngay_tra_cuu VARCHAR(200),
    nguoi_tra_cuu VARCHAR(200),
    so_luong_ket_qua VARCHAR(200),
    tu_khoa VARCHAR(200)
);
CREATE TABLE maintenance_plans (
    id UUID PRIMARY KEY,
    chi_phi_du_kien VARCHAR(200),
    loai_bao_tri VARCHAR(200),
    ngay_bat_dau_du_kien VARCHAR(200),
    ngay_ket_thuc_du_kien VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    nguoi_tao VARCHAR(200),
    thiet_bi VARCHAR(200),
    tinh_trang VARCHAR(200)
);
CREATE TABLE maintenance_reports (
    id UUID PRIMARY KEY,
    duong_dan_file VARCHAR(200),
    ky_bat_dau VARCHAR(200),
    ky_ket_thuc VARCHAR(200),
    loai_bao_cao VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_tao VARCHAR(200),
    tong_chi_phi VARCHAR(200)
);
CREATE TABLE maintenance_results (
    id UUID PRIMARY KEY,
    ke_hoach_id VARCHAR(200),
    mo_ta_ket_qua VARCHAR(200),
    ngay_ghi_nhan VARCHAR(200),
    nguoi_ghi_nhan VARCHAR(200),
    phu_ton_thay_the VARCHAR(200),
    thoi_gian_bat_dau_thuc_te VARCHAR(200),
    thoi_gian_ket_thuc_thuc_te VARCHAR(200),
    thoi_gian_ngung_hoat_dong VARCHAR(200)
);
CREATE TABLE operation_details (
    id UUID PRIMARY KEY,
    ghi_chu VARCHAR(200),
    ke_hoach_id VARCHAR(200),
    mo_ta VARCHAR(200),
    san_luong_du_kien VARCHAR(200),
    san_luong_thuc_te VARCHAR(200)
);
CREATE TABLE operation_plans (
    id UUID PRIMARY KEY,
    cau_cang VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    ngay_tao VARCHAR(200),
    ngay_van_hanh VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    nguoi_tao VARCHAR(200),
    thiet_bi VARCHAR(200),
    thoi_gian_bat_dau VARCHAR(200),
    thoi_gian_ket_thuc VARCHAR(200),
    tinh_trang VARCHAR(200)
);
CREATE TABLE operation_reports (
    id UUID PRIMARY KEY,
    duong_dan_file VARCHAR(200),
    ky_bat_dau VARCHAR(200),
    ky_ket_thuc VARCHAR(200),
    loai_bao_cao VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_tao VARCHAR(200),
    tong_chi_phi VARCHAR(200)
);
CREATE TABLE planning_adjustments (
    id UUID PRIMARY KEY,
    loai_dieu_chinh VARCHAR(200),
    ly_do VARCHAR(200),
    mo_ta_chi_tiet VARCHAR(200),
    ngay_dang_ky VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    nguoi_dang_ky VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    pham_vi_anh_huong VARCHAR(200),
    quy_hoach_id VARCHAR(200),
    tinh_trang VARCHAR(200)
);
CREATE TABLE planning_categories (
    id UUID PRIMARY KEY,
    don_vi_tinh VARCHAR(200),
    gia_tri_ke_hoach VARCHAR(200),
    gia_tri_thuc_te VARCHAR(200),
    quy_hoach_id VARCHAR(200),
    ten_ham_muc VARCHAR(200),
    trang_thai VARCHAR(200)
);
CREATE TABLE planning_files (
    id UUID PRIMARY KEY,
    duong_dan VARCHAR(200),
    kich_thuoc VARCHAR(200),
    loai_file VARCHAR(200),
    ngay_tai_len VARCHAR(200),
    nguoi_tai_len VARCHAR(200),
    quy_hoach_id VARCHAR(200),
    ten_file VARCHAR(200)
);
CREATE TABLE port_planning (
    id UUID PRIMARY KEY,
    co_quan_phe_duyet VARCHAR(200),
    duong_dan_file VARCHAR(200),
    ngay_phe_duyet VARCHAR(200),
    ngay_sua_doi VARCHAR(200),
    ngay_tao VARCHAR(200),
    nguoi_sua_doi VARCHAR(200),
    nguoi_tao VARCHAR(200),
    pham_vi_ap_dung VARCHAR(200),
    ten_do_an VARCHAR(200),
    ti_le_ban_do VARCHAR(200),
    tinh_trang VARCHAR(200)
);
CREATE TABLE processing_progress (
    id UUID PRIMARY KEY,
    mo_ta_tien_do VARCHAR(200),
    nguoi_cap_nhat VARCHAR(200),
    su_co_id VARCHAR(200),
    thoi_gian_cap_nhat VARCHAR(200)
);
CREATE TABLE search_logs (
    id UUID PRIMARY KEY,
    bo_loc VARCHAR(200),
    ngay_tim_kiem VARCHAR(200),
    nguoi_tim_kiem VARCHAR(200),
    so_luong_ket_qua VARCHAR(200),
    tu_khoa VARCHAR(200)
);
CREATE TABLE search_results (
    id UUID PRIMARY KEY,
    co_quan_ban_hanh VARCHAR(200),
    diem_phu_hop VARCHAR(200),
    mo_ta_tom_tat VARCHAR(200),
    ngay_ban_hanh VARCHAR(200),
    so_hieu VARCHAR(200),
    ten_van_ban VARCHAR(200),
    van_ban_id VARCHAR(200)
);
CREATE TABLE search_suggestions (
    id UUID PRIMARY KEY,
    lan_cuoi_tim VARCHAR(200),
    so_luong_tim VARCHAR(200),
    tu_khoa VARCHAR(200)
);

-- Rows for the V90 exclusion checks. After V86 renames them, nguoi_tao becomes
-- created_by and nguoi_duyet becomes approved_by — both must stay text.
INSERT INTO port_planning (id, nguoi_tao) VALUES (gen_random_uuid(), 'nguyenvana');
INSERT INTO adjustment_approvals (id, nguoi_duyet) VALUES (gen_random_uuid(), 'Tran Thi B');
INSERT INTO maintenance_plans (id, loai_bao_tri) VALUES (gen_random_uuid(), 'DINH_KY');

-- A NOT NULL audit column holding a username. V90 cannot null this one out — the
-- constraint would reject it — so it has to fall back to the nil UUID. This is the
-- shape that stopped the UAT deploy at version 89.
CREATE TABLE approval_history (
    id          BIGSERIAL PRIMARY KEY,
    approved_by VARCHAR(100) NOT NULL,
    result      VARCHAR(30)
);
INSERT INTO approval_history (approved_by, result) VALUES ('admin', 'APPROVED');
INSERT INTO approval_history (approved_by, result)
VALUES ('1dfc226c-d31b-4089-93ff-86c646b94129', 'APPROVED');
