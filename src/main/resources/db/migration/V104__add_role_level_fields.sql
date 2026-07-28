-- V104: Add level, is_system, hierarchy_depth to app_roles (F-275 Phân quyền 3 mức)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_roles') THEN
        RAISE NOTICE 'V104: app_roles does not exist — skipping';
        RETURN;
    END IF;

    ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 99;
    ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE app_roles ADD COLUMN IF NOT EXISTS hierarchy_depth INTEGER NOT NULL DEFAULT 0;

    UPDATE app_roles SET level = 0, is_system = true,  hierarchy_depth = 0 WHERE code = 'SYSTEM_ADMIN';
    UPDATE app_roles SET level = 1, is_system = false, hierarchy_depth = 0 WHERE code = 'ADMIN';
    UPDATE app_roles SET level = 3, is_system = false, hierarchy_depth = 0 WHERE code IN ('MANAGER', 'USER', 'VIEWER');
END $$;
