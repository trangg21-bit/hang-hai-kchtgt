---
id: F-274
name: Quản lý JWT session
slug: quan-ly-jwt-session
module-id: M-010
status: done
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-25T09:18:36Z
stage: completed
locked-fields: []
consumed_by_modules: []
qa-verdict: Pass
qa-notes: 86
qa-pass-rate: 100
---
# Feature: Quản lý JWT session

## Description

JWT, auto-refresh, auto-logout timeout

## Business Intent

JWT, auto-refresh, auto-logout timeout

## Flow Summary

JWT, auto-refresh, auto-logout timeout

## Acceptance Criteria

- Xác thực JWT mới request
- Auto-refresh
- Auto-logout

## In Scope

- Sinh JWT Access Token (thời hạn ngắn, ví dụ 15 phút) sau đăng nhập thành công (F-272, F-273)
- Sinh JWT Refresh Token (thời hạn dài hơn, ví dụ 7 ngày) đi kèm Access Token
- Lưu Refresh Token có bảo mật (hash + salt, mã hóa ở trạng thái nghỉ) trong DB, liên kết với user + device/session metadata
- Middleware xác thực JWT Access Token trên mọi request được bảo vệ
- Tự động refresh Access Token khi hết hạn bằng Refresh Token (endpoint `/api/auth/refresh`)
- Auto-logout: thu hồi toàn bộ session khi phát hiện nghi ngờ bị chiếm dụng (Refresh Token bị reuse sau khi logout)
- Thu hồi JWT Access Token (blacklist/in-memory cache) khi user logout thủ công hoặc admin thu hồi
- Cập nhật payload JWT: userId, roles, permissions (từ F-275) vào mỗi lần refresh
- JWT signing key quản lý bằng environment variable (Spring Boot properties), không hardcoded
- Support HTTP-only Secure cookies cho Refresh Token (chống XSS steal)
- JWT validation: kiểm tra exp, nbf, iss, aud, signature
- Ghi log sự kiện JWT (create, refresh, revoke, expired) vào audit log

## Out of Scope

- Server-side token storage full (Redis/memcached) — chỉ lưu hash Refresh Token trong DB (F-274 này chỉ định nghĩa cơ chế, infra chi tiết thuộc về hạ tầng chung)
- Refresh token rotation policy nâng cao (revoke-old + issue-new strict) — tối thiểu reuse detection là đủ cho Phase 1
- Fingerprinting/Device binding nâng cao — chỉ lưu device metadata (User-Agent, IP) trong session record, không dùng fingerprint crypto
- Token encryption at rest (JWE) — chỉ sign (JWT compact), không mã hóa payload toàn bộ
- Single Sign-On (SSO) / OpenID Connect / OAuth 2.0 authorization code flow
- Third-party identity providers (Google, Facebook, Microsoft login) — thuộc feature riêng
- Token-based API rate limiting — thuộc về F-277 (chính sách giới hạn đăng nhập sai)
- Session management UI dashboard cho admin (quản lý session active) — thuộc feature UI riêng, backend chỉ cung cấp API
- Biometric authentication, WebAuthn, Passkeys — thuộc về F-272/F-273
- JWT algorithm switching (RS256, ES256) — Phase 1 dùng HS256, nâng cấp sau
- Client-side JWT storage logic (localStorage vs sessionStorage) — backend chỉ định nghĩa cookie policy, client thực hiện lưu trữ
- Cross-domain JWT sharing (subdomain token propagation) — không áp dụng cho Phase 1

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Anonymous (Chưa xác thực) | 0 | Không có quyền truy cập, chỉ gọi được `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh` |
| User (Người dùng) | 1 | Có access token hợp lệ, truy cập tài nguyên công cộng và tài nguyên thuộc quyền sở hữu của mình. JWT payload chứa `{ sub, roles: ["USER"], permissions: [...] }` |
| Admin (Quản trị viên) | 2 | Có access token hợp lệ, truy cập thêm các tài nguyên quản trị. JWT payload chứa `{ sub, roles: ["USER", "ADMIN"], permissions: [...] }` |
| Super Admin (Quản trị hệ thống) | 3 | Có full quyền quản lý session, thu hồi token của bất kỳ user nào, quản lý chính sách JWT. JWT payload chứa `{ sub, roles: ["USER", "ADMIN", "SUPER_ADMIN"], permissions: ["JWT_REVOKE_ALL", "JWT_POLICY_MANAGE"] }` |

> **Notes:**
> - Phân quyền chi tiết 3 mức được định nghĩa tại F-275. F-274 chỉ đảm bảo payload JWT mang đúng claims về roles/permissions.
> - Tất cả roles đều cần JWT hợp lệ để truy cập bất kỳ endpoint nào ngoài `/auth/**`.
> - Super Admin có capability đặc biệt là `JWT_REVOKE_ALL` để thu hồi toàn bộ session của một user.

## Entities

| Entity | Key Fields | Description |
|---|---|---|
| **JwtSession** | id (UUID), userId (FK → User), refreshTokenHash (VARCHAR(512)), refreshTokenSalt (VARCHAR(256)), sessionId (VARCHAR(128)), userAgent, deviceFingerprint (nullable), ipAddress, createdAt, expiresAt, lastUsedAt, isRevoked (BOOLEAN), revokedAt (nullable), status (ACTIVE/REVOKED/EXPIRED) | Lưu trữ Refresh Token có bảo mật, mỗi session tương ứng 1 cặp token. Dùng để detect reuse và thu hồi. |
| **JwtTokenRevocation** | id (UUID), userId (FK → User), sessionId (nullable), reason (enum: USER_LOGOUT, ADMIN_REVOKE, SUSPICIOUS_REUSE, SYSTEM_PURGE), revokedAt (TIMESTAMP), revokedBy (FK → User, nullable) | Audit log cho mọi lần thu hồi token. Dùng cho phân tích bảo mật và troubleshooting. |
| **JwtSigningKey** | id (UUID), algorithm (HS256), keyVersion (int), createdAt, expiresAt, isActive (BOOLEAN) | Quản lý vòng đời signing key. Hỗ trợ key rotation khi cần (Phase 2). |
| **User** (existing, referenced) | id (UUID), email, passwordHash, createdAt, status (ACTIVE/LOCKED/SUSPENDED) | Entity có sẵn từ F-271/F-272. JWT session liên kết với entity này qua userId. |
| **Role** (existing, referenced) | id (UUID), name (USER/ADMIN/SUPER_ADMIN), description, level (1/2/3) | Entity có sẵn từ F-275. JWT payload chứa danh sách roles. |
| **Permission** (existing, referenced) | id (UUID), roleId (FK), action, resource, description | Entity có sẵn từ F-275. JWT payload chứa danh sách permissions. |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-274-01 | Access Token có thời hạn 15 phút (900 giây). Khi hết hạn, client phải gọi `/api/auth/refresh` để lấy token mới. | JWT lifecycle | Security best practice (OWASP) |
| BR-274-02 | Refresh Token có thời hạn 7 ngày. Hết hạn → user phải đăng nhập lại (F-272/F-273). | JWT lifecycle | Security policy |
| BR-274-03 | Refresh Token được hash với salt trước khi lưu vào DB. Giá trị plaintext chỉ tồn tại trong response và memory ngắn hạn. | JwtSession | Security best practice |
| BR-274-04 | Nếu một Refresh Token được sử dụng sau khi đã logout → toàn bộ sessions của user đó bị thu hồi (invalidate all). Cảnh báo bảo mật được ghi nhận. | JwtSession | Anti-session-hijack |
| BR-274-05 | Mỗi logout chỉ thu hồi session tương ứng với Refresh Token được gửi trong request (không revoke all). Admin/Super Admin mới có quyền revoke all. | JwtSession | F-275 permission model |
| BR-274-06 | JWT payload luôn chứa `sub` (userId), `roles` (array), và `permissions` (array). Các claims được update mỗi lần refresh. | JWT creation | F-275 integration |
| BR-274-07 | Refresh Token phải được gửi qua cookie HTTPOnly + Secure + SameSite=Strict (hoặc Lax tùy context). Không lưu ở client-side storage. | Token transmission | OWASP Secure Cookie guidelines |
| BR-274-08 | JWT signing key được lưu trong environment variable (`JWT_SIGNING_KEY`), tối thiểu 256 bit cho HS256. Không commit key vào source code. | Key management | M-010 security policy |
| BR-274-09 | Mỗi request đến endpoint được bảo vệ cần validate: signature, expiration, algorithm. Reject ngay nếu bất kỳ bước nào fail. | Token validation | JWT spec (RFC 7519) |
| BR-274-10 | Không được thêm sensitive data (password, TOTP secret, personal info) vào JWT payload. JWT chỉ chứa identifier + authorization claims. | Payload design | Security best practice |
| BR-274-11 | Token revocation cache (in-memory) có TTL 5 phút. Sau đó cần fallback kiểm tra JwtTokenRevocation table hoặc JwtSession.isRevoked. | Revocation | Performance + correctness tradeoff |
| BR-274-12 | Hệ thống chỉ hỗ trợ HS256 (HMAC-SHA256) cho Phase 1. Chuyển đổi sang RS256/ES256 thuộc Phase 2. | Algorithm | M-010 roadmap |

## Testing Strategy

> **Chú ý:** Theo QA Gate Rules (AGENTS.md), verdict "Pass" chỉ đạt khi có test results thực tế với pass/fail counts.

### Unit Tests (Mục tiêu >95% pass rate)

| Test ID | Description | Expected |
|---|---|---|
| UT-274-01 | TokenService.createAccessToken(): tạo JWT hợp lệ với đúng claims (sub, roles, permissions) | Token hợp lệ, exp = now + 900s |
| UT-274-02 | TokenService.createRefreshToken(): tạo token dài hạn, sinh salt+hash | Hash khớp, plaintext chỉ trả về 1 lần |
| UT-274-03 | TokenService.validateToken(): với token hợp lệ, expired, wrong signature, wrong algorithm | Đúng/fail tương ứng |
| UT-274-04 | TokenService.refreshAccessToken(): với refresh token hợp lệ + chưa reuse | Access token mới, refresh token same |
| UT-274-05 | TokenService.revokeSession(): thu hồi session theo id, cập nhật isRevoked + tạo revocation log | Session revoked, log created |
| UT-274-06 | JwtSessionRepository.findActiveByUserId(): query đúng sessions active của user | Đúng danh sách |
| UT-274-07 | JwtSessionRepository.findRevokedTokens(): query token đã revoke | Đúng danh sách |
| UT-274-08 | Cookie builder: tạo HTTPOnly + Secure + SameSite cookie | Correct attributes set |

### Integration Tests (Mục tiêu >90% pass rate)

| Test ID | Description | Expected |
|---|---|---|
| IT-274-01 | POST /api/auth/login → nhận accessToken + refreshToken cookies | HTTP 200, tokens present |
| IT-274-02 | POST /api/auth/refresh với valid refreshToken → nhận accessToken mới | HTTP 200, old refresh still valid |
| IT-274-03 | POST /api/auth/refresh với expired refreshToken | HTTP 401, session revoked |
| IT-274-04 | POST /api/auth/refresh với reused refreshToken (sau logout) | HTTP 401, all sessions revoked, security alert |
| IT-274-05 | POST /api/auth/logout → thu hồi session hiện tại | HTTP 200, session revoked |
| IT-274-06 | Protected API endpoint với expired accessToken + valid refreshToken | Tự động redirect/refresh, HTTP 200 |
| IT-274-07 | Protected API endpoint với tampered accessToken | HTTP 401, validation fail |
| IT-274-08 | Protected API endpoint với missing Authorization cookie | HTTP 401, no token |
| IT-274-09 | JWT signing key thay đổi → tất cả token cũ invalidate | HTTP 401 cho old tokens |

### E2E / Security Tests

| Test ID | Description | Expected |
|---|---|---|
| E2E-274-01 | Full flow: register (F-271) → first login + TOTP (F-272) → refresh → logout → reuse token | Token revoked, security alert |
| E2E-274-02 | XST attempt: access token trong localStorage (should not be accessible via JS when cookie HTTPOnly) | window.localStorage không đọc được |
| E2E-274-03 | CSRF protection: cross-origin request không có cookie | HTTP 403 |
| E2E-274-04 | Concurrent sessions: 2 devices cùng login, logout 1 device, device còn lại vẫn hoạt động | Device còn lại vẫn có access |
| E2E-274-05 | Bulk revocation: Super Admin revoke all sessions của user → tất cả token invalidate | HTTP 401 cho tất cả old tokens |

### Test Execution SOP (AGENTS.md Rule 2)

```
Dev code xong → QA chạy `mvn test` → QA chạy `mvn verify` (integration) → QA chạy smoke tests → QA verdict
```

QA phải return evidence trong verdict:
```json
{
  "verdict": "Pass|Fail",
  "structured_summary": {
    "test_results": {
      "unit_tests": { "total": <count>, "passed": <count>, "failed": <count>, "pass_rate": "<percent>" },
      "integration_tests": { "total": <count>, "passed": <count>, "failed": <count>, "pass_rate": "<percent>" }
    }
  }
}
```

### Performance / Load Considerations (QA verification)

| Scenario | Metric | Threshold |
|---|---|---|
| JWT create + sign | Latency p99 | <10ms |
| JWT validate (in-memory) | Latency p99 | <5ms |
| Refresh endpoint throughput | Requests/sec | >1000 RPS |
| Token revocation cache hit ratio | Cache hit | >95% |
