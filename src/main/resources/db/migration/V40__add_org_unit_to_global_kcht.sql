-- V40: Add org_unit_id column to de_ke, luong_hang_hai, co_sua_chua_dong_tau, he_thong_vts, tram_radar

-- 1. Add column to tables
ALTER TABLE de_ke ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE luong_hang_hai ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE co_sua_chua_dong_tau ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE he_thong_vts ADD COLUMN IF NOT EXISTS org_unit_id UUID;
ALTER TABLE tram_radar ADD COLUMN IF NOT EXISTS org_unit_id UUID;

-- 2. Populate existing records with root organization unit ID
DO $$
DECLARE
    root_org_id UUID;
BEGIN
    SELECT id INTO root_org_id FROM org_units WHERE parent_id IS NULL AND deleted_at IS NULL LIMIT 1;
    IF root_org_id IS NOT NULL THEN
        UPDATE de_ke SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
        UPDATE luong_hang_hai SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
        UPDATE co_sua_chua_dong_tau SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
        UPDATE he_thong_vts SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
        UPDATE tram_radar SET org_unit_id = root_org_id WHERE org_unit_id IS NULL;
    END IF;
END $$;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_de_ke_org_unit ON de_ke(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_luong_hang_hai_org_unit ON luong_hang_hai(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_co_sua_chua_dong_tau_org_unit ON co_sua_chua_dong_tau(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_he_thong_vts_org_unit ON he_thong_vts(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_tram_radar_org_unit ON tram_radar(org_unit_id);
