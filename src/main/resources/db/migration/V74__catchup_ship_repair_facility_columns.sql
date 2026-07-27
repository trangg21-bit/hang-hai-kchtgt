-- V74: Catch-up column renames for ship_repair_facility
-- If V73 was already applied, this does nothing (idempotent).
-- If V73 was not applied, this renames old columns or copies data.

DO $$
DECLARE
    old_col TEXT;
    new_col TEXT;
BEGIN
    FOR old_col, new_col IN
        VALUES
            ('phe_duyet_c1',       'approved_level1'),
            ('nguoi_phe_duyet_c1', 'approver_level1'),
            ('ngay_phe_duyet_c1',  'approved_date_level1'),
            ('phe_duyet_c2',       'approved_level2'),
            ('nguoi_phe_duyet_c2', 'approver_level2'),
            ('ngay_phe_duyet_c2',  'approved_date_level2'),
            ('ly_do_tu_choi',      'rejection_reason'),
            ('ten_co_so',          'facility_name'),
            ('dia_chi',            'address'),
            ('tinh_thanh',         'province'),
            ('so_dien_thoai',      'phone'),
            ('loai_co_so',         'facility_type'),
            ('kha_nang',           'capacity'),
            ('chu_quan',           'authority'),
            ('trang_thai',         'approval_status'),
            ('nguoi_tao',          'created_by'),
            ('ngay_tao',           'created_date'),
            ('nguoi_sua_doi',      'updated_by'),
            ('ngay_sua_doi',       'updated_date')
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = old_col) THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility' AND column_name = new_col) THEN
                EXECUTE format('ALTER TABLE ship_repair_facility RENAME COLUMN %I TO %I', old_col, new_col);
            ELSE
                EXECUTE format('UPDATE ship_repair_facility SET %I = COALESCE(%I, %I)', new_col, old_col, new_col);
                EXECUTE format('ALTER TABLE ship_repair_facility DROP COLUMN %I', old_col);
            END IF;
        END IF;
    END LOOP;
END $$;

-- Fix FK column in attachment table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility_attachment' AND column_name = 'co_sua_chua_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ship_repair_facility_attachment' AND column_name = 'ship_repair_facility_id') THEN
            ALTER TABLE ship_repair_facility_attachment RENAME COLUMN co_sua_chua_id TO ship_repair_facility_id;
        END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'co_sua_chua_id') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'phe_duyet_lich_su' AND column_name = 'ship_repair_facility_id') THEN
            ALTER TABLE phe_duyet_lich_su RENAME COLUMN co_sua_chua_id TO ship_repair_facility_id;
        END IF;
    END IF;
END $$;

-- Rename index
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_co_sua_chua_dong_tau_org_unit')
       AND NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ship_repair_facility_org_unit') THEN
        ALTER INDEX idx_co_sua_chua_dong_tau_org_unit RENAME TO idx_ship_repair_facility_org_unit;
    END IF;
END $$;

-- Recreate FKs
ALTER TABLE ship_repair_facility_attachment DROP CONSTRAINT IF EXISTS fk_co_sua_chua_attachment;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_ship_repair_facility_attachment') THEN
        ALTER TABLE ship_repair_facility_attachment ADD CONSTRAINT fk_ship_repair_facility_attachment FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
    END IF;
END $$;

ALTER TABLE phe_duyet_lich_su DROP CONSTRAINT IF EXISTS fk_phe_duyet_lich_su_cosuachua;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_phe_duyet_lich_su_ship_repair') THEN
        ALTER TABLE phe_duyet_lich_su ADD CONSTRAINT fk_phe_duyet_lich_su_ship_repair FOREIGN KEY (ship_repair_facility_id) REFERENCES ship_repair_facility(id);
    END IF;
END $$;
