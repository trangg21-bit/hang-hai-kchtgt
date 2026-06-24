---
id: F-276
name: "Chính sách mật khẩu"
slug: chinh-sach-mat-khau
module-id: M-010
status: proposed
classification: local
priority: medium
created: "2026-06-16T04:42:05Z"
last-updated: "2026-06-23T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Chính sách mật khẩu

## Description

Chính sách mật khẩu bao gồm: độ phức tạp (complexity), thời hạn hiệu lực (expiration), lịch sử mật khẩu (history), và cơ chế bắt buộc đổi mật khẩu khi đến hạn — áp dụng cho toàn bộ tài khoản người dùng trong hệ thống Hang Hải KHTKT.

## Business Intent

Bảo vệ tài khoản người dùng bằng cách đảm bảo mật khẩu luôn đáp ứng tiêu chuẩn bảo mật tối thiểu: độ phức tạp, không tái sử dụng, và chu kỳ đổi định kỳ. Giảm thiểu rủi ro tấn công brute-force, credential stuffing, và tái sử dụng mật khẩu yếu từ các sự cố rò rỉ dữ liệu bên ngoài.

## Flow Summary

1. **Khi đăng ký (F-271):** System validate mật khẩu dựa trên chính sách độ phức tạp trước khi tạo tài khoản. Nếu không đạt → trả về danh sách lỗi chi tiết cho user.
2. **Khi đổi mật khẩu (chức năng mới):** User cung cấp mật khẩu cũ + mật khẩu mới → System validate: (a) mật khẩu cũ đúng, (b) mật khẩu mới đáp ứng complexity, (c) mật khẩu mới không trùng với N mật khẩu gần nhất (history), (d) mật khẩu mới đáp ứng expiration policy nếu áp dụng.
3. **Khi mật khẩu hết hạn:** System detect expiration date của password → khi user login (F-272/F-273) và mật khẩu đã hết hạn → redirect bắt buộc đổi mật khẩu trước khi truy cập tính năng.
4. **Khi admin cấu hình chính sách:** Admin (quản trị viên) có thể xem và điều chỉnh các tham số chính sách (độ dài tối thiểu, số ký tự đặc biệt, chu kỳ hết hạn…) thông qua giao diện quản trị.

## Acceptance Criteria

- [ ] System validate mật khẩu theo chính sách complexity (độ dài, chữ hoa, chữ thường, số, ký tự đặc biệt)
- [ ] System ngăn user tái sử dụng N mật khẩu gần nhất (configurable history depth)
- [ ] System hiển thị cảnh báo khi mật khẩu sắp hết hạn (T-7, T-3, T-1 ngày)
- [ ] System bắt buộc đổi mật khẩu khi user đăng nhập và mật khẩu đã hết hạn
- [ ] Admin có thể xem chính sách mật khẩu hiện tại (read-only cho user thường)
- [ ] Mật khẩu được lưu trữ hash (bcrypt/argon2) với salt random — không bao giờ lưu plaintext
- [ ] Error messages không tiết lộ thông tin nhạy cảm (không nói rõ "mật khẩu cũ sai" vs "mật khẩu mới không đạt complexity")

## In Scope

- **Độ phức tạp mật khẩu (Password Complexity):**
  - Tối thiểu 8 ký tự (configurable, default 12)
  - Bắt buộc ít nhất 1 chữ hoa (A-Z)
  - Bắt buộc ít nhất 1 chữ thường (a-z)
  - Bắt buộc ít nhất 1 số (0-9)
  - Bắt buộc ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
  - Không chứa username hoặc email trong mật khẩu

- **Chu kỳ hết hạn mật khẩu (Password Expiration):**
  - Mật khẩu có hiệu lực trong 90 ngày (configurable)
  - Hệ thống tự động detect expiration khi user login
  - Cảnh báo user khi mật khẩu sắp hết hạn (7 ngày, 3 ngày, 1 ngày trước khi hết hạn)
  - Bắt buộc đổi mật khẩu khi đã hết hạn — không cho login vào hệ thống chính

- **Lịch sử mật khẩu (Password History):**
  - Không cho phép tái sử dụng 5 mật khẩu gần nhất (configurable)
  - So sánh với danh sách mật khẩu đã dùng trước đó (đã hash)

- **API/Endpoint:**
  - `POST /api/auth/change-password` — đổi mật khẩu (cần xác thực)
  - `GET /api/auth/password-policy` — xem chính sách (public/read)
  - `PUT /api/admin/password-policy` — cập nhật chính sách (admin only)

- **Admin Configuration:**
  - Giao diện quản trị cho phép admin điều chỉnh các tham số chính sách mật khẩu
  - Chính sách mới áp dụng cho toàn bộ hệ thống, có hiệu lực ngay

## Out of Scope

- **F-277 — Chính sách giới hạn đăng nhập sai:** Thuộc feature riêng (F-277), không nằm trong F-276
- **TOTP/MFA setup:** Thuộc F-272/F-273, không nằm trong F-276
- **Social/SSO login:** Không áp dụng password policy cho phương thức xác thực phi mật khẩu
- **Passwordless authentication:** (Nếu có trong tương lai) không áp dụng chính sách mật khẩu
- **Mật khẩu cho service-to-service (API keys, tokens):** Áp dụng cơ chế khác (token rotation, API key management)
- **Password strength meter (client-side UI):** Thuộc frontend UX, có thể đề xuất nhưng không bắt buộc là requirement cốt lõi

## Roles + Permissions

| Role | Level | Permissions |
|---|---|---|
| User (Người dùng) | Level 1 | Xem chính sách mật khẩu hiện tại (`GET /api/auth/password-policy`); Đổi mật khẩu của chính mình (`POST /api/auth/change-password`); Không thể thay đổi chính sách |
| Admin (Quản trị viên) | Level 2 | Tất cả quyền của User; Xem chính sách mật khẩu hệ thống; Cập nhật chính sách mật khẩu (`PUT /api/admin/password-policy`); Xem báo cáo mật khẩu hết hạn của toàn bộ user |
| System (Auto) | — | Tự động validate password complexity tại các điểm: đăng ký, đổi mật khẩu, reset mật khẩu; Tự động tính toán và gán expiration date khi tạo/đổi mật khẩu; Tự động gửi cảnh báo khi mật khẩu sắp hết hạn |

## Entities

| Entity | Fields | Description |
|---|---|---|
| `PasswordPolicy` | `id` (UUID), `minLength` (int, default 12), `requireUppercase` (bool, default true), `requireLowercase` (bool, default true), `requireDigit` (bool, default true), `requireSpecialChar` (bool, default true), `specialCharSet` (string, default "!@#$%^&*()-_=+"), `maxAgeDays` (int, default 90), `historyDepth` (int, default 5), `blockUsernameInPassword` (bool, default true), `createdAt` (timestamp), `updatedAt` (timestamp) | Bảng cấu hình chính sách mật khẩu — chỉ có 1 row (singleton table) |
| `UserPassword` (extends từ User entity) | `userId` (FK → User), `passwordHash` (string), `salt` (string, embedded in hash), `createdAt` (timestamp), `expiresAt` (timestamp), `lastChangedAt` (timestamp) | Lưu trữ mật khẩu hash của user. Mỗi user có tối đa 1 record active + N records trong history |
| `PasswordHistory` | `id` (UUID), `userId` (FK → User), `passwordHash` (string), `createdAt` (timestamp) | Lịch sử N mật khẩu gần nhất của từng user — dùng để ngăn tái sử dụng |
| `PasswordExpirationLog` (optional, audit trail) | `id` (UUID), `userId` (FK → User), `expiredAt` (timestamp), `status` (enum: `warning`, `forced_change`, `changed`), `notifiedVia` (enum: `email`, `in-app`, `none`) | Audit trail cảnh báo và xử lý mật khẩu hết hạn |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-276-01 | Mật khẩu phải có tối thiểu 12 ký tự (configurable). Nếu dưới 8 ký tự → reject ngay với lỗi "Mật khẩu quá ngắn". | Đăng ký (F-271), Đổi mật khẩu (F-276) | Chính sách bảo mật hệ thống |
| BR-276-02 | Mật khẩu bắt buộc chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt (theo set cấu hình). Thiếu bất kỳ loại nào → reject với mô tả cụ thể loại ký tự thiếu. | Đăng ký (F-271), Đổi mật khẩu (F-276) | Chính sách bảo mật hệ thống |
| BR-276-03 | Mật khẩu không được chứa username hoặc email của người dùng (case-insensitive, length ≥ 4). Vi phạm → reject với lỗi "Mật khẩu chứa thông tin cá nhân". | Đăng ký (F-271), Đổi mật khẩu (F-276) | Phòng chống guessable password |
| BR-276-04 | Không cho phép tái sử dụng mật khẩu thuộc 5 mật khẩu gần nhất (configurable). So sánh hash. | Đổi mật khẩu (F-276) | Phòng chống password reuse |
| BR-276-05 | Mật khẩu có hiệu lực 90 ngày từ ngày đổi gần nhất (configurable). Khi hết hạn, user không thể đăng nhập vào hệ thống chính — chỉ được truy cập endpoint đổi mật khẩu. | Login (F-272/F-273), Đổi mật khẩu (F-276) | Tuân thủ chính sách bảo mật |
| BR-276-06 | Gửi cảnh báo khi mật khẩu còn 7 ngày, 3 ngày, 1 ngày đến hạn (in-app notification + email nếu có). | Hệ thống tự động | UX best practice |
| BR-276-07 | Khi admin thay đổi chính sách mật khẩu, thay đổi áp dụng cho toàn bộ hệ thống ngay lập tức. Không áp dụng retroactively cho mật khẩu đã tồn tại (chỉ áp dụng cho lần đổi mật khẩu tiếp theo). | Admin config | Chính sách quản trị |
| BR-276-08 | Mật khẩu được lưu trữ dưới dạng bcrypt/argon2 hash với salt random. Không bao giờ lưu plaintext hoặc reversible encryption. | Toàn bộ hệ thống | OWASP Password Storage Cheat Sheet |
| BR-276-09 | API response cho đổi mật khẩu sai hoặc không đạt policy → trả về lỗi chung "Đổi mật khẩu không thành công" — không tiết lộ chi tiết lỗi cụ thể để tránh thông tin leak. | Đổi mật khẩu (F-276) | OWASP Authentication Cheat Sheet |
| BR-276-10 | Chính sách mật khẩu có thể được cấu hình qua admin dashboard. Các giá trị mặc định được hardcode làm fallback nếu chưa có record trong database. | Admin config | System configurability |

## Testing Strategy

### 1. Unit Tests (Backend)

| Test Case | Description | Expected Result |
|---|---|---|
| TC-01 | Validate mật khẩu đúng yêu cầu (12 ký tự, đủ chữ hoa/thường/số/đặc biệt) | Pass validation |
| TC-02 | Validate mật khẩu quá ngắn (< 8 ký tự) | Reject — "Mật khẩu quá ngắn" |
| TC-03 | Validate mật khẩu thiếu chữ hoa | Reject — mô tả cụ thể "Thiếu ký tự chữ hoa" |
| TC-04 | Validate mật khẩu thiếu chữ thường | Reject — mô tả cụ thể "Thiếu ký tự chữ thường" |
| TC-05 | Validate mật khẩu thiếu số | Reject — mô tả cụ thể "Thiếu ký tự số" |
| TC-06 | Validate mật khẩu thiếu ký tự đặc biệt | Reject — mô tả cụ thể "Thiếu ký tự đặc biệt" |
| TC-07 | Validate mật khẩu chứa username (case-insensitive, ≥ 4 ký tự) | Reject — "Mật khẩu chứa thông tin cá nhân" |
| TC-08 | Validate mật khẩu không chứa username với độ dài < 4 ký tự trùng | Pass (tránh false positive) |
| TC-09 | Kiểm tra password history — tái sử dụng mật khẩu cũ (trong 5 mật khẩu gần nhất) | Reject — "Mật khẩu đã được sử dụng gần đây" |
| TC-10 | Kiểm tra password history — mật khẩu mới không trùng với bất kỳ mật khẩu cũ nào | Pass validation |
| TC-11 | Kiểm tra expiration — mật khẩu còn 7 ngày → cảnh báo warning 1 | Warning triggered |
| TC-12 | Kiểm tra expiration — mật khẩu còn 3 ngày → cảnh báo warning 2 | Warning triggered |
| TC-13 | Kiểm tra expiration — mật khẩu còn 1 ngày → cảnh báo warning 3 | Warning triggered |
| TC-14 | Kiểm tra expiration — mật khẩu đã hết hạn → reject login, chỉ cho phép đổi mật khẩu | Redirect to change-password flow |
| TC-15 | Hash mật khẩu với bcrypt/argon2 → so sánh hash không trùng nhau dù cùng input (salt random) | Hashes differ |
| TC-16 | Verify hash đúng password → true | Pass verification |
| TC-17 | Verify hash sai password → false | Fail verification |

### 2. Integration Tests (API Endpoints)

| Test Case | Endpoint | Description | Expected Result |
|---|---|---|---|
| TC-INT-01 | `POST /api/auth/change-password` | Đổi mật khẩu thành công (đúng mật khẩu cũ + mới đạt policy) | 200 OK, token invalidated |
| TC-INT-02 | `POST /api/auth/change-password` | Mật khẩu cũ sai | 401 Unauthorized — message chung |
| TC-INT-03 | `POST /api/auth/change-password` | Mật khẩu mới không đạt complexity | 400 Bad Request — mô tả lỗi cụ thể |
| TC-INT-04 | `POST /api/auth/change-password` | Mật khẩu mới trùng mật khẩu cũ | 400 Bad Request — "Mật khẩu mới không được trùng mật khẩu hiện tại" |
| TC-INT-05 | `POST /api/auth/change-password` | Mật khẩu mới trùng trong history (5 mật khẩu gần nhất) | 400 Bad Request — "Mật khẩu đã được sử dụng gần đây" |
| TC-INT-06 | `GET /api/auth/password-policy` | User thường xem chính sách | 200 OK — trả về current policy config |
| TC-INT-07 | `PUT /api/admin/password-policy` | Admin cập nhật chính sách | 200 OK — policy được cập nhật |
| TC-INT-08 | `PUT /api/admin/password-policy` | User thường cố cập nhật chính sách | 403 Forbidden |
| TC-INT-09 | `POST /api/auth/login` | Login với mật khẩu đã hết hạn | 403 — yêu cầu đổi mật khẩu trước |
| TC-INT-10 | `POST /api/auth/change-password` | Sau khi đổi mật khẩu hết hạn → login lại thành công | 200 OK — flow tiếp tục bình thường |

### 3. Security Tests

| Test Case | Description | Expected Result |
|---|---|---|
| TC-SEC-01 | SQL Injection qua trường mật khẩu | Không bị exploit — mật khẩu không dùng trong SQL query |
| TC-SEC-02 | Plaintext mật khẩu trong logs, DB, API response | Không xuất hiện — chỉ lưu hash |
| TC-SEC-03 | Timing attack so sánh password hash | Dùng constant-time comparison (bcrypt/argon2 tự xử lý) |
| TC-SEC-04 | Brute-force đổi mật khẩu (rate limiting) | Rate limit áp dụng trên `POST /api/auth/change-password` |
| TC-SEC-05 | Information leak qua error message | Error message chung, không tiết lộ "mật khẩu cũ sai" vs "policy không đạt" |

### 4. E2E / UI Tests

| Test Case | Scenario | Expected Result |
|---|---|---|
| TC-E2E-01 | User đăng ký → nhập mật khẩu không đạt policy → thấy error inline | Form không submit, error message hiển thị |
| TC-E2E-02 | User đăng ký → nhập mật khẩu đạt policy → tài khoản tạo thành công | Redirect to login, account created |
| TC-E2E-03 | User đổi mật khẩu → mật khẩu cũ đúng, mới đạt policy → thành công | Success toast, redirect to login hoặc dashboard |
| TC-E2E-04 | User login → mật khẩu hết hạn → bị redirect đến trang đổi mật khẩu | Page: "Đổi mật khẩu trước khi tiếp tục" |
| TC-E2E-05 | Admin mở trang cấu hình chính sách mật khẩu → thấy các tham số hiện tại | Form hiển thị đúng current values |
| TC-E2E-06 | Admin cập nhật chính sách → reload trang → giá trị thay đổi | Giá trị mới được lưu và hiển thị |

### 5. Performance Tests

| Test Case | Description | Target |
|---|---|---|
| TC-PERF-01 | Hash mật khẩu bcrypt (work factor 12) — single request | < 200ms |
| TC-PERF-02 | Verify mật khẩu bcrypt — single request | < 200ms |
| TC-PERF-03 | Check password history (5 hash comparisons) — single request | < 50ms |
| TC-PERF-04 | Kiểm tra expiration date — single query | < 10ms |

## Context

### Dependencies

- **F-271** (Đăng ký tài khoản): Password policy validation được áp dụng ngay tại bước đăng ký — mật khẩu mới phải đạt complexity policy trước khi user được tạo
- **F-272** (Đăng nhập lần đầu + TOTP setup): Khi user đăng nhập lần đầu và mật khẩu đã hết hạn → redirect bắt buộc đổi mật khẩu trước khi bắt đầu TOTP setup
- **F-273** (Đăng nhập lần tiếp theo + TOTP): Khi user đăng nhập lần tiếp theo và mật khẩu đã hết hạn → redirect bắt buộc đổi mật khẩu trước khi xác thực TOTP
- **F-274** (Quản lý JWT session): Khi user đổi mật khẩu → invalidate tất cả JWT tokens đang hoạt động; khi mật khẩu hết hạn → reject login attempt với JWT không được tạo mới
- **F-277** (Chính sách giới hạn đăng nhập sai): Coordination với lockout policy — khi mật khẩu hết hạn và user đổi, nếu nhập sai mật khẩu cũ nhiều lần → lockout trigger (F-277) không nên áp dụng cho bước "đổi mật khẩu bắt buộc" để tránh khóa user chính đáng

### Tech Stack

- Backend: Spring Boot + Spring Security + JWT (theo M-010)
- Frontend: ReactJS (theo M-010)
- Database: MSSQL 2022 — thêm bảng PasswordPolicy (singleton), PasswordHistory; bổ sung expiresAt, lastChangedAt vào UserPassword/UserPassword hash
