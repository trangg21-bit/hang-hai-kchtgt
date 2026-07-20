---
status: in-progress
last-updated: 2026-06-23T08:21:33Z
---
---
id: F-277
name: "Chính sách giới hạn đăng nhập sai"
slug: chinh-sach-gioi-han-dang-nhap-sai
module-id: M-010
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:05Z"
last-updated: "2026-06-23T00:00:05Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chính sách giới hạn đăng nhập sai

## Description

Giới hạn số lần nhập sai mật khẩu/TOTP cho phép, sau đó tự động khóa tài khoản và yêu cầu quy trình mở khóa (tự động sau thời gian quy định hoặc do admin thao tác).

## Business Intent

Bảo vệ hệ thống khỏi tấn công brute-force và dictionary attack bằng cách giới hạn số lần đăng nhập sai liên tiếp, tự động khóa tài khoản vi phạm, đồng thời cảnh báo người dùng và quản trị viên.

## Flow Summary

1. Người dùng nhập thông tin đăng nhập (username/password + TOTP nếu có).
2. Hệ thống kiểm tra thông tin — nếu sai, tăng bộ đếm loginFailCount trong bảng LoginAttempt.
3. Khi loginFailCount đạt ngưỡng giới hạn (5 lần liên tiếp):
   - Tài khoản bị khóa tạm thời (status → locked).
   - Người dùng nhận được cảnh báo: "Tài khoản đã bị khóa do quá nhiều lần đăng nhập sai".
   - Thời gian khóa được thiết lập (30 phút).
4. Sau thời gian khóa, tài khoản tự động mở khóa (status → active).
5. Admin/system-admin có thể mở khóa thủ công bất kỳ lúc nào.
6. Mọi sự kiện khóa/mở khóa đều được ghi vào LoginAttemptLog để audit.

## Acceptance Criteria

- Hiển thị cảnh báo khi người dùng tiến đến ngưỡng giới hạn (lần đăng nhập sai thứ 4)
- Ngăn chặn brute-force: khóa tài khoản sau 5 lần đăng nhập sai liên tiếp
- Tự động mở khóa sau 30 phút kể từ thời điểm khóa
- Admin/system-admin có thể mở khóa thủ công bất kỳ lúc nào
- Mọi sự kiện đăng nhập (thành công/thất bại) đều được ghi nhận vào nhật ký

## In Scope

- Theo dõi số lần đăng nhập sai liên tiếp (loginFailCount) cho mỗi tài khoản theo username/email
- Tự động khóa tài khoản sau 5 lần đăng nhập sai liên tiếp (cả mật khẩu và TOTP sai)
- Thiết lập thời gian khóa tạm thời mặc định là 30 phút
- Tự động mở khóa tài khoản sau thời gian khóa quy định
- Hiển thị cảnh báo trực quan cho người dùng tại ngưỡng 3 và 4 lần đăng nhập sai
- Khóa tài khoản hiển thị thông báo rõ ràng: "Tài khoản đã bị khóa. Vui lòng thử lại sau 30 phút hoặc liên hệ quản trị viên"
- Admin/system-admin có thể mở khóa thủ công qua giao diện quản lý người dùng
- Ghi nhận tất cả sự kiện login thành công/thất bại vào LoginAttemptLog
- Reset bộ đếm loginFailCount sau mỗi lần đăng nhập thành công
- Không khóa tài khoản nếu lần sai cuối cùng cách lần trước hơn 15 phút (reset thời gian)
- Áp dụng cho tất cả vai trò người dùng (system-admin, admin, user)
- Tích hợp với F-272 (First login + TOTP setup) và F-273 (Subsequent login + TOTP)

## Out of Scope

- Khóa IP address do quá nhiều lần đăng nhập sai — thuộc phạm vi rate limiting (khác với account lockout)
- Gửi email thông báo tự động khi tài khoản bị khóa — thuộc module notification (nếu có)
- Cơ chế khôi phục tài khoản qua email/cổng tự phục hồi (password reset + security question) — là feature riêng biệt
- Giới hạn số lần đăng nhập thành công trên cùng một IP (anti-brute-force network-level)
- Phân tích hành vi bất thường (anomaly detection) để phát hiện attack pattern — thuộc module AI/security analysis
- Khóa tài khoản vĩnh viễn (permanent lock) — chỉ áp dụng khóa tạm thời
- Bypass lockout cho một số tài khoản service/robot — không áp dụng cho feature này
- Quản lý whitelist IP để bỏ qua giới hạn đăng nhập sai

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| system-admin | Full (xem login log, mở khóa thủ công, điều chỉnh ngưỡng khóa) | Có toàn quyền quản lý lockout policy: xem nhật ký đăng nhập, mở khóa mọi tài khoản, điều chỉnh ngưỡng giới hạn và thời gian khóa từ cài đặt hệ thống |
| admin | CRUD login log + Unlock (chỉ tài khoản trong đơn vị/phân hệ) | Có thể xem nhật ký đăng nhập của người dùng trong phạm vi quản lý và mở khóa thủ công; không được điều chỉnh ngưỡng lockout toàn cục |
| user | Read-only (chỉ thấy cảnh báo lockout của chính mình) | Chỉ xem được thông báo lockout trạng thái tài khoản của mình trên giao diện đăng nhập; không có quyền thao tác mở khóa hoặc xem login log |

## Entities

- **LoginAttempt**: Ghi nhận từng lần thử đăng nhập (id, userId, username, email, ip, userAgent, result: success|failure, failureReason, occurredAt). Lưu mỗi lần đăng nhập — thành công hoặc thất bại.
- **LoginAttemptLog**: Nhật ký chuyên biệt cho audit, mở rộng của LoginAttempt (id, loginAttemptId, eventType: account_locked|account_unlocked|threshold_warning, triggeredBy, details). Dùng để truy vết lịch sử khóa/mở khóa.
- **User**: Bảng user chính (từ M-001/F-001) — bổ sung field `loginFailCount` (int, default 0) và `lockedUntil` (datetime, nullable) cho lockout tracking.
- **LockoutPolicy**: Cấu hình chính sách lockout hệ thống (id, maxFailedAttempts: int, lockoutDurationMinutes: int, windowMinutes: int, isEnabled: boolean, updatedAt, updatedBy). Lưu cài đặt toàn cục, có thể thay đổi mà không cần deploy lại.

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-277-01 | Tài khoản bị khóa sau 5 lần đăng nhập sai liên tiếp (bao gồm sai mật khẩu và sai TOTP) | Đăng nhập | Chính sách bảo mật M-010 |
| BR-277-02 | Thời gian khóa mặc định là 30 phút; sau thời gian này tài khoản tự động mở khóa (status → active) | Khóa/Mở khóa | Chính sách bảo mật M-010 |
| BR-277-03 | Bộ đếm loginFailCount được reset về 0 sau mỗi lần đăng nhập thành công | Đăng nhập | Business logic |
| BR-277-04 | Nếu lần đăng nhập sai cuối cùng cách lần trước hơn 15 phút (windowMinutes), bộ đếm được reset về 0 | Login fail tracking | Business logic |
| BR-277-05 | Khi tài khoản đang bị khóa, mọi nỗ lực đăng nhập (dù đúng credentials) đều bị từ chối với thông báo "Tài khoản đã bị khóa" | Đăng nhập | Security requirement |
| BR-277-06 | Admin/system-admin có thể mở khóa thủ công bất kỳ tài khoản nào đang bị khóa | Account unlock | Phân quyền M-010 |
| BR-277-07 | Mọi sự kiện khóa/mở khóa tài khoản phải được ghi nhận vào LoginAttemptLog với đầy đủ thông tin (ai thao tác, khi nào, lý do) | Audit trail | Yêu cầu bảo mật |
| BR-277-08 | Cảnh báo hiển thị tại ngưỡng 3 và 4 lần đăng nhập sai: "Bạn còn 2 lần đăng nhập sai trước khi tài khoản bị khóa" (tại ngưỡng 3) và "Bạn còn 1 lần đăng nhập sai trước khi tài khoản bị khóa" (tại ngưỡng 4) | UI notification | UX requirement |
| BR-277-09 | Chính sách lockout áp dụng cho tất cả vai trò — không có ngoại lệ dựa trên role | Tất cả đăng nhập | Equality principle |
| BR-277-10 | LockoutPolicy có thể được điều chỉnh qua cài đặt hệ thống; thay đổi áp dụng ngay mà không cần restart service | System config | Admin flexibility |

## Testing Strategy

- **Unit Testing (Backend)**:
  - Kiểm tra logic tăng loginFailCount sau mỗi lần đăng nhập sai
  - Kiểm tra điều kiện khóa tài khoản: failCount >= maxFailedAttempts (5)
  - Kiểm tra reset failCount sau đăng nhập thành công
  - Kiểm tra windowMinutes (15 phút) — nếu khoảng cách giữa các lần sai > 15 phút thì reset
  - Kiểm tra thời gian khóa tự động: lockedUntil > now → account locked
  - Kiểm tra các giá trị từ LockoutPolicy config (maxFailedAttempts, lockoutDurationMinutes)
  - Kiểm tra authorization: chỉ admin/system-admin mới được mở khóa tài khoản

- **Integration Testing (Backend)**:
  - Test flow đầy đủ: 5 lần đăng nhập sai → account locked → chờ 30 phút → tự mở khóa
  - Test: 5 lần đăng nhập sai → admin mở khóa thủ công → đăng nhập thành công với credentials đúng
  - Test tích hợp với F-273: đăng nhập có TOTP — cả password và TOTP sai đều tính vào failCount
  - Test LoginAttemptLog được ghi đầy đủ cho mỗi sự kiện lock/unlock/warning
  - Test thay đổi LockoutPolicy trong runtime → áp dụng ngay cho lần đăng nhập tiếp theo

- **E2E Testing (Frontend + Backend)**:
  - Test đăng nhập sai 3 lần → cảnh báo hiển thị "Bạn còn 2 lần..."
  - Test đăng nhập sai 4 lần → cảnh báo hiển thị "Bạn còn 1 lần... trước khi bị khóa"
  - Test đăng nhập sai 5 lần → hiển thị "Tài khoản đã bị khóa. Vui lòng thử lại sau 30 phút hoặc liên hệ quản trị viên"
  - Test admin mở khóa tài khoản qua giao diện quản lý người dùng
  - Test user đang bị khóa → dù nhập đúng password/TOTP vẫn không đăng nhập được
  - Test loginFailCount được reset sau khi đăng nhập thành công

- **Security Testing**:
  - Verify rằng failCount không thể bypass bằng cách thay đổi username/email trong mỗi lần thử (dùng username lookup)
  - Kiểm tra không có timing attack trong so sánh credentials (sử dụng constant-time comparison)
  - Xác nhận lockout áp dụng cho tất cả accounts — không có bypass qua role
  - Verify LoginAttemptLog không cho phép modify/delete — immutable audit trail
  - Kiểm tra không expose số lần loginFailCount còn lại trong API response (chỉ hiển thị trên UI)

- **Performance Testing**:
  - Test lockout logic với 1000+ concurrent login attempts
  - Verify database index trên User.email và User.username để lookup nhanh khi check lockout
  - Đo thời gian phản hồi khi check lockout trạng thái (< 50ms)

- **Regression Testing**:
  - Đảm bảo lockout không ảnh hưởng đến F-271 (registration), F-272 (first login), F-274 (JWT session)
  - Sau khi mở khóa tài khoản, session cũ của user vẫn bị invalidate (BR từ F-001)
  - Đảm bảo lockout không gây lockout cascade khi cùng IP nhưng khác account

## Context

### Dependencies

- **F-272** (Đăng nhập lần đầu + TOTP setup): Lockout áp dụng cho lần đăng nhập đầu tiên khi người dùng nhập sai mật khẩu/TOTP setup
- **F-273** (Đăng nhập lần tiếp theo + TOTP): Lockout áp dụng cho cả xác thực password và TOTP
- **F-274** (Quản lý JWT session): Khi tài khoản bị khóa, mọi JWT đang hoạt động cần bị invalidate
- **M-001/F-001** (Quản lý tài khoản người dùng): User entity có thêm field loginFailCount, lockedUntil; admin unlock thông qua UI F-001

### Tech Stack

- Backend: Spring Boot + Spring Security + JWT (theo M-010)
- Frontend: ReactJS (theo M-010)
- Database: MSSQL 2022 — thêm bảng LoginAttempt, LoginAttemptLog, LockoutPolicy; bổ sung loginFailCount, lockedUntil vào User
