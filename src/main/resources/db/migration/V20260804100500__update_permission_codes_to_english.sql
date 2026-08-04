-- V20260804100500: Standardize permission codes to 100% English, clean up duplicates & fix column types
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Ensure approval_history.approved_date is TIMESTAMP WITHOUT TIME ZONE
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_history' AND column_name = 'approved_date') THEN
        ALTER TABLE public.approval_history ALTER COLUMN approved_date TYPE TIMESTAMP WITHOUT TIME ZONE USING approved_date::timestamp;
    END IF;

    -- Process each legacy prefix mapping (legacy_prefix, new_prefix)
    FOR rec IN 
        SELECT 'cosuachua:' AS legacy_prefix, 'shiprepair:' AS new_prefix UNION ALL
        SELECT 'tramradar:', 'radarstation:' UNION ALL
        SELECT 'luonghanghai:', 'navigationchannel:' UNION ALL
        SELECT 'deke:', 'dikerevetment:'
    LOOP
        IF EXISTS (SELECT 1 FROM permissions WHERE code LIKE rec.legacy_prefix || '%') THEN
            -- Step 1: Remove role_permissions for p_old where role already has p_new
            DELETE FROM role_permissions rp
            USING permissions p_old, permissions p_new
            WHERE rp.permission_id = p_old.id
              AND p_old.code LIKE rec.legacy_prefix || '%'
              AND p_new.code = REPLACE(p_old.code, rec.legacy_prefix, rec.new_prefix)
              AND EXISTS (
                  SELECT 1 FROM role_permissions rp_existing
                  WHERE rp_existing.role_id = rp.role_id
                    AND rp_existing.permission_id = p_new.id
              );

            -- Step 2: Re-point remaining role_permissions from p_old to p_new
            UPDATE role_permissions rp
            SET permission_id = p_new.id
            FROM permissions p_old
            JOIN permissions p_new ON p_new.code = REPLACE(p_old.code, rec.legacy_prefix, rec.new_prefix)
            WHERE rp.permission_id = p_old.id
              AND p_old.code LIKE rec.legacy_prefix || '%';

            -- Step 3: Delete p_old from permissions table
            DELETE FROM permissions WHERE code LIKE rec.legacy_prefix || '%';
        END IF;
    END LOOP;

    -- Also update any remaining legacy codes if p_new did not exist yet (rename in-place)
    UPDATE permissions SET code = REPLACE(code, 'cosuachua:', 'shiprepair:') WHERE code LIKE 'cosuachua:%';
    UPDATE permissions SET code = REPLACE(code, 'tramradar:', 'radarstation:') WHERE code LIKE 'tramradar:%';
    UPDATE permissions SET code = REPLACE(code, 'luonghanghai:', 'navigationchannel:') WHERE code LIKE 'luonghanghai:%';
    UPDATE permissions SET code = REPLACE(code, 'deke:', 'dikerevetment:') WHERE code LIKE 'deke:%';

    -- Fix description typo if any
    UPDATE permissions SET name = 'Phê duyệt C2 cơ sở sửa chữa' WHERE name LIKE '%cơ sở chữa chạy%';
END $$;
