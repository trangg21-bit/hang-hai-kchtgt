-- V87: Rename Vietnamese permission codes of the port domain to English.
--
-- Must accompany the code change in port/controller/*Controller.java, where
-- @PreAuthorize("@auth.check(authentication, '<code>')") now passes the English
-- codes. PermissionAuthorizationManager compares those literals against the codes
-- stored in the database, so leaving the rows untouched would deny every request.
--
--   cangbien -> port        bencang  -> berth      cangcan -> dryport
--   caucang  -> pier        vungnuoc -> waterzone
--
-- Two places store the codes:
--   1. permissions.code (+ permissions.resource, kept in sync)
--   2. user_group_permissions.permission (free-text copy per group)
--
-- SAFE & IDEMPOTENT: each statement rewrites only rows still holding the old
-- prefix, so re-running is a no-op. Guarded against colliding with an English
-- code that already exists (uk_permission_code is unique).

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
        WHERE code LIKE 'cangbien:%' OR code LIKE 'bencang:%'
           OR code LIKE 'cangcan:%'  OR code LIKE 'caucang:%'
           OR code LIKE 'vungnuoc:%'
    LOOP
        new_code := replace(replace(replace(replace(replace(
                        r.code,
                        'cangbien:', 'port:'),
                        'bencang:',  'berth:'),
                        'cangcan:',  'dryport:'),
                        'caucang:',  'pier:'),
                        'vungnuoc:', 'waterzone:');

        IF EXISTS (SELECT 1 FROM permissions p WHERE p.code = new_code AND p.id <> r.id) THEN
            RAISE NOTICE 'V87: skipping % - target % already exists', r.code, new_code;
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
        UPDATE permissions SET resource = 'port'      WHERE resource = 'cangbien';
        UPDATE permissions SET resource = 'berth'     WHERE resource = 'bencang';
        UPDATE permissions SET resource = 'dryport'   WHERE resource = 'cangcan';
        UPDATE permissions SET resource = 'pier'      WHERE resource = 'caucang';
        UPDATE permissions SET resource = 'waterzone' WHERE resource = 'vungnuoc';
    END IF;
END $$;

-- 3. user_group_permissions.permission — per-group free-text copy of the codes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'user_group_permissions') THEN
        UPDATE user_group_permissions
           SET permission = replace(replace(replace(replace(replace(
                                permission,
                                'cangbien:', 'port:'),
                                'bencang:',  'berth:'),
                                'cangcan:',  'dryport:'),
                                'caucang:',  'pier:'),
                                'vungnuoc:', 'waterzone:')
         WHERE permission LIKE 'cangbien:%' OR permission LIKE 'bencang:%'
            OR permission LIKE 'cangcan:%'  OR permission LIKE 'caucang:%'
            OR permission LIKE 'vungnuoc:%';
    END IF;
END $$;
