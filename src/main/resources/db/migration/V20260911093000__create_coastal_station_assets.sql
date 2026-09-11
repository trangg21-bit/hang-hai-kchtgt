-- ==============================================================================
-- Migration: Create dedicated tables for:
-- 1. Tai san Dai Thong tin Duyen hai (TTDH)
-- 2. Tai san Dai Inmarsat
-- Tables:
--   - coastal_station_assets (Master table for both TTDH & Inmarsat assets)
--   - coastal_station_asset_exploitations (Tab 4: Khai thac tai san)
--   - coastal_station_asset_adjustments (Tab 5: Tang/Giam nguyen gia & Bien dong)
-- Strict adherence to 94-field matrix and approval workflow conventions.
-- ==============================================================================

-- 1. MASTER TABLE: coastal_station_assets
CREATE TABLE IF NOT EXISTS coastal_station_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- TAB 1: Thong tin chung & Dinh danh
    asset_code VARCHAR(50) UNIQUE NOT NULL,                       -- STT 6: Ma tai san (Tu sinh, TS-TTDH-xxx / TS-INM-xxx)
    asset_name VARCHAR(200) NOT NULL,                             -- STT 7: Ten tai san
    parent_org_unit_id UUID,                                      -- STT 1: Co quan quan ly cap tren
    org_unit_id UUID,                                             -- STT 2: Don vi quan ly (Bat buoc)
    using_org_unit_id UUID,                                       -- STT 3: Don vi su dung
    station_id UUID,                                              -- STT 4: Ma dai (Lien ket dai cha: dai_ttdh hoac coastal_station_inmarsat)
    dai_ttdh_id UUID,                                             -- Khoa ngoai ro nghia cho Dai TTDH
    inmarsat_id UUID,                                             -- Khoa ngoai ro nghia cho Dai Inmarsat
    asset_type VARCHAR(100) NOT NULL DEFAULT 'Tài sản đài TTDH',  -- STT 5: Loai tai san ('Tài sản đài TTDH' / 'Tài sản đài Inmarsat')
    barcode VARCHAR(100),                                         -- STT 8: Barcode
    asset_condition VARCHAR(100) DEFAULT 'Tốt',                   -- STT 9: Tinh trang tai san ('Tốt', 'Hư hỏng cần sửa chữa', 'Không sử dụng được')
    usage_status VARCHAR(100) DEFAULT 'Đang sử dụng',             -- STT 10: Hien trang su dung ('Đang sử dụng', 'Chưa sử dụng', 'Tạm dừng')
    asset_group VARCHAR(200),                                     -- STT 11: Nhom tai san ('Nhà CTXD', 'Máy móc thiết bị', 'Khác')
    asset_subgroup VARCHAR(200),                                  -- STT 12: Phan nhom tai san
    address VARCHAR(500),                                         -- STT 13: Dia chi
    origin VARCHAR(200),                                          -- STT 14: Nguon goc ('Mua sắm', 'ĐTXD', 'Tiếp nhận', 'Khác')
    
    -- TAB 1: Chi so tong hop & Ky thuat
    quantity NUMERIC(15,3) DEFAULT 1,                             -- STT 15: So luong
    quantity_unit VARCHAR(50) DEFAULT 'Bộ',                       -- STT 16: Don vi tinh so luong
    model VARCHAR(100),                                           -- STT 17: Model
    serial_number VARCHAR(100),                                   -- STT 18: Serial
    country_of_origin VARCHAR(100),                               -- STT 19: Xuat xu
    manufacturer VARCHAR(200),                                    -- STT 20: Hang san xuat
    construction_year INTEGER,                                    -- STT 21: Nam xay dung (YYYY)
    use_date DATE,                                                -- STT 22: Ngay su dung tai san
    land_area NUMERIC(15,3),                                      -- STT 23: Dien tich dat (m2)
    floor_area NUMERIC(15,3),                                     -- STT 24: Dien tich san su dung (m2)
    asset_location VARCHAR(500),                                  -- STT 25: Vi tri tai san
    
    -- TAB 2: Ho so tai san
    attachment_name VARCHAR(500),                                 -- STT 26: Ten file dinh kem
    
    -- TAB 3: Thong tin chi tiet (Tai chinh & Khau hao)
    declaration_date DATE,                                        -- STT 27: Ngay ke khai tai san
    original_value NUMERIC(15,2) DEFAULT 0,                       -- STT 28: Nguyen gia (nguon ngan sach, khac)
    depreciation_rate NUMERIC(7,4) DEFAULT 0,                     -- STT 29: Ty le hao mon/khau hao (%)
    remaining_value NUMERIC(15,2) DEFAULT 0,                      -- STT 30: Gia tri con lai (Tu dong tinh)
    currency VARCHAR(20) DEFAULT 'VNĐ',                           -- STT 31: Don vi tinh gia tri (Mac dinh VNĐ)
    assignment_decision_number VARCHAR(200),                      -- STT 32: So quyet dinh giao (bao gom ca tang von)
    depreciation_start_date DATE,                                 -- STT 33: Ngay tinh khau hao
    depreciation_months INTEGER DEFAULT 0,                        -- STT 34: So thang tinh khau hao
    depreciation_end_date DATE,                                   -- STT 35: Ngay het khau hao
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,             -- STT 36: Khau hao luy ke
    monthly_depreciation NUMERIC(15,2) DEFAULT 0,                 -- STT 37: Khau hao thang (Tu tinh)
    disposal_method VARCHAR(200),                                 -- STT 38: Hinh thuc xu ly tai san
    
    -- TAB 6: Xu ly & Theo doi phe duyet 2 cap
    status VARCHAR(50) DEFAULT 'MANAGED',
    approval_status INTEGER DEFAULT 0,                            -- STT 84: Trang thai phe duyet (0: Luu tam, 1: Cho CV duyet, 2: Cho Cuc duyet, 3: Da duyet, 4: CV tu choi, 5: Cuc tu choi)
    submitted_by UUID,                                            -- STT 88: Can bo gui phe duyet
    submitted_at TIMESTAMPTZ,                                     -- STT 87: Ngay gui phe duyet
    port_authority_approved_by UUID,                              -- STT 90: Can bo Cang vu/Chi cuc duyet
    port_authority_approved_at TIMESTAMPTZ,                       -- STT 89: Ngay Cang vu/Chi cuc duyet
    port_authority_approval_content VARCHAR(1000),                -- STT 91: Noi dung Cang vu duyet
    department_approved_by UUID,                                  -- STT 93: Can bo Cuc duyet
    department_approved_at TIMESTAMPTZ,                           -- STT 92: Ngay Cuc duyet
    department_approval_content VARCHAR(1000),                    -- STT 94: Noi dung Cuc duyet
    rejection_reason VARCHAR(1000),                               -- Ly do tu choi (neu co)
    
    -- Audit & System fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,             -- STT 86: Ngay cap nhat
    created_by UUID,
    updated_by UUID,                                              -- STT 85: Can bo cap nhat
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    lock_version INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for coastal_station_assets
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_org ON coastal_station_assets(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_using_org ON coastal_station_assets(using_org_unit_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_station_id ON coastal_station_assets(station_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_dai_ttdh_id ON coastal_station_assets(dai_ttdh_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_inmarsat_id ON coastal_station_assets(inmarsat_id);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_asset_type ON coastal_station_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_approval_status ON coastal_station_assets(approval_status);
CREATE INDEX IF NOT EXISTS idx_coastal_station_assets_deleted_at ON coastal_station_assets(deleted_at) WHERE deleted_at IS NULL;


-- 2. CHILD TABLE: coastal_station_asset_exploitations (TAB 4: Khai thac tai san)
CREATE TABLE IF NOT EXISTS coastal_station_asset_exploitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES coastal_station_assets(id) ON DELETE CASCADE,
    operator_org_unit_id UUID,                                    -- STT 39: Don vi khai thac
    asset_category VARCHAR(200),                                  -- STT 40: Danh muc tai san
    unit_of_measure VARCHAR(50) DEFAULT 'Bộ',                     -- STT 41: Don vi tinh
    quantity NUMERIC(15,3) DEFAULT 1,                             -- STT 42: So luong
    exploitation_deadline DATE,                                   -- STT 43: Thoi han khai thac
    total_revenue NUMERIC(15,2) DEFAULT 0,                        -- STT 44: Tong so tien thu duoc (VND)
    related_costs NUMERIC(15,2) DEFAULT 0,                        -- STT 45: Chi phi co lien quan (VND)
    state_budget_payment NUMERIC(15,2) DEFAULT 0,                 -- STT 46: Nop NSNN (VND)
    project_amount NUMERIC(15,2) DEFAULT 0,                       -- STT 47: So tien duoc thuc hien du an (VND)
    notes TEXT,                                                   -- STT 48: Ghi chu (khai thac)
    operating_time VARCHAR(200),
    exploitation_level VARCHAR(100),
    operating_cost NUMERIC(15,2) DEFAULT 0,
    maintenance_cost NUMERIC(15,2) DEFAULT 0,
    technical_status VARCHAR(100),
    exploitation_month INTEGER,
    exploitation_year INTEGER,
    description VARCHAR(1000),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,             -- STT 49: Ngay cap nhat
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                              -- STT 50: Can bo cap nhat
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_coastal_station_exploitations_asset_id 
ON coastal_station_asset_exploitations(asset_id);


-- 3. CHILD TABLE: coastal_station_asset_adjustments (TAB 5: Bien dong tang / giam nguyen gia)
CREATE TABLE IF NOT EXISTS coastal_station_asset_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES coastal_station_assets(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL,                         -- STT 51: Loai thay doi nguyen gia ('INCREASE' / 'DECREASE' / 'TANG' / 'GIAM')
    decision_number VARCHAR(200),                                 -- STT 52 & 69: So QD tang/giam nguyen gia / So QD giao
    decision_date DATE,                                           -- STT 53: Ngay ra QD tang/giam nguyen gia
    adjustment_date DATE,                                         -- STT 54: Ngay tang/giam nguyen gia
    adjustment_reason VARCHAR(200),                               -- STT 55: Ly do tang/giam nguyen gia
    notes VARCHAR(1000),                                          -- STT 56: Ghi chu (dieu chinh)
    original_value_before NUMERIC(15,2) DEFAULT 0,                -- STT 57: Nguyen gia truoc khi tang/giam
    original_value_after NUMERIC(15,2) DEFAULT 0,                 -- STT 58: Nguyen gia sau khi tang/giam
    remaining_value_before NUMERIC(15,2) DEFAULT 0,               -- STT 59: Gia tri con lai truoc khi tang/giam
    remaining_value_after NUMERIC(15,2) DEFAULT 0,                -- STT 60: Gia tri con lai sau khi tang/giam
    status VARCHAR(50) DEFAULT 'DRAFT',                           -- STT 63: Trang thai thay doi nguyen gia
    
    -- Thong tin chi tiet thay doi nguyen gia (khi xem 1 lan dieu chinh)
    declaration_date DATE,                                        -- STT 64: Ngay ke khai tai san
    adjusted_original_value NUMERIC(15,2) DEFAULT 0,              -- STT 65: Nguyen gia dieu chinh
    depreciation_rate NUMERIC(7,4) DEFAULT 0,                     -- STT 66: Ty le hao mon/Khau hao (%)
    remaining_value NUMERIC(15,2) DEFAULT 0,                      -- STT 67: Gia tri con lai
    currency VARCHAR(20) DEFAULT 'VNĐ',                           -- STT 68: Don vi tinh (Mac dinh VNĐ)
    assignment_decision_number VARCHAR(200),                      -- STT 69: So quyet dinh giao (bao gom ca tang von)
    depreciation_start_date DATE,                                 -- STT 70: Ngay tinh khau hao
    depreciation_months INTEGER DEFAULT 0,                        -- STT 71: So thang tinh khau hao
    depreciation_end_date DATE,                                   -- STT 72: Ngay het khau hao
    accumulated_depreciation NUMERIC(15,2) DEFAULT 0,             -- STT 73: Khau hao luy ke
    monthly_depreciation NUMERIC(15,2) DEFAULT 0,                 -- STT 74: Khau hao thang
    disposal_method VARCHAR(200),                                 -- STT 75: Hinh thuc xu ly tai san
    
    -- Thong tin phe duyet thay doi nguyen gia
    submitted_at TIMESTAMPTZ,                                     -- STT 76: Ngay gui phe duyet
    submitted_by UUID,                                            -- STT 77: Can bo gui phe duyet
    port_authority_approved_at TIMESTAMPTZ,                       -- STT 78: Ngay phe duyet cap Cang vu/Chi cuc
    port_authority_approved_by UUID,                              -- STT 79: Can bo phe duyet cap Cang vu/Chi cuc
    port_authority_approval_content VARCHAR(1000),                -- STT 80: Noi dung phe duyet Cang vu
    department_approved_at TIMESTAMPTZ,                           -- STT 81: Ngay phe duyet cap Cuc
    department_approved_by UUID,                                  -- STT 82: Can bo phe duyet cap Cuc
    department_approval_content VARCHAR(1000),                    -- STT 83: Noi dung phe duyet Cuc
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,             -- STT 61: Ngay cap nhat
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,                                              -- STT 62: Can bo cap nhat
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_coastal_station_adjustments_asset_id 
ON coastal_station_asset_adjustments(asset_id);
