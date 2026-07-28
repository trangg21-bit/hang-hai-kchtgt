-- Fix for email unique constraint (to support soft-delete reuse)
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS uk4vj92ux8a2eehds1mdvmks473;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS uk_app_users_email;
DROP INDEX IF EXISTS uk_app_users_email;
CREATE UNIQUE INDEX uk_app_users_email ON app_users (email) WHERE deleted_at IS NULL;

-- Fix for username unique constraint (to support soft-delete reuse)
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS uk3k4cplvh82srueuttfkwnylq0;
ALTER TABLE app_users DROP CONSTRAINT IF EXISTS uk_app_users_username;
DROP INDEX IF EXISTS uk_app_users_username;
CREATE UNIQUE INDEX uk_app_users_username ON app_users (username) WHERE deleted_at IS NULL;
