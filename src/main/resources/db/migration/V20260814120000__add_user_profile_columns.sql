-- TRI-1786681457834-5887: F-001 user profile columns (all nullable, no default, no index)
ALTER TABLE app_users ADD COLUMN address VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN department VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN position VARCHAR(100) NULL;
ALTER TABLE app_users ADD COLUMN note VARCHAR(500) NULL;
