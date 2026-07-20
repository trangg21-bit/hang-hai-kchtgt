---
id: F-272
name: "Đăng nhập lần đầu + TOTP setup"
slug: dang-nhap-lan-dau-totp-setup
module-id: M-010
status: proposed
classification: local
priority: high
created: "2026-06-16T04:42:05Z"
last-updated: "2026-06-23T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Đăng nhập lần đầu + TOTP setup

## Description

MFA: đăng nhập lần đầu + TOTP setup. Khi người dùng đăng ký thành công (F-271), lần đăng nhập đầu tiên yêu cầu thiết lập 2FA bằng TOTP (RFC 6238). Quy trình: người dùng nhập credential → xác nhận mật khẩu đúng → hệ thống phát hiện `totp_secret` NULL → chuyển sang màn setup TOTP (sinh QR + xác nhận mã 6 chữ số) → lưu secret đã băm, đánh dấu MFA enabled → cấp JWT.

## Business Intent

Nâng cao bảo mật tài khoản từ lần đăng nhập đầu tiên bằng cách bắt buộc thiết lập Time-based One-Time Password (TOTP) — yếu tố thứ hai xác thực ngoài mật khẩu — giúp bảo vệ chống lại credential stuffing, phishing, và brute-force attack. Đảm bảo người dùng không thể truy cập hệ thống mà không có MFA được kích hoạt.

## Flow Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. User nhập email/sĐT + mật khẩu (F-271 data)                     │
│         ↓                                                          │
│ 2. Server kiểm tra:                                            │
│    - Tài khoản tồn tại?                                          │
│    - Tài khoản bị khóa (F-277)?                                  │
│    - Mật khẩu đúng?                                              │
│         ↓                                                          │
│ 3. Nếu totp_secret = NULL → BẮT BUỘC setup TOTP:                  │
│    a. Sinh random 20-byte secret, base32 encode                   │
│    b. Tạo TOTP URI (otpauth://totp/...)                            │
│    c. Sinh QR code URL / SVG                                       │
│    d. Hiển thị QR + hướng dẫn scan                               │
│    e. Người dùng scan app (Google Authenticator, Authy...)        │
│    f. Người dùng nhập 6-digit code                               │
│    g. Server verify code (window=1 step, ±1 time-step tolerance)   │
│    h. Lưu totp_secret (hashed), set totp_enabled=true             │
│         ↓                                                          │
│ 4. Sinh JWT (F-274) + trả về client                               │
│         ↓                                                          │
│ 5. Hoàn tất, chuyển đến dashboard                                │
│                                                                  │
│  Nếu totp_secret ≠ NULL → skip TOTP setup, thẳng qua JWT (F-273)  │
└─────────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

- Xác thực thành công: người dùng đăng nhập với email/sĐT + mật khẩu từ F-271.
- Sinh QR: hệ thống sinh TOTP QR code hợp lệ RFC 6238 (secret base32, URI đúng format).
- Xác nhận TOTP: người dùng nhập mã 6 chữ số từ authenticator app → hệ thống verify đúng.
- JWT tạo: sau setup thành công, JWT được sinh (F-274) với claim: `totp_enabled: true`, `user_id`, `role`.
- Reject nếu TOTP code sai ≥ 5 lần trong 15 phút (liên quan F-277).
- Reject nếu tài khoản bị khóa do đăng nhập sai (F-277).
- QR code expiring trong 60 giây (re-generate được).
- Lưu `totp_secret` đã hash (PBKDF2) thay vì plaintext.

## In Scope

- **Xác thực credential đầu vào**: kiểm tra email/sĐT và mật khẩu (bcrypt hash verification).
- **Kiểm tra trạng thái MFA**: đọc `totp_secret` từ User entity — nếu NULL → bắt buộc TOTP setup flow.
- **TOTP secret generation**: sinh 20-byte cryptographically random secret, encode base32.
- **QR code generation**: tạo TOTP URI theo RFC 6238 format, sinh QR code URL (hoặc inline SVG/Base64).
- **TOTP code verification**: validate 6-digit code từ người dùng với ±1 time-step tolerance (30s window ± 30s), sử dụng TOTP library chuẩn (node-authenticator / speakeasy equivalent).
- **Persist TOTP data**: lưu hashed `totp_secret` vào User entity, set `totp_enabled = true`, ghi log audit.
- **JWT issuance**: sau TOTP setup thành công, tạo JWT access + refresh token (F-274).
- **Error handling**: thông báo rõ ràng cho từng trường hợp (sai password, sai TOTP code, tài khoản khóa, QR expiring).
- **UX flow**: màn hình QR scan → nhập code → verify → thành công, hoặc quay lại nếu hủy.

## Out of Scope

- **SMS 2FA / Email 2FA**: chỉ hỗ trợ TOTP (RFC 6238), các kênh MFA khác thuộc feature riêng.
- **Backup code generation**: mã backup để khôi phục khi mất thiết bị TOTP — thuộc feature bổ sung sau.
- **TOTP enrollment revocation/reset**: tính năng xóa/re-setup TOTP — thuộc feature quản lý tài khoản (F-275 hoặc module mới).
- **Biometric authentication**: FaceID/TouchID — không nằm trong scope.
- **Device fingerprinting**: nhận diện thiết bị đăng nhập — không nằm trong scope.
- **Rate-limiting chi tiết cho TOTP**: giới hạn đăng nhập sai (F-277) áp dụng cho credential; TOTP verification rate-limit được implement tối thiểu nhưng không chi tiết hóa ở đây.
- **Multi-device TOTP**: cho phép cùng lúc nhiều thiết bị authenticator — chỉ hỗ trợ 1 device chính.
- **TOTP time-sync adjustment**: đồng bộ thời gian server-client — chỉ dựa vào server time.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| **Unauthenticated** | 0 | Người dùng chưa đăng nhập — có quyền gọi endpoint `/auth/login` và `/auth/totp/setup`. |
| **Authenticated (MFA-not-enrolled)** | 1 | Người dùng đã xác thực credential nhưng chưa setup TOTP — bị redirect bắt buộc đến màn TOTP setup. Chỉ được truy cập endpoint `/auth/totp/setup`, `/auth/totp/verify`. Không được truy cập tài nguyên khác. |
| **Authenticated (MFA-enabled)** | 2 | Người dùng đã hoàn thành TOTP setup — có thể truy cập hệ thống theo phân quyền F-275. JWT đã có claim `totp_enabled: true`. |
| **Admin** | 3 | Có thể xem audit log TOTP setup của các user khác. Không thể reset TOTP của người khác (feature sau). |
| **Super Admin** | 4 | Toàn quyền quản lý MFA policies, bao gồm view/revoke TOTP enrollment (nếu feature sau cho phép). |

## Entities

| Entity | Key Fields | Notes |
|---|---|---|
| **User** | `id`, `email`/`phone`, `password_hash`, `totp_secret_hash`, `totp_enabled` (bool), `role_id`, `locked_until`, `failed_login_count`, `created_at`, `updated_at` | User entity mở rộng từ F-271 (đăng ký). Thêm: `totp_secret_hash` (VARCHAR(64), hashed với PBKDF2), `totp_enabled` (BOOLEAN, default false). `locked_until` và `failed_login_count` liên quan F-277. |
| **TOTP Enroll Session** *(temporary)* | `user_id`, `secret_hash`, `qr_generated_at`, `qr_expires_at`, `attempts`, `locked_until` | Session tạm thời tạo khi user vào màn TOTP setup, expiring trong 60s. Cho phép re-generate QR nếu QR cũ hết hạn. Không lưu vào DB dài hạn — chỉ cache (Redis/memory) trong thời gian setup. |
| **Audit Log** | `id`, `user_id`, `action` ('totp_setup_start'/'totp_setup_success'/'totp_setup_fail'/'totp_verify_fail'), `ip_address`, `user_agent`, `timestamp` | Ghi log mọi sự kiện liên quan TOTP setup để traceability. |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| **BR-272-001** | Người dùng có `totp_secret` NULL hoặc `totp_enabled = false` sau khi xác thực credential → **bắt buộc** thực hiện TOTP setup trước khi được cấp JWT. | F-272 | M-010 module requirement |
| **BR-272-002** | TOTP secret phải được sinh từ CSPRNG (cryptographically secure pseudorandom number generator), tối thiểu 20 bytes. | F-272 | NIST SP 800-132 |
| **BR-272-003** | TOTP secret chỉ được lưu dưới dạng hashed (PBKDF2 với salt ≥ 16 bytes, iterations ≥ 100,000). Không bao giờ lưu plaintext. | F-272 | OWASP Secure Coding Practices |
| **BR-272-004** | QR code chỉ valid trong 60 giây. Hết hạn → yêu cầu user re-generate. | F-272 | Security best practice |
| **BR-272-005** | TOTP verification cho phép ±1 time-step tolerance (30s window ± 30s) để bù drift giữa server và client clock. | F-272 | RFC 6238 §5.2 |
| **BR-272-006** | Sau 5 lần verify TOTP code thất bại liên tiếp trong 15 phút → khóa TOTP verification tạm thời (cần re-auth credential). | F-272 | Liên quan F-277 (login attempt policy) |
| **BR-272-007** | Nếu user đã có `totp_enabled = true` → bỏ qua TOTP setup, thẳng đến JWT issuance (delegate sang F-273 cho subsequent login). | F-272 / F-273 | Flow orchestration |
| **BR-272-008** | JWT sau TOTP setup phải chứa claim `totp_enabled: true` để downstream services biết MFA đã hoàn tất. | F-272 / F-274 | F-274 JWT spec |
| **BR-272-009** | Mọi event TOTP setup (start, success, fail) phải được ghi vào Audit Log. | F-272 | Compliance requirement |
| **BR-272-010** | Tài khoản bị khóa do F-277 (login attempt exceeded) → không cho phép thực hiện TOTP setup. Phải chờ unlock hoặc admin intervention. | F-272 / F-277 | Cross-feature dependency |

## Testing Strategy

> *Pre-filled draft — to be refined by QA stage.*

### Unit Testing
- **TOTP secret generation**: verify secret length (20 bytes), randomness entropy (chi-square test trên sample), base32 encoding correctness.
- **TOTP verification**: test ±1 time-step tolerance với known secret + time → known code (sử dụng test vectors từ RFC 6238 §B.8).
- **Hash verification**: verify PBKDF2 hashing của secret → deterministic output cho cùng input.
- **QR URI format**: kiểm tra TOTP URI đúng format `otpauth://totp/{issuer}:{account}?secret={secret}&algorithm=SHA1&digits=6&period=30`.

### Integration Testing
- **Happy path**: register (F-271) → login with valid creds → TOTP setup → QR scan → verify → JWT issued.
- **Skip path**: user với `totp_enabled=true` login → bỏ qua TOTP setup → JWT issued.
- **Locked account**: user bị khóa (F-277) login → reject với 403, không cho TOTP setup.
- **Wrong password**: reject 401, không lộ whether account exists.
- **Wrong TOTP code ≥ 5 lần**: sau lần 5 → temporary lock, require re-credential auth.
- **QR expired**: QR sau 60s → reject, redirect re-generate.

### E2E Testing
- **Full flow**: đăng ký → đăng nhập → scan QR bằng Google Authenticator (thử nghiệm thật hoặc mock) → nhập code → thành công.
- **Mobile app flow** (nếu có mobile client): deep link hoặc manual entry.

### Security Testing
- **Replay attack**: verify rằng TOTP code đã dùng không thể reuse (check against last-used cache).
- **Timing attack**: TOTP comparison phải dùng constant-time comparison.
- **Secret leakage**: kiểm tra secret không xuất hiện trong logs, error messages, hoặc response bodies.
- **XSS via QR**: QR URL được render an toàn (không inject HTML trực tiếp).
