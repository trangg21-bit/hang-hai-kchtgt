-- V89: Bring the last malformed permission codes into the documented format.
--
-- Permission.code is validated against ^[a-z][a-z0-9]*:[a-z][a-z0-9]*$. These
-- codes broke it three different ways — a hyphen in the action segment, dots
-- instead of a colon, and a third segment — so none of them could ever be stored
-- in the permissions table. @auth.check therefore always denied them for regular
-- users, leaving the endpoints reachable only by administrators (who bypass the
-- check). Renaming makes the permissions grantable again.
--
--   asset:<entity>-<kind>  -> <entity><kind>:manage
--   gis.point.<action>     -> gispoint:<action>   (edit -> update, view -> read)
--   group:member:manage    -> groupmember:manage
--
-- SAFE & IDEMPOTENT: only rows still holding an old code are rewritten, and a
-- rename is skipped when its target already exists (uk_permission_code).

DO $$
DECLARE
    mapping CONSTANT TEXT[][] := ARRAY[
        ['asset:approval-record',     'approvalrecord:manage'],
        ['asset:asset-exploitation',  'assetexploitation:manage'],
        ['asset:decrease-request',    'assetdecrease:manage'],
        ['asset:increase-request',    'assetincrease:manage'],
        ['asset:infra-asset',         'infraasset:manage'],
        ['asset:inventory-asset',     'inventoryasset:manage'],
        ['asset:inventory-plan',      'inventoryplan:manage'],
        ['asset:inventory-report',    'inventoryreport:manage'],
        ['asset:movement-request',    'movementrequest:manage'],
        ['asset:processing-record',   'processingrecord:manage'],
        ['gis.point.create',          'gispoint:create'],
        ['gis.point.delete',          'gispoint:delete'],
        ['gis.point.edit',            'gispoint:update'],
        ['gis.point.view',            'gispoint:read'],
        ['group:member:manage',       'groupmember:manage']
    ];
    old_code TEXT;
    new_code TEXT;
    i INT;
BEGIN
    FOR i IN 1 .. array_length(mapping, 1) LOOP
        old_code := mapping[i][1];
        new_code := mapping[i][2];

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'permissions') THEN
            IF EXISTS (SELECT 1 FROM permissions WHERE code = new_code) THEN
                RAISE NOTICE 'V89: skipping % - target % already exists', old_code, new_code;
            ELSE
                UPDATE permissions
                   SET code = new_code,
                       resource = split_part(new_code, ':', 1),
                       action = split_part(new_code, ':', 2)
                 WHERE code = old_code;
            END IF;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_group_permissions') THEN
            UPDATE user_group_permissions SET permission = new_code WHERE permission = old_code;
        END IF;
    END LOOP;
END $$;
