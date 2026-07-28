-- V20260728110000: Ensure SYSTEM_ADMIN role has ALL permissions.
-- Fixes the case where the RolePermissionSeeder skipped because roles already existed
-- but permissions were added later (F-275, M-003, etc.).

DO $$
DECLARE
    sys_admin_id UUID;
    perm RECORD;
BEGIN
    -- Skip if app_roles or permissions tables don't exist (e.g. empty fixture)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_roles') THEN
        RAISE NOTICE 'V20260728110000: app_roles does not exist — skipping';
        RETURN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'permissions') THEN
        RAISE NOTICE 'V20260728110000: permissions does not exist — skipping';
        RETURN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
        RAISE NOTICE 'V20260728110000: role_permissions does not exist — skipping';
        RETURN;
    END IF;

    SELECT id INTO sys_admin_id FROM app_roles WHERE code = 'ROLE_SYSTEM_ADMIN';
    IF sys_admin_id IS NULL THEN
        RAISE NOTICE 'V20260728110000: ROLE_SYSTEM_ADMIN does not exist — skipping';
        RETURN;
    END IF;

    FOR perm IN SELECT id, code FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (sys_admin_id, perm.id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END LOOP;

    RAISE NOTICE 'V20260728110000: Granted all permissions to ROLE_SYSTEM_ADMIN';
END $$;
