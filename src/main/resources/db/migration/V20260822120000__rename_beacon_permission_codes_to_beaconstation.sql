-- V20260822120000: Rename beacon permission codes from beaconlight:* to beaconstation:*
--
-- Companion to the code rename of the screen "Quản lý Đèn biển và nhà trạm gắn với Đèn biển"
-- (M-023): /api/beacon-lights -> /api/beacon-stations, BeaconLight* -> BeaconStation*,
-- permission resource "beaconlight" -> "beaconstation".
--
-- PermissionAuthorizationManager compares the literals in @PreAuthorize against the
-- effective permission set of the user, so ALL stores that hold the codes must move
-- together (same rule as V87/V88). Four stores:
--   1. permissions.code                 (catalog of permission definitions)
--   2. permissions.resource             (first segment of the code, kept in sync)
--   3. user_group_permissions.permission (free-text copy per group grant)
--   4. user_permission_override.permission_code (free-text copy per direct user grant,
--      added by V20260812200000, so it did not exist when V87/V88 were written)
--
-- SAFE & IDEMPOTENT: each statement rewrites only rows still holding the old prefix,
-- so re-running is a no-op. The code rename is guarded against colliding with an
-- English code that already exists (uk_permission_code is unique).

-- 1. permissions.code — skip any row whose English target is already taken.
DO $$
DECLARE
    r RECORD;
    new_code TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
        RETURN;
    END IF;

    FOR r IN
        SELECT id, code FROM permissions
        WHERE code LIKE 'beaconlight:%'
    LOOP
        new_code := 'beaconstation:' || substring(r.code FROM length('beaconlight:') + 1);
        IF EXISTS (SELECT 1 FROM permissions p WHERE p.code = new_code AND p.id <> r.id) THEN
            RAISE NOTICE 'V20260822120000: skipping % - target % already exists', r.code, new_code;
        ELSE
            UPDATE permissions SET code = new_code WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- 2. permissions.resource — the first segment, kept consistent with code.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'permissions' AND column_name = 'resource') THEN
        UPDATE permissions SET resource = 'beaconstation' WHERE resource = 'beaconlight';
    END IF;
END $$;

-- 3. user_group_permissions.permission — per-group free-text copy of the codes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'user_group_permissions') THEN
        UPDATE user_group_permissions
           SET permission = 'beaconstation:' || substring(permission FROM length('beaconlight:') + 1)
         WHERE permission LIKE 'beaconlight:%';
    END IF;
END $$;

-- 4. user_permission_override.permission_code — per-user free-text copy of the codes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'user_permission_override')
       AND EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'user_permission_override' AND column_name = 'permission_code') THEN
        UPDATE user_permission_override
           SET permission_code = 'beaconstation:' || substring(permission_code FROM length('beaconlight:') + 1)
         WHERE permission_code LIKE 'beaconlight:%';
    END IF;
END $$;
