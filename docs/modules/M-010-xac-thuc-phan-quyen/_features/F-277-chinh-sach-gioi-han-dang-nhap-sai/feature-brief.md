---
id: F-277
name: Chính sách giới hạn đăng nhập sai
slug: chinh-sach-gioi-han-dang-nhap-sai
module-id: M-010
status: done
classification: local
priority: medium
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: completed
---
# Feature: Chính sách giới hạn đăng nhập sai

## Description
Cơ chế bảo vệ chống brute-force và credential stuffing bằng cách giới hạn số lần đăng nhập sai liên tiếp, tự động khóa tài khoản khi vượt ngưỡng, áp dụng thời gian chờ khóa tiến dần (progressive backoff), và hỗ trợ admin unlock thủ công. Cơ chế áp dụng cho cả đăng nhập credentials (email/sĐT + mật khẩu, F-272/F-273) và xác thực TOTP code (F-272/F-273), với bộ đếm riêng cho mỗi loại và thống nhất qua trường account_locked_until.

## Business Intent
Bảo vệ tài khoản người dùng khỏi các cuộc tấn công brute-force (thử mật khẩu hàng loạt) và credential stuffing (sử dụng thông tin đăng nhập bị rò rỉ từ sự cố dữ liệu khác). Đảm bảo tài khoản bị khóa tạm thời khi có dấu hiệu bị tấn công, đồng thời cho phép admin can thiệp thủ công để unlock khi user chính đáng bị khóa nhầm. Cân bằng giữa bảo mật (khóa nhanh) và trải nghiệm người dùng (thời gian khóa hợp lý, cơ chế unlock).

## Flow Summary
```
  [Credentials Login - F-272/F-273]
         ↓
  User nhập email/sĐT + mật khẩu
         ↓
  POST /api/auth/login
         ↓
  Server kiểm tra:
    - account_locked_until > now()? → YES → reject, HTTP 423 Locked
      trả về: {error: "ACCOUNT_LOCKED", unlockAt: account_locked_until}
    - NO → tiếp tục kiểm tra password
         ↓
  password match? → NO → tăng failed_login_count + 1
    - failed_login_count < 5 → reject, HTTP 401, còn N lần thử
    - failed_login_count >= 5 → khóa:
      * account_locked_until = now() + (attempt * 5 phút) [progressive backoff]
      * failed_login_count vẫn giữ nguyên (chờ admin unlock hoặc tự unlock)
      * ghi log: "account_locked_due_to_brute_force"
         ↓
  password match? → YES → reset failed_login_count = 0, tiếp tục flow F-272/F-273
         ↓
  [TOTP Login - F-272/F-273]
         ↓
  User nhập TOTP code
         ↓
  TOTP code hợp lệ? → NO → tăng failed_totp_count + 1
    - failed_totp_count < 5 → reject, HTTP 401
    - failed_totp_count >= 5 → khóa:
      * account_locked_until = now() + (failed_totp_count * 5 phút)
      * ghi log: "account_locked_due_to_totp_failure"
         ↓
  TOTP code hợp lệ? → YES → reset failed_totp_count = 0, sinh JWT
         ↓
  [Admin Unlock]
         ↓
  Admin/Super Admin gọi POST /api/admin/users/{userId}/unlock
    - Set account_locked_until = NULL
    - Reset failed_login_count = 0, failed_totp_count = 0
    - Ghi log: "account_unlocked_by_admin"
```

## Acceptance Criteria
- Hệ thống đếm số lần đăng nhập sai credentials và TOTP code riêng biệt.
- Khi failed_login_count ≥ 5 → tài khoản bị khóa, account_locked_until được tính progressive backoff.
- Khi failed_totp_count ≥ 5 → tài khoản bị khóa tương tự.
- Khi đăng nhập với tài khoản bị khóa → reject ngay với HTTP 423 Locked, hiển thị thời gian unlock dự kiến.
- Admin/Super Admin có thể unlock tài khoản khóa qua admin dashboard hoặc API.
- Mỗi lần đăng nhập thành công (credentials hoặc TOTP) → reset counter về 0.
- Khóa tự động hết hạn sau thời gian tính toán (không cần admin intervention nếu không phải attack nghiêm trọng).
- Ghi nhận đầy đủ vào audit log: mỗi attempt, mỗi lock, mỗi unlock với timestamp và actor.

## In Scope
- **Đếm đăng nhập sai credentials**: tracked qua failed_login_count trong User entity, tăng mỗi lần password mismatch.
- **Đếm đăng nhập sai TOTP**: tracked qua failed_totp_count trong User entity, tăng mỗi lần TOTP code không hợp lệ.
- **Khóa tài khoản**: khi vượt ngưỡng (≥ 5), set account_locked_until = now() + progressive backoff.
- **Progressive backoff**: thời gian khóa tăng theo số lần vi phạm — lần 1: 5 phút, lần 2: 10 phút, lần 3: 15 phút (max 1 giờ).
- **Check khóa tại login**: mỗi lần đăng nhập (credentials hoặc TOTP), kiểm tra account_locked_until > now() trước khi xác thực.
- **Auto-unlock**: tài khoản tự unlock khi thời gian khóa hết hạn, không cần admin can thiệp.
- **Admin unlock**: endpoint POST /api/admin/users/{userId}/unlock để unlock thủ công.
- **Reset counter khi thành công**: mỗi lần đăng nhập thành công (credentials match hoặc TOTP đúng) → reset cả 2 counter về 0.
- **Rate limiting trên endpoint login**: tối đa 10 request/phút mỗi IP (bổ sung cho F-272/F-273).
- **Audit logging**: ghi nhận mọi attempt, lock, unlock vào bảng AuditLog với actor, timestamp, IP.

## Out of Scope
- **Unlock qua email xác nhận**: cơ chế tự unlock bằng email confirmation không nằm trong scope (chỉ admin unlock hoặc auto-expiry).
- **CAPTCHA sau N lần sai**: tích hợp reCAPTCHA vào form đăng nhập thuộc improvement sau, không phải Phase 1 requirement.
- **IP-based ban**: khóa theo IP address (thay vì theo user account) — thuộc cơ chế bảo vệ hạ tầng riêng, không phải account lockout.
- **Notification khi bị khóa**: gửi email/SMS cảnh báo tài khoản bị khóa — thuộc tính năng notification sau.
- **Grace period unlock cho admin**: admin tự unlock chính mình (conflict of interest) — không hỗ trợ.
- **Lockout theo device/IP**: chỉ lockout theo account, không theo thiết bị hoặc địa chỉ IP.
- **Soft lockout (reduce rate nhưng không block)**: chỉ có hard lockout (block toàn bộ) hoặc auto-unlock sau timeout.

## Roles + Permissions

| Role | Permissions |
|------|-------------|
| User (Người dùng bị khóa) | Đọc thông báo "Tài khoản bị khóa" với thời gian unlock dự kiến; Không thể đăng nhập cho đến khi unlock; Không có quyền unlock chính mình. |
| Admin (Quản trị viên) | Xem danh sách tài khoản bị khóa; Unlock tài khoản bị khóa qua admin dashboard hoặc API `/api/admin/users/{userId}/unlock`; Xem audit log lock/unlock. |
| Super Admin (Quản trị hệ thống) | Tất cả quyền của Admin; Xem toàn bộ audit log hệ thống; Cấu hình ngưỡng lockout (threshold) và thời gian khóa (lock duration). |

## Entities
- **User**: id (UUID PK), email (VARCHAR 100), phone (VARCHAR 20), password_hash (VARCHAR 255), failed_login_count (INT DEFAULT 0), failed_totp_count (INT DEFAULT 0), account_locked_until (TIMESTAMP, nullable), last_failed_login_at (TIMESTAMP, nullable), lock_attempt_count (INT DEFAULT 0) — mở rộng từ User entity (F-271), bổ sung các trường lockout tracking và progressive backoff.
- **AuditLog**: id (UUID PK), userId (FK → User, nullable), action (VARCHAR 50: 'login_fail', 'login_success', 'totp_fail', 'totp_success', 'account_locked', 'account_unlocked'), actorId (FK → User, nullable), ip_address (VARCHAR 45), user_agent (TEXT), details (JSON), timestamp (TIMESTAMP) — ghi nhận mọi event liên quan đăng nhập và lockout.

## Business Rules
1. **(BR-277-001)** Mỗi lần password mismatch trong đăng nhập → tăng failed_login_count + 1. Khi đạt ≥ 5 → khóa tài khoản với account_locked_until = now() + (lock_attempt_count + 1) × 5 phút (progressive backoff, max 1 giờ).
2. **(BR-277-002)** Mỗi lần TOTP code sai trong đăng nhập → tăng failed_totp_count + 1. Khi đạt ≥ 5 → khóa tài khoản theo cùng cơ chế progressive backoff.
3. **(BR-277-003)** Khi đăng nhập với tài khoản bị khóa (account_locked_until > now()) → reject ngay với HTTP 423 Locked, trả về thông báo "Tài khoản tạm thời khóa, vui lòng thử lại sau {unlockAt}".
4. **(BR-277-004)** Mỗi lần đăng nhập thành công (credentials match hoặc TOTP đúng) → reset cả failed_login_count và failed_totp_count về 0, set account_locked_until = NULL.
5. **(BR-277-005)** Tài khoản tự unlock khi thời gian khóa hết hạn (account_locked_until ≤ now()) — không cần admin intervention.
6. **(BR-277-006)** Admin/Super Admin unlock tài khoản qua endpoint `/api/admin/users/{userId}/unlock` → set account_locked_until = NULL, reset cả 2 counter về 0, ghi log unlock.
7. **(BR-277-007)** Mọi attempt đăng nhập (success/fail), lock event, và unlock event phải được ghi vào AuditLog với đầy đủ metadata (userId, action, ip, timestamp, actor).
8. **(BR-277-008)** Khi mật khẩu hết hạn (F-276) và user đổi mật khẩu → không áp dụng lockout cho bước "đổi mật khẩu bắt buộc" để tránh khóa user chính đáng.
9. **(BR-277-009)** Ngưỡng fail count (5 lần) và thời gian khóa có thể được cấu hình bởi Super Admin qua admin dashboard — default values: threshold=5, base_lock_minutes=5, max_lock_minutes=60.

## Testing Strategy
- **Unit tests**: kiểm tra logic tính progressive backoff (attempt=1 → 5 phút, attempt=2 → 10 phút, attempt=12 → 60 phút cap); kiểm tra condition account_locked_until > now(); kiểm tra reset counter khi login success; kiểm tra boundary: failed_login_count=4 → không khóa, failed_login_count=5 → khóa.
- **Integration tests**: happy path — đăng nhập credentials đúng → counter reset; failed path — nhập sai password 5 lần → account bị khóa → nhập đúng password → reject 423; TOTP path — nhập sai TOTP 5 lần → account bị khóa → admin unlock → đăng nhập thành công; auto-unlock path — khóa 5 phút → wait 5 phút → đăng nhập lại thành công; admin unlock path — admin gọi unlock API → account active lại.
- **E2E tests**: full brute-force simulation — gửi 5 request sai password liên tiếp → tài khoản bị khóa → thử đăng nhập đúng → reject 423 → admin unlock → đăng nhập đúng; concurrent login — 2 user cùng đăng nhập, 1 user bị khóa → user kia không ảnh hưởng; progressive backoff — khóa lần 1 (5 phút), unlock, khóa lần 2 (10 phút), unlock, khóa lần 3 (15 phút) → verify thời gian tăng dần.
- **Security tests**: verify không có race condition khi nhiều request cùng lúc tăng counter (database-level lock hoặc optimistic concurrency); verify không thể bypass lock bằng cách đổi IP (lock theo userId, không theo IP); verify audit log đầy đủ cho mọi lock/unlock event; verify progressive backoff không bị exploit bằng cách unlock rồi lock lại nhiều lần (cap at 60 phút).
