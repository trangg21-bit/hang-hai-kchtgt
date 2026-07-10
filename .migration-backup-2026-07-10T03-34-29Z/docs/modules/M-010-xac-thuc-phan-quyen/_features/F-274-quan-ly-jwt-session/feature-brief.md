---
id: F-274
name: Quản lý JWT session
slug: quan-ly-jwt-session
module-id: M-010
status: done
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
stage: completed
qa-verdict: Pass
qa-notes: 86
qa-pass-rate: 100
---
# Feature: Quản lý JWT session

## Description
Cơ chế quản lý vòng đời token xác thực dựa trên JSON Web Token (JWT) và Refresh Token, bao gồm việc sinh Access Token ngắn hạn (15 phút) sau đăng nhập thành công (F-272/F-273), sinh đi kèm Refresh Token dài hạn (7 ngày) gửi qua cookie HTTP-only Secure, middleware tự động validate và refresh Access Token khi hết hạn, cơ chế thu hồi toàn bộ session khi phát hiện nghi ngờ bị chiếm dụng (reuse detection), và thu hồi thủ công khi user logout. JWT payload chứa userId, roles, và permissions (từ F-275), được ký bằng HS256 với signing key quản lý qua environment variable.

## Business Intent
Đảm bảo người dùng luôn có phiên làm việc an toàn, tự động làm mới token mà không cần đăng nhập lại, đồng thời thu hồi ngay lập tức mọi session khi có dấu hiệu bị chiếm dụng tài khoản. Giảm thiểu rủi ro token bị đánh cắp thông qua cơ chế short-lived Access Token + secure cookie Refresh Token, và cung cấp khả năng kiểm soát phiên làm việc cho admin (Super Admin) khi cần thu hồi hàng loạt.

## Flow Summary
```
  POST /auth/login (F-272/F-273)
         ↓
  Server sinh Access Token (exp=15p) + Refresh Token (exp=7d)
         ↓
  Access Token → trả về response body (JSON)
  Refresh Token → set HttpOnly+Secure+SameSite cookie
  Refresh Token hash + salt → lưu vào JwtSession table trong DB
         ↓
  Client gửi request có bảo vệ: Authorization: Bearer {accessToken}
         ↓
  JWT Middleware:
    - Validate signature (HS256, key từ env)
    - Validate exp, nbf, iss, aud
    - Check revocation cache (in-memory TTL 5p)
    - Nếu hợp lệ → cho request tiếp tục
    - Nếu hết hạn → client gọi POST /api/auth/refresh
         ↓
  POST /api/auth/refresh { refreshToken }
    - Server lookup refreshTokenHash trong JwtSession
    - Nếu match + chưa revoked → sinh Access Token mới
    - Nếu expired hoặc revoked → revoke ALL sessions của user, HTTP 401
    - Ghi log: token_create, token_refresh, token_revoke
         ↓
  POST /api/auth/logout
    - Server revoke session tương ứng với Refresh Token gửi trong cookie
    - Tạo JwtTokenRevocation record (reason=USER_LOGOUT)
    - Nếu Super Admin gọi revoke all → thu hồi toàn bộ sessions của user
```

## Acceptance Criteria
- Access Token được sinh với thời hạn 15 phút, chứa claims sub(userId), roles, permissions từ F-275.
- Refresh Token được sinh với thời hạn 7 ngày, hash + salt trước khi lưu vào DB — plaintext không tồn tại sau response.
- Middleware tự động validate JWT trên mọi protected endpoint: signature, expiration, algorithm.
- Khi Access Token hết hạn, endpoint /api/auth/refresh sinh Access Token mới từ Refresh Token hợp lệ.
- Nếu Refresh Token bị reuse sau logout → toàn bộ sessions của user bị thu hồi (revoke all).
- Logout thu hồi session hiện tại và tạo revocation log record.
- Super Admin có capability JWT_REVOKE_ALL để thu hồi toàn bộ session của bất kỳ user.
- Signing key quản lý qua environment variable (JWT_SIGNING_KEY, ≥ 256 bit cho HS256).
- JWT payload không chứa sensitive data (password, TOTP secret, personal info).

## In Scope
- **Sinh Access Token (F-272/F-273)**: HS256 ký, exp=15 phút, payload chứa {sub, roles, permissions, iat, exp, jti}.
- **Sinh Refresh Token**: cryptographically random 256-bit token, hash + salt trước khi lưu vào JwtSession.
- **Lưu Refresh Token có bảo mật**: hash + salt trong DB, mỗi session tương ứng 1 cặp token.
- **Middleware xác thực JWT**: validate signature, exp, nbf, iss, aud trên mọi request protected.
- **Tự động refresh Access Token**: endpoint /api/auth/refresh sinh token mới từ Refresh Token hợp lệ.
- **Auto-logout / revoke all**: khi phát hiện reuse sau logout → invalidate toàn bộ sessions của user, cảnh báo bảo mật.
- **Thu hồi thủ công**: user logout thu hồi session hiện tại; Super Admin revoke all sessions của user khác.
- **Cập nhật JWT payload**: mỗi lần refresh, payload được cập nhật với roles/permissions mới nhất từ F-275.
- **Cookie security**: Refresh Token gửi qua HttpOnly + Secure + SameSite cookie, chống XSS steal.
- **JWT validation**: kiểm tra signature (HS256), exp, nbf, iss, aud — reject nếu bất kỳ bước nào fail.
- **Audit logging**: ghi nhận create, refresh, revoke, expired vào JwtTokenRevocation table.

## Out of Scope
- Server-side token storage full (Redis/memcached) — chỉ lưu hash Refresh Token trong DB.
- Refresh token rotation policy nâng cao (revoke-old + issue-new strict) — tối thiểu reuse detection cho Phase 1.
- Fingerprinting/Device binding nâng cao — chỉ lưu device metadata (User-Agent, IP) trong session.
- Token encryption at rest (JWE) — chỉ sign (JWT compact), không mã hóa payload.
- Single Sign-On (SSO) / OpenID Connect / OAuth 2.0 authorization code flow.
- Third-party identity providers (Google, Facebook, Microsoft).
- Token-based API rate limiting — thuộc F-277.
- Session management UI dashboard cho admin — thuộc feature UI riêng.
- Biometric authentication, WebAuthn, Passkeys.
- JWT algorithm switching (RS256, ES256) — Phase 1 dùng HS256, nâng cấp sau.
- Client-side JWT storage logic (localStorage vs sessionStorage).
- Cross-domain JWT sharing.

## Roles + Permissions

| Role | Level | Permissions |
|------|-------------|
| Anonymous (Chưa xác thực) | 0 | Gọi được /api/auth/login, /api/auth/register, /api/auth/refresh — không truy cập tài nguyên protected. |
| User (Người dùng) | 1 | Có access token hợp lệ, truy cập tài nguyên công cộng và tài nguyên thuộc quyền sở hữu. JWT payload: {sub, roles: ["USER"], permissions: [...]}. |
| Admin (Quản trị viên) | 2 | Có access token hợp lệ, truy cập thêm tài nguyên quản trị. JWT payload: {sub, roles: ["USER", "ADMIN"], permissions: [...]}. |
| Super Admin (Quản trị hệ thống) | 3 | Full quyền quản lý session, thu hồi token của bất kỳ user, quản lý chính sách JWT. JWT payload: {sub, roles: ["USER", "ADMIN", "SUPER_ADMIN"], permissions: ["JWT_REVOKE_ALL", "JWT_POLICY_MANAGE"]}. |

## Entities
- **JwtSession**: id (UUID), userId (FK → User), refreshTokenHash (VARCHAR 512), refreshTokenSalt (VARCHAR 256), sessionId (VARCHAR 128), userAgent, deviceFingerprint (nullable), ipAddress, createdAt (TIMESTAMP), expiresAt (TIMESTAMP), lastUsedAt (TIMESTAMP), isRevoked (BOOLEAN), revokedAt (nullable), status (ACTIVE/REVOKED/EXPIRED) — lưu trữ Refresh Token có bảo mật, mỗi session tương ứng 1 cặp token, dùng để detect reuse và thu hồi.
- **JwtTokenRevocation**: id (UUID), userId (FK → User), sessionId (nullable), reason (enum: USER_LOGOUT, ADMIN_REVOKE, SUSPICIOUS_REUSE, SYSTEM_PURGE), revokedAt (TIMESTAMP), revokedBy (FK → User, nullable) — audit log cho mọi lần thu hồi token.
- **JwtSigningKey**: id (UUID), algorithm (HS256), keyVersion (int), createdAt (TIMESTAMP), expiresAt (TIMESTAMP), isActive (BOOLEAN) — quản lý vòng đời signing key, hỗ trợ key rotation Phase 2.
- **User** (existing, referenced): id, email, passwordHash, createdAt, status — JWT session liên kết qua userId.
- **Role** (existing, referenced): id, name, description, level — JWT payload chứa danh sách roles.
- **Permission** (existing, referenced): id, roleId, action, resource — JWT payload chứa danh sách permissions.

## Business Rules
1. **(BR-274-01)** Access Token có thời hạn 15 phút (900 giây). Khi hết hạn, client phải gọi /api/auth/refresh để lấy token mới.
2. **(BR-274-02)** Refresh Token có thời hạn 7 ngày. Hết hạn → user phải đăng nhập lại (F-272/F-273).
3. **(BR-274-03)** Refresh Token được hash với salt trước khi lưu vào DB. Giá trị plaintext chỉ tồn tại trong response và memory ngắn hạn.
4. **(BR-274-04)** Nếu một Refresh Token được sử dụng sau khi đã logout → toàn bộ sessions của user đó bị thu hồi (invalidate all). Cảnh báo bảo mật được ghi nhận.
5. **(BR-274-05)** Mỗi logout chỉ thu hồi session tương ứng với Refresh Token được gửi trong request (không revoke all). Admin/Super Admin mới có quyền revoke all.
6. **(BR-274-06)** JWT payload luôn chứa sub (userId), roles (array), và permissions (array). Các claims được update mỗi lần refresh.
7. **(BR-274-07)** Refresh Token phải được gửi qua cookie HTTPOnly + Secure + SameSite=Strict (hoặc Lax tùy context). Không lưu ở client-side storage.
8. **(BR-274-08)** JWT signing key được lưu trong environment variable (JWT_SIGNING_KEY), tối thiểu 256 bit cho HS256. Không commit key vào source code.
9. **(BR-274-09)** Mỗi request đến endpoint được bảo vệ cần validate: signature, expiration, algorithm. Reject ngay nếu bất kỳ bước nào fail.
10. **(BR-274-10)** Không được thêm sensitive data (password, TOTP secret, personal info) vào JWT payload. JWT chỉ chứa identifier + authorization claims.
11. **(BR-274-11)** Token revocation cache (in-memory) có TTL 5 phút. Sau đó cần fallback kiểm tra JwtTokenRevocation table hoặc JwtSession.isRevoked.
12. **(BR-274-12)** Hệ thống chỉ hỗ trợ HS256 (HMAC-SHA256) cho Phase 1. Chuyển đổi sang RS256/ES256 thuộc Phase 2.

## Testing Strategy
- **Unit tests**: TokenService.createAccessToken() → token hợp lệ với đúng claims (sub, roles, permissions); createRefreshToken() → token dài hạn, sinh salt+hash, hash khớp; validateToken() → đúng/fail cho valid, expired, wrong signature, wrong algorithm; refreshAccessToken() → access token mới khi refresh token hợp lệ; revokeSession() → session revoked, log created.
- **Integration tests**: POST /auth/login → nhận accessToken + refreshToken cookies; POST /auth/refresh với valid refreshToken → nhận accessToken mới; POST /auth/refresh với expired refreshToken → HTTP 401; POST /auth/refresh với reused refreshToken sau logout → HTTP 401, all sessions revoked; POST /auth/logout → thu hồi session hiện tại.
- **E2E tests**: full flow register (F-271) → first login + TOTP (F-272) → refresh → logout → reuse token → token revoked, security alert; XST attempt: access token trong localStorage không đọc được qua JS khi cookie HTTPOnly; CSRF protection: cross-origin request không có cookie → HTTP 403; concurrent sessions: 2 devices cùng login, logout 1 device, device còn lại vẫn hoạt động; bulk revocation: Super Admin revoke all sessions của user → tất cả token invalidate.
- **Performance tests**: JWT create + sign p99 < 10ms; JWT validate (in-memory) p99 < 5ms; Refresh endpoint throughput > 1000 RPS; Token revocation cache hit ratio > 95%.
