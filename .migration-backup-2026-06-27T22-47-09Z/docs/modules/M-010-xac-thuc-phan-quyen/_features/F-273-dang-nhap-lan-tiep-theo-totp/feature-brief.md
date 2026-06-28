---
id: F-273
name: Đăng nhập lần tiếp theo + TOTP
slug: dang-nhap-lan-tiep-theo-totp
module-id: M-010
status: done
classification: local
priority: high
created: 2026-06-16T04:42:24Z
last-updated: 2026-06-25T09:18:45Z
locked-fields: []
consumed_by_modules: []
stage: completed
qa-verdict: Pass
qa-pass-rate: 100
---
# Feature: Đăng nhập lần tiếp theo + TOTP

## Description

Xác thực 2 yếu tố (2FA) cho người dùng đã có TOTP được cấu hình từ lần đăng nhập đầu tiên (F-272). Quy trình: người dùng nhập credentials (email/số điện thoại + mật khẩu), nếu pass → server kiểm tra trạng thái TOTP đã được thiết lập (is_totp_enabled = true) → yêu cầu mã TOTP 6 chữ số → validate qua shared secret → nếu hợp lệ → phát hành JWT access + refresh token. Đây là flow đăng nhập tiêu chuẩn cho người dùng đã hoàn tất F-272.

## Business Intent

- Đảm bảo mọi đăng nhập sau lần đầu đều phải xác thực 2 yếu tố, giảm thiểu rủi ro tài khoản bị đánh cắp do lộ mật khẩu.
- Người dùng đã có TOTP configured (từ F-272) sẽ được yêu cầu nhập mã TOTP mỗi khi đăng nhập — không có cơ chế bypass.
- JWT được cấp chỉ sau khi cả 2 yếu tố (something you know + something you have) đều hợp lệ.

## Flow Summary

1. Client gửi request POST `/auth/login` với `email/phone` + `password`.
2. Server tìm user theo email/phone, kiểm tra trạng thái tài khoản:
   - Nếu tài khoản bị khóa (do F-277) → reject ngay, trả lỗi `ACCOUNT_LOCKED`.
   - Nếu password không match → tăng counter `failed_login_count`, nếu ≥ threshold (F-277) → lock account.
3. Nếu password match:
   - Nếu `is_totp_enabled = false` (trường hợp edge: user đã đăng ký F-271 nhưng chưa F-272) → redirect về flow F-272 (bắt buộc setup TOTP trước khi đăng nhập).
   - Nếu `is_totp_enabled = true` → yêu cầu bước 2: nhập TOTP code.
4. Client gửi request POST `/auth/login/totp` với `user_id` (hoặc session token) + `totp_code` 6 chữ số.
5. Server validate TOTP code với shared secret của user:
   - Nếu hợp lệ → reset `failed_login_count` về 0, sinh JWT access token + refresh token, trả về response.
   - Nếu sai → tăng counter `failed_totp_count`, cho phép retry tối đa 5 lần. Nếu quá giới hạn → lock account tạm thời (15 phút).
6. Token được trả về cùng thông tin user (id, role level, email, is_totp_enabled).

## Acceptance Criteria

- Xác thực 2 yếu tố thành công khi cả password + TOTP code hợp lệ.
- Reject login nếu tài khoản bị khóa (F-277 active).
- Redirect về TOTP setup nếu user chưa có TOTP configured.
- JWT chỉ được cấp sau khi 2FA pass.
- Reject login với lỗi rõ ràng: `INVALID_CREDENTIALS`, `TOTP_INVALID`, `ACCOUNT_LOCKED`.
- TOTP code chỉ valid trong window 30s (chuẩn RFC 6238).
- Retry TOTP tối đa 5 lần, sau đó lock tạm 15 phút.

## In Scope

- **Xác thực credentials**: tìm user theo email hoặc số điện thoại, verify password hash (bcrypt/argon2).
- **Kiểm tra trạng thái TOTP**: đọc flag `is_totp_enabled` từ user entity.
- **TOTP validation**: validate mã TOTP 6 chữ số dựa trên shared secret (chuẩn RFC 6238, window = 30s).
- **JWT issuance**: phát hành access token (short-lived, ~15 phút) + refresh token (long-lived, ~7 ngày) sau khi 2FA pass.
- **Login failure handling**: đếm số lần đăng nhập sai (F-277 integration), đếm số lần TOTP sai, lock account tạm.
- **Edge case: user chưa setup TOTP**: redirect flow về F-272 thay vì reject outright.
- **Audit logging**: ghi log login attempt (success/fail) với timestamp, IP, user-agent.

## Out of Scope

- **TOTP setup/generation**: thuộc F-272 (QR code, shared secret creation, verification during setup).
- **JWT refresh/revoke**: thuộc F-274 (auto-refresh, token blacklist, logout).
- **Phân quyền chi tiết**: thuộc F-275 (3-level authorization: function, operation, data).
- **Chính sách mật khẩu**: thuộc F-276 (độ phức tạp, expiry, rotation).
- **Chính sách giới hạn đăng nhập sai**: thuộc F-277 (threshold, lock duration, auto-unlock), F-273 chỉ tích hợp.
- **Social login / OAuth**: không áp dụng cho module xác thực nội bộ này.
- **Biometric / hardware token (FIDO2)**: không trong phạm vi M-010 hiện tại.
- **Forgot password / password reset**: thuộc về một module authentication khác (F-XXX).
- **MFA recovery codes**: chưa hỗ trợ backup codes cho trường hợp mất thiết bị TOTP.

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| **Guest (chưa đăng nhập)** | N/A | Chỉ có quyền gọi POST `/auth/login`, `/auth/login/totp`. Không truy cập được tài nguyên protected. |
| **Authenticated User** | Level 1 (dựa trên F-275) | Sau khi login 2FA pass, nhận JWT chứa `role` claim. Có quyền truy cập dựa trên phân quyền 3 mức (function/operation/data) từ F-275. |
| **Admin** | Level 3 | Sau 2FA pass, có thêm quyền quản lý user, xem audit log, unlock account (F-277). |
| **Support / Operator** | Level 2 | Sau 2FA pass, có quyền hạn chế so với Admin, xem một subset audit log. |

> Ghi chú: Chi tiết phân quyền 3 mức được định nghĩa đầy đủ trong F-275. F-273 chỉ xác thực — vai trò cụ thể của user được xác định bởi data sau login.

## Entities

| Entity | Key Attributes | Notes |
|---|---|---|
| **User** | `id`, `email`, `phone`, `password_hash`, `is_totp_enabled`, `totp_secret` (encrypted), `failed_login_count`, `failed_totp_count`, `account_locked_until`, `last_login_at`, `created_at`, `updated_at` | Entity trung tâm. `totp_secret` được mã hóa khi lưu trữ. `failed_*_count` reset sau login thành công. |
| **TOTP State** | `user_id`, `is_totp_enabled`, `totp_secret_encrypted`, `created_at`, `updated_at` | Trạng thái TOTP của user, được setup bởi F-272. F-273 chỉ đọc (validate). |
| **JWT Token** | `user_id`, `role_level`, `issued_at`, `expires_at`, `jti` (JWT ID), `token_type` (access/refresh) | Generated sau 2FA pass. Access token ngắn hạn (~15p), refresh token dài hạn (~7d). Lưu trữ trong memory cache hoặc Redis cho revoke/blacklist (F-274). |
| **LoginAuditLog** | `id`, `user_id`, `attempt_type` (credentials/totp), `result` (success/fail), `ip_address`, `user_agent`, `failed_reason`, `timestamp` | Ghi log mọi attempt login để phục vụ audit và analysis. |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| **BR-273-01** | Chỉ cho login nếu user có `is_totp_enabled = true`. Nếu `false`, redirect về flow F-272 (bắt buộc setup TOTP). | Login flow | Module M-010 policy |
| **BR-273-02** | Password phải match với `password_hash` (bcrypt/argon2 với salt từ khi tạo account F-271). Nếu sai → tăng `failed_login_count`. | Credentials check | F-271, F-277 |
| **BR-273-03** | TOTP code phải là chuỗi 6 chữ số, valid trong window 30s (theo RFC 6238), validate với `totp_secret_encrypted` của user. | TOTP validation | RFC 6238 |
| **BR-273-04** | Sau khi 2FA pass, reset `failed_login_count` và `failed_totp_count` về 0. | Login success | F-277 |
| **BR-273-05** | Nếu TOTP code sai → tăng `failed_totp_count`. Nếu ≥ 5 lần liên tiếp → lock account tạm 15 phút (tích hợp F-277). | TOTP failure | F-277 |
| **BR-273-06** | Nếu `account_locked_until > now()` → reject login với `ACCOUNT_LOCKED`, thông báo thời gian unlock dự kiến. | Account lock | F-277 |
| **BR-273-07** | JWT access token expiry ~15 phút, refresh token expiry ~7 ngày. Cả 2 đều chứa `user_id`, `role_level`, `jti`. | JWT issuance | F-274 |
| **BR-273-08** | Mỗi attempt login (credentials hoặc TOTP) phải được ghi log vào `LoginAuditLog` với đầy đủ metadata (IP, user-agent, result, reason). | Audit | Security requirement |
| **BR-273-09** | TOTP secret được mã hóa khi lưu trữ (AES-256-GCM hoặc tương đương). Không bao giờ lưu plain-text secret. | TOTP security | Security standard |
| **BR-273-10** | Không reveal thông tin cụ thể về lỗi (ví dụ: "email không tồn tại" vs "mật khẩu sai") — trả về message chung "Sai thông tin đăng nhập" để chống enumeration. | Credential security | OWASP guidance |

## Testing Strategy

> **Unit Testing**
> - Verify TOTP code generation và validation với các shared secret đã biết (test vectors RFC 6238 Appendix B).
> - Verify password hashing và verification (bcrypt/argon2 compatibility).
> - Verify JWT signing và verification (cả access và refresh tokens).
> - Verify edge cases: TOTP code sai, expired TOTP, TOTP code 5 chữ số hoặc 7 chữ số → reject.

> **Integration Testing**
> - Happy path: register (F-271) → setup TOTP (F-272) → login 2FA pass (F-273) → nhận JWT.
> - Edge: login khi account bị lock (F-277) → reject với `ACCOUNT_LOCKED`.
> - Edge: login khi user chưa setup TOTP (F-272 chưa run) → redirect flow.
> - Edge: TOTP retry quá 5 lần → lock tạm.
> - Integration với F-277: verify `failed_login_count` và `failed_totp_count` được quản lý đúng.
> - Integration với F-274: verify JWT được parse đúng và có thể refresh.

> **Security Testing**
> - Verify không có timing attack trong TOTP comparison (constant-time comparison).
> - Verify không reveal thông tin cụ thể về lỗi (BR-273-10).
> - Verify TOTP secret được mã hóa khi lưu.
> - Verify JWT được ký với key mạnh (RS256/ES256 hoặc HS256 với key đủ dài).
> - Verify login endpoint có rate limiting (thêm vào F-277 scope).

> **E2E / Manual Testing**
> - Test trên cả web và mobile client: nhập credentials → nhập TOTP code từ Google Authenticator / Authy → nhận JWT.
> - Test scenario: user reset TOTP → đăng nhập lại.
> - Test scenario: server restart trong quá trình login → trạng thái không bị mất.
