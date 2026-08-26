-- Reset password for admin@hh.gov.vn to default password 'admin123'
UPDATE app_users 
SET password = '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07Xd00DMxs.AQiy3aC', status = 1 
WHERE LOWER(email) = 'admin@hh.gov.vn' OR username = 'admin' OR LOWER(email) = 'admin@hanghai.vn';
