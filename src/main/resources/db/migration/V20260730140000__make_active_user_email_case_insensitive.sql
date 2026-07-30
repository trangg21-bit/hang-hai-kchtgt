-- Email của tài khoản đang hoạt động là duy nhất, không phân biệt chữ hoa/chữ thường.
-- Chuẩn hóa dữ liệu trước khi tạo unique index để các lần kiểm tra từ API và DB nhất quán.
UPDATE app_users
SET email = LOWER(BTRIM(email))
WHERE email IS NOT NULL
  AND email <> LOWER(BTRIM(email));

DROP INDEX IF EXISTS uk_app_users_email;
CREATE UNIQUE INDEX uk_app_users_email_case_insensitive
    ON app_users (LOWER(email))
    WHERE deleted_at IS NULL;
