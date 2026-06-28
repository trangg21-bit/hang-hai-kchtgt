---
id: F-271
name: Đăng ký tài khoản
slug: dang-ky-tai-khoan
module-id: M-010
status: implemented
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: qa
---
# Feature: Đăng ký tài khoản

## Description
Tính năng cho phép người dùng mới tạo tài khoản xác thực trong hệ thống Hang Hải KHTKT thông qua email hoặc số điện thoại, kèm mật khẩu được mã hóa bằng bcrypt/argon2 theo chính sách mật khẩu (F-276). Quá trình bao gồm xác nhận định dạng thông tin liên lạc, validate mật khẩu đáp ứng yêu cầu độ phức tạp, tạo salt và hash mật khẩu, lưu user vào cơ sở dữ liệu với trạng thái ACTIVE, sau đó chuyển sang flow đăng nhập lần đầu (F-272) để thiết lập TOTP.

## Business Intent
Cung cấp kênh tiếp cận an toàn và tiêu chuẩn để người dùng mới tham gia hệ thống Hang Hải KHTKT, đảm bảo mỗi tài khoản được xác thực qua thông tin liên lạc duy nhất (email hoặc số điện thoại), mật khẩu đáp ứng tiêu chuẩn bảo mật tối thiểu, và có ràng buộc duy nhất trên email/số điện thoại để ngăn trùng lặp tài khoản. Đây là bước đầu tiên trong chuỗi xác thực 3 giai đoạn: đăng ký → đăng nhập lần đầu (F-272) → đăng nhập thường xuyên (F-273).

## Flow Summary
```
1. Người dùng truy cập trang đăng ký → nhập email hoặc số điện thoại + mật khẩu (xác nhận mật khẩu)
2. Client-side validate: kiểm tra định dạng email/sĐT, độ dài mật khẩu ≥ 12 ký tự
3. Client gửi request POST /api/auth/register với payload: { email/sĐT, password }
4. Server kiểm tra uniqueness: email/sĐT chưa tồn tại trong hệ thống
5. Server validate password theo chính sách F-276 (complexity, history — chưa áp dụng cho đăng ký mới)
6. Server sinh salt ngẫu nhiên ≥ 16 bytes, hash mật khẩu bằng bcrypt (work factor ≥ 12) hoặc argon2
7. Tạo User entity mới với status=ACTIVE, totp_enabled=false, failed_login_count=0
8. Ghi log audit vào bảng AuditLog (action='register', ip_address, user_agent)
9. Trả về HTTP 201 với thông báo "Đăng ký thành công, vui lòng đăng nhập"
10. Redirect user sang trang đăng nhập (F-272) — lần đăng nhập đầu tiên sẽ yêu cầu setup TOTP
```

## Acceptance Criteria
- Người dùng có thể đăng ký thành công với email hoặc số điện thoại hợp lệ, mật khẩu đáp ứng chính sách F-276.
- Hệ thống reject đăng ký nếu email/số điện thoại đã tồn tại, trả về lỗi `EMAIL_ALREADY_EXISTS` hoặc `PHONE_ALREADY_EXISTS`.
- Mật khẩu được lưu trữ dưới dạng bcrypt/argon2 hash với salt ngẫu nhiên — không bao giờ lưu plaintext.
- User entity được tạo với trạng thái ACTIVE, totp_enabled=false, failed_login_count=0, và timestamp chính xác.
- Sau đăng ký thành công, audit log được ghi nhận đầy đủ (action, userId, ip, timestamp).
- Hệ thống không tiết lộ whether email/sĐT đã tồn tại nếu user nhập trùng (chung message "Sai thông tin") để chống enumeration.
- Rate limiting áp dụng: tối đa 5 request đăng ký mỗi IP trong 15 phút (tích hợp F-277).

## In Scope
- **Đăng ký qua email hoặc số điện thoại**: chấp nhận cả hai định dạng, validate theo regex chuẩn (email RFC 5322, sĐT Việt Nam +84 hoặc 0开头).
- **Mật khẩu complexity validation**: áp dụng chính sách F-276 (độ dài ≥ 12, chữ hoa, chữ thường, số, ký tự đặc biệt).
- **Hash mật khẩu**: bcrypt (work factor ≥ 12) hoặc argon2id, sinh salt ngẫu nhiên ≥ 16 bytes cho mỗi password.
- **Uniqueness check**: kiểm tra email/số điện thoại chưa tồn tại trong bảng User trước khi tạo.
- **User entity creation**: tạo bản ghi User với status=ACTIVE, totp_enabled=false, account_locked_until=NULL.
- **Audit logging**: ghi nhận mọi attempt đăng ký (success/fail) vào bảng AuditLog.
- **Response message chuẩn**: trả về message chung "Đăng ký thành công" hoặc "Thông tin đã tồn tại" — không lộ chi tiết.

## Out of Scope
- **Xác thực email/số điện thoại (email verification/OTP)**: không áp dụng xác thực hai bước qua email hoặc SMS tại bước đăng ký — chỉ xác thực qua TOTP khi đăng nhập (F-272).
- **Social login / OAuth / SSO**: Google, Facebook, Microsoft login không nằm trong scope của F-271.
- **Mật khẩu mạnh khuyến nghị (strength meter)**: có thể triển khai ở frontend UX nhưng không phải requirement bắt buộc.
- **User provisioning hàng loạt (bulk import)**: thuộc module quản lý admin riêng, không phải đăng ký cá nhân.
- **Tự động tạo username từ email**: username được thiết lập riêng sau đăng ký, không suy ra từ email.
- **KYC / identity verification**: xác thực danh tính thật không nằm trong phạm vi xác thực phân quyền.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| Unauthenticated (Guest) | POST /api/auth/register (tạo tài khoản mới) |
| User (sau đăng ký) | Truy cập hệ thống theo phân quyền F-275 sau khi hoàn tất F-272 (login + TOTP setup) |
| Admin | Xem danh sách user, tìm kiếm user theo email/sĐT, xem audit log đăng ký |
| Super Admin | Toàn quyền quản lý user, bao gồm force-delete hoặc suspend tài khoản |

## Entities
- **User**: id (UUID PK), email (VARCHAR 100 UNIQUE, nullable), phone (VARCHAR 20 UNIQUE, nullable), password_hash (VARCHAR 255 NOT NULL), totp_secret_hash (VARCHAR 64, nullable), totp_enabled (BOOLEAN DEFAULT false), role_id (FK → Role, nullable), status (VARCHAR 20, default 'ACTIVE'), failed_login_count (INT DEFAULT 0), account_locked_until (TIMESTAMP, nullable), created_at (TIMESTAMP), updated_at (TIMESTAMP) — mở rộng từ bảng User cơ sở, bổ sung các trường bảo mật và MFA.
- **PasswordHistory** (nếu F-276 áp dụng cho user đã tồn tại): id (UUID), user_id (FK → User), password_hash (VARCHAR 255), created_at (TIMESTAMP) — lưu N mật khẩu gần nhất để ngăn reuse.

## Business Rules
1. **(BR-271-001)** Email hoặc số điện thoại phải có định dạng hợp lệ và là duy nhất trong hệ thống — không cho phép đăng ký trùng thông tin liên lạc.
2. **(BR-271-002)** Mật khẩu phải đáp ứng chính sách F-276: tối thiểu 12 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt, không chứa username/email.
3. **(BR-271-003)** Mật khẩu chỉ được lưu dưới dạng bcrypt/argon2 hash với salt ≥ 16 bytes — không bao giờ lưu plaintext hoặc reversible encryption.
4. **(BR-271-004)** Mỗi User entity được tạo với status=ACTIVE, totp_enabled=false, failed_login_count=0, role_id=NULL (chờ gán role sau setup TOTP).
5. **(BR-271-005)** Mọi attempt đăng ký (thành công hoặc thất bại) phải được ghi vào AuditLog với đầy đủ metadata: action, user_id (nếu tồn tại), ip_address, user_agent, timestamp.
6. **(BR-271-006)** Không tiết lộ thông tin cụ thể về lý do từ chối (email đã tồn tại vs sai định dạng) — trả về message chung để chống user enumeration.
7. **(BR-271-007)** Rate limiting: tối đa 5 request POST /api/auth/register mỗi IP trong 15 phút — quá giới hạn → HTTP 429 Too Many Requests.

## Testing Strategy
- **Unit tests**: kiểm tra password hashing (bcrypt/argon2) với known salt → deterministic hash; validate email/phone regex; uniqueness check logic; password complexity validation theo từng rule BR-271-002.
- **Integration tests**: happy path — đăng ký với email hợp lệ + mật khẩu đạt policy → HTTP 201, user entity tồn tại trong DB với đúng trường; reject path — đăng ký với email đã tồn tại → HTTP 409 hoặc 400 với message chung; reject path — mật khẩu quá ngắn → HTTP 400 với mô tả chi tiết rule vi phạm.
- **E2E tests**: full flow — truy cập trang đăng ký → nhập thông tin hợp lệ → submit → chuyển đến trang đăng nhập → đăng nhập lần đầu (F-272) → setup TOTP → hoàn tất.
- **Security tests**: timing attack — bcrypt comparison dùng constant-time; rate limiting — gửi 6 request trong 15 phút từ cùng IP → request thứ 6 bị reject 429; input injection — thử SQL injection và XSS qua trường email/password → bị sanitize và reject.
