-- Ensure password column exists on app_users
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- Update admin user password to BCrypt hash for 'admin123'
UPDATE app_users 
SET password = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQiy3aC', status = 1 
WHERE username = 'admin';

