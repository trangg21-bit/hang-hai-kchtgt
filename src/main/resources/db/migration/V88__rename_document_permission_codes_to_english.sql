-- V88: Rename the document module's Vietnamese permission codes to English.
--
-- Companion to the code change in document/controller/*Controller.java. As with
-- V87, PermissionAuthorizationManager compares the literals in @PreAuthorize
-- against permissions.code, so the rows have to move with the code.
--
-- These codes were also malformed: Permission.code is validated against
-- ^[a-z][a-z0-9]*:[a-z][a-z0-9]*$, which rejects both the hyphens and the third
-- segment ("document:quy-hoach:create"). Rows in that shape could never have been
-- persisted, so in practice only administrators — who bypass the permission check
-- entirely — could reach these endpoints. The new codes are well-formed, which
-- means the permissions can finally be granted to ordinary roles.
--
--   document:quy-hoach:*   -> portplanning:*
--   document:su-co:*       -> incident:*
--   document:bao-tri:*     -> maintenanceplan:*
--   document:van-hanh:*    -> operationplan:*
--   document:dieu-chinh:*  -> planningadjustment:*
--
-- SAFE & IDEMPOTENT: only rows still holding an old code are rewritten, and a
-- rename is skipped if its English target already exists (uk_permission_code).

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
        WHERE code LIKE 'document:quy-hoach:%'  OR code LIKE 'document:su-co:%'
           OR code LIKE 'document:bao-tri:%'    OR code LIKE 'document:van-hanh:%'
           OR code LIKE 'document:dieu-chinh:%'
    LOOP
        new_code := replace(replace(replace(replace(replace(
                        r.code,
                        'document:quy-hoach:',  'portplanning:'),
                        'document:su-co:',      'incident:'),
                        'document:bao-tri:',    'maintenanceplan:'),
                        'document:van-hanh:',   'operationplan:'),
                        'document:dieu-chinh:', 'planningadjustment:');

        IF EXISTS (SELECT 1 FROM permissions p WHERE p.code = new_code AND p.id <> r.id) THEN
            RAISE NOTICE 'V88: skipping % - target % already exists', r.code, new_code;
        ELSE
            UPDATE permissions SET code = new_code WHERE id = r.id;
        END IF;
    END LOOP;
END $$;

-- Keep permissions.resource aligned with the first segment of the new codes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'permissions' AND column_name = 'resource') THEN
        UPDATE permissions SET resource = 'portplanning'       WHERE code LIKE 'portplanning:%';
        UPDATE permissions SET resource = 'incident'           WHERE code LIKE 'incident:%';
        UPDATE permissions SET resource = 'maintenanceplan'    WHERE code LIKE 'maintenanceplan:%';
        UPDATE permissions SET resource = 'operationplan'      WHERE code LIKE 'operationplan:%';
        UPDATE permissions SET resource = 'planningadjustment' WHERE code LIKE 'planningadjustment:%';
    END IF;
END $$;

-- Per-group free-text copy of the codes.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_name = 'user_group_permissions') THEN
        UPDATE user_group_permissions
           SET permission = replace(replace(replace(replace(replace(
                                permission,
                                'document:quy-hoach:',  'portplanning:'),
                                'document:su-co:',      'incident:'),
                                'document:bao-tri:',    'maintenanceplan:'),
                                'document:van-hanh:',   'operationplan:'),
                                'document:dieu-chinh:', 'planningadjustment:')
         WHERE permission LIKE 'document:quy-hoach:%'  OR permission LIKE 'document:su-co:%'
            OR permission LIKE 'document:bao-tri:%'    OR permission LIKE 'document:van-hanh:%'
            OR permission LIKE 'document:dieu-chinh:%';
    END IF;
END $$;
