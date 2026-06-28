---
id: F-274
name: Quan ly JWT session
slug: quan-ly-jwt-session
module-id: M-010
stage: system-architect
status: proposed
created: 2026-06-23T00:00:00Z
last-updated: 2026-06-23T00:00:00Z
---

# SA Stage: F-274 — Quản lý JWT session

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 JwtSession

LƯU TRỮ Refresh Token dưới dạng hash + salt. Mỗi session tương ứng 1 cặp token (access + refresh). Dùng để detect reuse (BR-274-04) và thu hồi session.

```java
@Entity
@Table(name = "jwt_sessions", indexes = {
    @Index(name = "idx_jwt_sessions_user_id", columnList = "user_id"),
    @Index(name = "idx_jwt_sessions_user_status", columnList = "user_id, status"),
    @Index(name = "idx_jwt_sessions_expires_at", columnList = "expires_at"),
    @Index(name = "idx_jwt_sessions_session_id", columnList = "session_id", unique = true)
})
public class JwtSession {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_jwt_sessions_user"))
    private User user;

    // SHA-256 hash của refreshToken (64 ký tự hex)
    @Column(name = "refresh_token_hash", length = 512, nullable = false)
    private String refreshTokenHash;

    // Random salt dùng cho hash (RFC 5163 / PBKDF2)
    @Column(name = "refresh_token_salt", length = 256, nullable = false)
    private String refreshTokenSalt;

    // sessionId từ JSESSIONID hoặc custom UUID — dùng làm correlation id
    @Column(name = "session_id", length = 128, nullable = false)
    private String sessionId;

    // Metadata từ browser/client
    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    // Dạng string đơn giản: "Chrome/120 Windows 10" — không phải crypto fingerprint
    @Column(name = "device_fingerprint", length = 500)
    private String deviceFingerprint;

    @Column(name = "ip_address", length = 45)  // IPv6 max 45 chars
    private String ipAddress;

    // Token lifecycle
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "is_revoked", columnDefinition = "BIT DEFAULT 0")
    private Boolean isRevoked = false;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    // ACTIVE | REVOKED | EXPIRED
    @Column(name = "status", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = LocalDateTime.now().plusDays(7);
    }

    @PreUpdate
    void onUpdate() {
        lastUsedAt = LocalDateTime.now();
    }
}
```

### 1.2 JwtTokenRevocation

AUDIT LOG cho mọi lần thu hồi token. Không dùng để validate — chỉ dùng cho monitoring, phân tích bảo mật, troubleshooting.

```java
@Entity
@Table(name = "jwt_token_revocations", indexes = {
    @Index(name = "idx_jwt_rev_user_id", columnList = "user_id"),
    @Index(name = "idx_jwt_rev_reason", columnList = "reason"),
    @Index(name = "idx_jwt_rev_revoked_at", columnList = "revoked_at"),
    @Index(name = "idx_jwt_rev_user_reason", columnList = "user_id, reason")
})
public class JwtTokenRevocation {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_jwt_rev_user"))
    private User user;

    // Nullable: null nếu revoke toàn bộ user (revoke all)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id",
            foreignKey = @ForeignKey(name = "fk_jwt_rev_session"))
    private JwtSession session;

    // USER_LOGOUT | ADMIN_REVOKE | SUSPICIOUS_REUSE | SYSTEM_PURGE
    @Column(name = "reason", length = 30, nullable = false)
    private String reason;

    @Column(name = "revoked_at", nullable = false)
    private LocalDateTime revokedAt;

    // null nếu user tự logout, có giá trị nếu admin/Super Admin revoke
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by",
            foreignKey = @ForeignKey(name = "fk_jwt_rev_by"))
    private User revokedBy;

    @Column(name = "details", length = 1000)
    private String details;  // JSON: IP, UA, lý do chi tiết

    @PrePersist
    void onCreate() {
        revokedAt = LocalDateTime.now();
    }
}
```

### 1.3 JwtSigningKey

QUẢN LÝ vòng đời signing key. Phase 1 chỉ dùng 1 key (HS256). Phase 2 hỗ trợ key rotation (nhiều key version cùng tồn tại). Key hiện tại đọc từ env var, key trong DB dùng cho rotation tracking.

```java
@Entity
@Table(name = "jwt_signing_keys", indexes = {
    @Index(name = "idx_jwt_key_version", columnList = "key_version", unique = true),
    @Index(name = "idx_jwt_key_active", columnList = "is_active")
})
public class JwtSigningKey {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false)
    private UUID id;

    // HS256 (Phase 1), RS256/ES256 (Phase 2)
    @Column(name = "algorithm", length = 10, nullable = false)
    private String algorithm = "HS256";

    // Tăng mỗi khi rotate key: 1, 2, 3, ...
    @Column(name = "key_version", nullable = false)
    private Integer keyVersion;

    // Key material — lưu hashed trong DB, plaintext chỉ dùng khi load vào memory
    // Không lưu raw key — thay vào đó lưu fingerprint (SHA-256 của key)
    @Column(name = "key_fingerprint", length = 64, nullable = false)
    private String keyFingerprint;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_active", columnDefinition = "BIT DEFAULT 1")
    private Boolean isActive = true;

    @Column(name = "created_by")
    private String createdBy;  // "SYSTEM" hoặc user ID

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        if (expiresAt == null) expiresAt = LocalDateTime.now().plusYears(1);
    }
}
```

### 1.4 Relationship Diagram

```
User 1──N JwtSession          (mỗi user có thể có nhiều session — multi-device)
User 1──N JwtTokenRevocation  (mọi revocation đều gắn với user)
JwtSession 1──N JwtTokenRevocation  (session cụ thể bị revoke)
JwtSigningKey 1──N JwtSigningKey  (chồng lấn — key cũ + mới cùng active khi rotate)
```

### 1.5 Entity Relationship Summary

```
┌──────────────┐       ┌───────────────┐       ┌───────────────┐
│    User      │       │  JwtSession   │       │JwtTokenRevoc. │
│──────────────│       │───────────────│       │───────────────│
│ id (UUID)    │ 1   N │ id (UUID)     │ 1   N │ id (UUID)     │
│ email        │───────│ user_id (FK)  │───────│ user_id (FK)  │
│ passwordHash │       │ refreshToken  │       │ session_id(FK)│
│ status       │       │   _hash       │       │ reason        │
│ createdAt    │       │ refreshToken  │       │ revoked_at    │
└──────────────┘       │   _salt       │       │ revoked_by(FK)│
                       │ sessionId     │       │ details       │
                       │ userAgent     │       └───────────────┘
                       │ deviceFprint  │
                       │ ipAddress     │
                       │ expiresAt     │
                       │ lastUsedAt    │
                       │ isRevoked     │
                       │ revokedAt     │
                       │ status        │
                       │ createdAt     │
                       └───────────────┘
                               │
                       ┌───────────────┐
                       │JwtSigningKey  │
                       │───────────────│
                       │ id (UUID)     │
                       │ algorithm     │
                       │ keyVersion    │
                       │ keyFingerprint│
                       │ createdAt     │
                       │ expiresAt     │
                       │ is_active     │
                       └───────────────┘
```

## 2. API Endpoints

All endpoints prefixed with `/api/auth/`. Token transmission via HTTP-only secure cookies (BR-274-07).

### 2.1 Authentication Endpoints (Public)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Đăng nhập — trả accessToken (body) + refreshToken (HTTP-only cookie) | Public |
| `POST` | `/api/auth/refresh` | Làm mới accessToken bằng refreshToken cookie | Public (refreshToken cookie) |
| `POST` | `/api/auth/logout` | Thu hồi session hiện tại, xóa refreshToken cookie | JWT (access token) |

#### POST `/api/auth/login`

```
Request Body:
{
  "email": "string (required)",
  "password": "string (required)",
  "totpCode": "string (optional — nếu user đã bật 2FA)"
}

Response 200 OK:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",       // ngắn hạn — 15 phút
    "refreshToken": null                      // KHÔNG trả về body — chỉ qua cookie
  },
  "cookies": {
    "refreshToken": {
      "value": "eyJhbGciOiJIUzI1NiIs...",
      "httpOnly": true,
      "secure": true,
      "sameSite": "Strict",
      "path": "/",
      "maxAge": 604800                        // 7 ngày (seconds)
    }
  }
}

Response 401 Unauthorized:
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Sai thông tin đăng nhập"
  }
}

Response 403 Forbidden (2FA required):
{
  "success": false,
  "error": {
    "code": "TOTP_REQUIRED",
    "message": "Yêu cầu xác thực TOTP",
    "requiresTotp": true
  }
}
```

#### POST `/api/auth/refresh`

```
Request:
- Cookie: refreshToken = "eyJhbGciOiJIUzI1NiIs..." (HTTP-only)

Response 200 OK:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0..."
  },
  "cookies": {
    "refreshToken": {
      "value": "eyJhbGciOiJIUzI1NiIs...",       // same refresh token (không rotate Phase 1)
      "httpOnly": true,
      "secure": true,
      "sameSite": "Strict",
      "path": "/",
      "maxAge": 604800
    }
  }
}

Response 401 Unauthorized (expired / revoked / reused token):
{
  "success": false,
  "error": {
    "code": "REFRESH_TOKEN_INVALID",
    "message": "Refresh token không hợp lệ hoặc đã hết hạn",
    "allSessionsRevoked": true  // true nếu phát hiện reuse (BR-274-04)
  }
}
```

#### POST `/api/auth/logout`

```
Request:
- Header: Authorization: Bearer <accessToken>
- Cookie: refreshToken

Response 200 OK:
{
  "success": true,
  "message": "Đăng xuất thành công",
  "cookies": {
    "refreshToken": {
      "value": "",
      "httpOnly": true,
      "secure": true,
      "sameSite": "Strict",
      "path": "/",
      "maxAge": 0                    // xóa cookie
    }
  }
}
```

### 2.2 Admin Endpoints (Super Admin — JWT required)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/auth/sessions?userId=&status=&page=&size=` | Danh sách session của user | JWT + `JWT_POLICY_MANAGE` |
| `POST` | `/api/auth/sessions/revoke-all?userId=` | Thu hồi toàn bộ session user | JWT + `JWT_REVOKE_ALL` |
| `DELETE` | `/api/auth/sessions/{sessionId}` | Thu hồi 1 session cụ thể | JWT + `JWT_REVOKE_ALL` |
| `GET` | `/api/auth/revocations?userId=&reason=&page=&size=` | Lịch sử thu hồi token | JWT + `JWT_POLICY_MANAGE` |
| `GET` | `/api/auth/signing-keys` | Danh sách signing keys | JWT + `JWT_POLICY_MANAGE` |
| `POST` | `/api/auth/signing-keys/rotate` | Rotate signing key | JWT + `JWT_POLICY_MANAGE` |

#### POST `/api/auth/sessions/revoke-all`

```
Request:
  Query: userId=UUID

Response 200 OK:
{
  "success": true,
  "data": {
    "revokedCount": 5,
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2.3 Protected Endpoints (all authenticated)

Mọi endpoint khác trong hệ thống (không nằm trong `/api/auth/**`) đều:
1. Đòi hỏi JWT Bearer token trong header `Authorization`
2. JWT validation chạy qua middleware `JwtAuthenticationFilter`
3. Nếu access token hết hạn → client tự động gọi `/api/auth/refresh` (auto-refresh)

## 3. Architecture Design

### 3.1 Component Interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client (ReactJS / SPA)                     │
│  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────┐ │
│  │ Login UI │→ │ Auth Store│→ │ API Client│→ │ Auto-refresh  │ │
│  └──────────┘  └───────────┘  └───────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  /api/auth/login    │
                    │  /api/auth/refresh  │
                    │  /api/auth/logout   │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────────────┐
│                         Spring Boot                               │
│  ┌────────────────────────┴──────────────────────────────────────┐  │
│  │              SecurityFilterChain                              │  │
│  │  ┌────────────────────┐  ┌──────────────────────────────┐    │  │
│  │  │ JwtAuthentication   │  │ CookieRefreshTokenFilter     │    │  │
│  │  │ Filter              │  │ (detects refresh in cookie)  │    │  │
│  │  │ (Bearer token)      │  │                              │    │  │
│  │  └────────┬───────────┘  └──────────────┬───────────────┘    │  │
│  │           │                              │                    │  │
│  │           ▼                              ▼                    │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │              AuthController                           │    │  │
│  │  │  + login()  ──► AuthService ──► TokenService          │    │  │
│  │  │  + refresh() ──► AuthService ──► TokenService          │    │  │
│  │  │  + logout()  ──► AuthService ──► SessionService        │    │  │
│  │  └───────────────────┬──────────────────────────────────┘    │  │
│  │                      │                                        │  │
│  │  ┌───────────────────┴──────────────────────────────────┐    │  │
│  │  │              Core Services                            │    │  │
│  │  │  ┌────────────────────────────────────────────────┐  │    │  │
│  │  │  │ TokenService                                   │  │    │  │
│  │  │  │ • createAccessToken(userId, roles, perms)      │  │    │  │
│  │  │  │ • createRefreshToken() → returns (token, hash) │  │    │  │
│  │  │  │ • validateAccessToken(jwt) → Claims            │  │    │  │
│  │  │  │ • refreshAccessToken(refreshTokenValue)        │  │    │  │
│  │  │  │ • revokeSession(sessionId, revokedBy)          │  │    │  │
│  │  │  └────────────────────────────────────────────────┘  │    │  │
│  │  │  ┌────────────────────────────────────────────────┐  │    │  │
│  │  │  │ SessionService                                 │  │    │  │
│  │  │  │ • createSession(userId, refreshTokenHash, ...) │  │    │  │
│  │  │  │ • findSessionByHash(refreshTokenHash)          │  │    │  │
│  │  │  │ • revokeByUserId(userId, reason)               │  │    │  │
│  │  │  │ • detectReuse(oldHash, newHash) → boolean      │  │    │  │
│  │  │  └────────────────────────────────────────────────┘  │    │  │
│  │  │  ┌────────────────────────────────────────────────┐  │    │  │
│  │  │  │ RevocationCache (in-memory, Caffeine)          │  │    │  │
│  │  │  │ • TTL: 5 phút (BR-274-11)                     │  │    │  │
│  │  │  │ • Key: jwtTokenId | userId                    │  │    │  │
│  │  │  └────────────────────────────────────────────────┘  │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │              Repositories                             │    │  │
│  │  │  JwtSessionRepository         JwtTokenRevocationRepo  │    │  │
│  │  │  JwtSigningKeyRepository      ──► MSSQL (JPA/Hibernate)│   │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
│  │                                                              │  │
│  │  ┌──────────────────────────────────────────────────────┐    │  │
│  │  │              Event Listeners                          │    │  │
│  │  │  SessionRevokedListener → ApplicationEvent → F-005   │    │  │
│  │  └──────────────────────────────────────────────────────┘    │  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Request Flow Diagrams

#### Login Flow

```
Client                 AuthController         AuthService         TokenService       SessionService       UserRepo
  │                        │                       │                    │                   │                │
  │ POST /api/auth/login   │                       │                    │                   │                │
  │ ──────────────────────►│                       │                    │                   │                │
  │                        │ authenticate(email,pwd)│                    │                   │                │
  │                        │ ──────────────────────►│                    │                   │                │
  │                        │                       │ loadUserById()     │                   │                │
  │                        │                       │ ─────────────────►│                   │                │
  │                        │                       │                    │ createAccessToken │                │
  │                        │                       │                    │ ────────────────►│                │
  │                        │                       │                    │◄──────────────────│ accessToken    │
  │                        │                       │                    │ createRefreshToken│                │
  │                        │                       │                    │ ────────────────►│                │
  │                        │                       │                    │◄──────────────────│ (token, hash)  │
  │                        │                       │                    │ createSession()   │                │
  │                        │                       │                    │ ────────────────►│                │
  │                        │                       │                    │◄──────────────────│ session (saved)│
  │                        │                       │                    │ auditLog()        │                │
  │                        │                       │                    │ ◄───────────────►│                │
  │                        │                       │                    │                  │                │
  │ 200 OK + tokens        │                       │                    │                   │                │
  │ ◄─────────────────────│                       │                    │                   │                │
```

#### Refresh Flow (with reuse detection)

```
Client                AuthController        AuthService          SessionService          JwtSessionRepo
  │                        │                    │                      │                      │
  │ POST /api/auth/refresh │                    │                      │                      │
  │ ──────────────────────►│                      │                      │                      │
  │                        │ extractRefreshToken │                      │                      │
  │                        │ ──────────────────►│                      │                      │
  │                        │                    │ hashValue(refresh)   │                      │
  │                        │                    │ ────────────────────►│                      │
  │                        │                    │                      │ findSessionByHash()   │
  │                        │                    │                      │ ────────────────────►│
  │                        │                    │                      │ ◄────────────────────│
  │                        │                    │                      │ session found         │
  │                        │                    │                      │                      │
  │                        │                    │ check: reused?       │                      │
  │                        │                    │ ◄───────────────────│                      │
  │                        │                    │                      │                      │
  │  ┌────────────────────┴──── reuse detected ─┴────────────────────┘                      │
  │  │ (BR-274-04)                                                                           │
  │  │                                                                                       │
  │  │ revokeAll(userId, SUSPICIOUS_REUSE)  ◄───────────────────────────────────────────────│
  │  │ createRevocationLog()          ◄──────────────────────────────────────────────────────│
  │  │ invalidateRevocationCache()                                                                   │
  │  │                                                                                       │
  │  │ 401 + allSessionsRevoked=true ◄───────────────────────────────────────────────────────│
  │                                                                                           │
  │  └───────────────────────────────────────────────────────────────────────────────────────┘
  │                                                                                           │
  │  (normal case — no reuse)                                                                 │
  │                                                                                           │
  │  createNewAccessToken(userId)         ◄───────────────────────────────────────────────────│
  │  updateLastUsed(session)              ◄───────────────────────────────────────────────────│
  │  createRevocationLog(REFRESH)         ◄───────────────────────────────────────────────────│
  │                                                                                           │
  │  200 + new accessToken            ◄───────────────────────────────────────────────────────│
```

#### Logout Flow

```
Client                AuthController        AuthService          SessionService          JwtSessionRepo
  │                        │                    │                      │                      │
  │ POST /api/auth/logout  │                    │                      │                      │
  │ ──────────────────────►│                      │                      │                      │
  │                        │ extract sessionId    │                      │                      │
  │                        │ ──────────────────►│                      │                      │
  │                        │                    │ revokeSession()      │                      │
  │                        │                    │ ────────────────────►│                      │
  │                        │                    │                      │ setRevoked(true)      │
  │                        │                    │                      │ ────────────────────►│
  │                        │                    │                      │ ◄────────────────────│
  │                        │                    │                      │ createRevocationLog() │
  │                        │                    │                      │ ◄────────────────────│
  │                        │                    │                      │ invalidateCache()     │
  │                        │                    │                      │ ◄────────────────────│
  │                        │                    │                      │                      │
  │ 200 + cookie cleared   │                      │                      │                      │
  │ ◄─────────────────────│                      │                      │                      │
```

### 3.3 Middleware Architecture (Spring Security Filter Chain)

```
SecurityFilterChain (auth-filter-chain):

  ┌─────────────────────────────────────────────────────────────────────┐
  │ 1. CsrfFilter (Spring Security default)                              │
  │    - CSRF protection cho non-GET requests (SameSite=Strict giúp)     │
  └───────────────────────────────┬─────────────────────────────────────┘
                                   │
  ┌────────────────────────────────┴─────────────────────────────────────┐
  │ 2. CookieRefreshTokenFilter                                            │
  │    - Intercept request BEFORE JwtAuthenticationFilter                   │
  │    - Nếu request có refreshToken cookie + path = /api/auth/refresh    │
  │    - Trích token, hash, delegating xác thực → set SecurityContext     │
  │    - Nếu thành công: set authentication với role ANONYMOUS +          │
  │      authorities từ session metadata (cho /refresh endpoint)          │
  └───────────────────────────────┬─────────────────────────────────────┘
                                   │
  ┌────────────────────────────────┴─────────────────────────────────────┐
  │ 3. JwtAuthenticationFilter                                            │
  │    - Extract Authorization: Bearer <token> header                     │
  │    - TokenService.validateAccessToken()                              │
  │    - Nếu hợp lệ: load User → set SecurityContext                    │
  │    - Nếu fail: return 401, không chuyển filter tiếp                  │
  │    - Nếu missing: anonymous → cho phép /api/auth/**                  │
  └───────────────────────────────┬─────────────────────────────────────┘
                                   │
  ┌────────────────────────────────┴─────────────────────────────────────┐
  │ 4. RequestCacheFilter (optional — lưu request bị deny cho redirect)   │
  └───────────────────────────────┬─────────────────────────────────────┘
                                   │
  ┌────────────────────────────────┴─────────────────────────────────────┐
  │ 5. FilterSecurityInterceptor                                        │
  │    - Method-level @PreAuthorize / @Secured                           │
  │    - Kiểm tra role/permission từ JWT payload                         │
  └──────────────────────────────────────────────────────────────────────┘
```

**Filter Ordering Priority:**
```java
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           CookieRefreshTokenFilter cookieRefreshFilter,
                                           JwtAuthenticationFilter jwtFilter) throws Exception {
        return http
            .csrf(csrf -> csrf
                .disable()  // CSRF bảo vệ bởi SameSite=Strict + cookie policy
            )
            .sessionManagement(s -> s
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — không cần auth
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/refresh").permitAll()
                // Health check
                .requestMatchers("/actuator/health").permitAll()
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(cookieRefreshFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, CookieRefreshTokenFilter.class)
            .build();
    }
}
```

### 3.4 JWT Payload Design

**Access Token Payload (BR-274-01, BR-274-06):**

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1719000000,
  "exp": 1719000900,
  "nbf": 1719000000,
  "iss": "hang-hai-auth-service",
  "aud": "hang-hai-api",
  "jti": "a1b2c3d4-...",          // JWT ID — unique per token (cho revocation cache key)
  "roles": ["USER", "ADMIN"],
  "permissions": ["USER_READ", "USER_WRITE", "ADMIN_DASHBOARD_VIEW"],
  "sessionId": "session-uuid-here"
}
```

**Payload Constraints (BR-274-10):**
- `sub`: UUID của user (không phải email/username)
- `roles`: array từ entity Role (F-275)
- `permissions`: array từ entity Permission (F-275) — được compute mỗi lần refresh
- `jti`: UUID unique per token — dùng làm key trong revocation cache
- `sessionId`: correlation id ↔ JwtSession
- **CẤM:** passwordHash, TOTP secret, personal info, email, phone

### 3.5 Cookie Policy (BR-274-07)

```java
public class CookieConfig {
    // Refresh Token Cookie — truyền qua HTTP-only secure cookie
    // Access Token truyền qua Authorization: Bearer header (body trong login response)
    
    // Cookie Attributes:
    //   httpOnly = true    → JavaScript không thể đọc (chống XSS steal)
    //   secure = true      → Chỉ gửi qua HTTPS (chống MITM)
    //   sameSite = Strict  → Không gửi trong cross-origin request (chống CSRF)
    //   path = /           → Available cho toàn bộ app
    //   maxAge = 604800    → 7 ngày (refresh token lifetime)
    //   charset = UTF-8
    
    public static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
    public static final String CSRF_TOKEN_COOKIE_NAME = "XSRF-TOKEN";  // optional dual-cookie CSRF
    
    public static Cookie buildRefreshTokenCookie(String token) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setSameSite("Strict");
        cookie.setPath("/");
        cookie.setMaxAge(604800);  // 7 days
        cookie.setAttribute("Path", "/");
        cookie.setAttribute("SameSite", "Strict");
        return cookie;
    }
}
```

### 3.6 Revocation Cache Design (BR-274-11)

```
┌──────────────────────────────────────────────────┐
│            RevocationCache (Caffeine)             │
│                                                   │
│  Type: Cache<String, Boolean>                     │
│  Key: "revoked:{jti}"  hoặc  "revoked:user:{id}"  │
│  TTL: 5 phút (300 seconds)                        │
│  Max Size: 100,000 entries                        │
│                                                   │
│  Operations:                                      │
│  ┌────────────────────────────────────────────┐   │
│  │ isRevoked(jti, userId):                    │   │
│  │   1. cache.get("revoked:{jti}")            │   │
│  │   2. Nếu miss → DB check JwtTokenRevoc.    │   │
│  │      WHERE user_id = userId                │   │
│  │        AND reason IN ('SUSPICIOUS_REUSE')  │   │
│  │        AND revoked_at > now - 5min         │   │
│  │   3. Nếu có record → cache.put + return true│  │
│  │   4. Nếu không → cache.put(false)          │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  invalidateAll():                                 │
│   - Called khi key rotation hoặc system event      │
│   - cache.invalidateAll()                          │
└──────────────────────────────────────────────────┘
```

**Caffeine Config:**
```java
@Bean
public Cache<String, Boolean> revocationCache() {
    return Caffeine.newBuilder()
        .maximumSize(100_000)
        .expireAfterWrite(Duration.ofMinutes(5))
        .recordStats()
        .build();
}
```

### 3.7 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `JwtSessionRepository`, `JwtTokenRevocationRepository`, `JwtSigningKeyRepository` — Spring Data JPA |
| **DTO Pattern** | `LoginRequestDTO`, `LoginResponseDTO`, `RefreshRequestDTO`, `RevokeAllRequestDTO`, `SessionResponseDTO` |
| **Strategy Pattern** | `TokenValidationStrategy` — HS256 (Phase 1) → extensible to RS256/ES256 (Phase 2) |
| **Factory Pattern** | `TokenFactory` — tạo accessToken + refreshToken pair atomically |
| **Builder Pattern** | `JwtTokenBuilder` — fluent API để build JWT claims (sub, roles, permissions, sessionId, jti) |
| **Observer Pattern** | `ApplicationEventPublisher` → `SessionRevokedEventListener` → audit log (F-005) |
| **Circuit Breaker** | `Resilience4j` — fallback nếu JWT signing key service unavailable |
| **Memoization** | `RevocationCache` (Caffeine) — in-memory cache cho revoked tokens (BR-274-11) |

### 3.8 Spring Security Configuration

```
SecurityFilterChain:
  → CsrfFilter (disable — protected by SameSite cookie)
  → CookieRefreshTokenFilter (detect refresh token in cookie)
  → JwtAuthenticationFilter (Bearer token validation)
  → FilterSecurityInterceptor (method-level @PreAuthorize)
  → ExceptionTranslationFilter (access denied / auth exception)
```

**Method-level security annotations:**

| Endpoint | Annotation |
|---|---|
| `POST /api/auth/login` | `@PermitAll` (public) |
| `POST /api/auth/refresh` | `@PermitAll` (public — cookie-based) |
| `POST /api/auth/logout` | `@PreAuthorize("isAuthenticated()")` |
| `POST /api/auth/sessions/revoke-all` | `@PreAuthorize("hasAuthority('JWT_REVOKE_ALL')")` |
| `GET /api/auth/sessions` | `@PreAuthorize("hasAuthority('JWT_POLICY_MANAGE')")` |
| `POST /api/auth/signing-keys/rotate` | `@PreAuthorize("hasAuthority('JWT_POLICY_MANAGE')")` |

### 3.9 Transaction Management

| Service Method | Transaction | Propagation |
|---|---|---|
| `AuthService.login()` | `@Transactional` | `REQUIRED` |
| `TokenService.createAccessToken()` | `@Transactional(readOnly=true)` | `REQUIRES_NEW` |
| `TokenService.createRefreshToken()` | No tx (stateless) | — |
| `SessionService.createSession()` | `@Transactional` | `REQUIRED` |
| `SessionService.revokeSession()` | `@Transactional` | `REQUIRED` |
| `SessionService.revokeAllSessions()` | `@Transactional` | `REQUIRED` |
| `TokenService.refreshAccessToken()` | `@Transactional` | `REQUIRED` |

### 3.10 Key Management

```
Key Loading Strategy:
┌─────────────────────────────────────────────────────────────┐
│ 1. Startup: Load JWT_SIGNING_KEY from env var                │
│    (System.getenv("JWT_SIGNING_KEY"))                        │
│    - Minimum 256-bit (32 bytes) for HS256                   │
│    - Validate format (hex/base64)                            │
│    - If invalid → application FAILS startup                 │
│                                                             │
│ 2. Persist key metadata to DB (JwtSigningKey table):         │
│    - algorithm: "HS256"                                      │
│    - keyVersion: auto-increment (starting 1)                │
│    - keyFingerprint: SHA-256 of key (không lưu plaintext)  │
│                                                             │
│ 3. Key Rotation (Phase 2):                                   │
│    a. Generate new key → save as active, deactivate old     │
│    b. Old tokens vẫn valid (new key chỉ dùng cho sign mới)  │
│    c. Old tokens sẽ expire tự nhiên theo exp claim          │
│    d. RevocationCache invalidateAll() để force re-auth      │
└─────────────────────────────────────────────────────────────┘
```

### 3.11 Error Handling

Global exception handler (`@RestControllerAdvice`) returns standardized JSON:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message (Vietnamese)"
  }
}
```

| Error Code | HTTP Status | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Sai email/password |
| `TOTP_REQUIRED` | 403 | Cần TOTP code |
| `TOKEN_EXPIRED` | 401 | Access token đã hết hạn |
| `TOKEN_INVALID` | 401 | Token không hợp lệ (signature fail / algorithm mismatch) |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token đã hết hạn |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token không hợp lệ |
| `SESSION_REVOKED` | 401 | Session đã bị thu hồi |
| `ALL_SESSIONS_REVOKED` | 401 | Tất cả session của user bị thu hồi (reuse detection) |
| `UNAUTHORIZED` | 401 | Không có token hoặc token không valid |
| `FORBIDDEN` | 403 | Không có quyền (missing role/permission) |
| `KEY_ROTATION_IN_PROGRESS` | 503 | Key đang trong quá trình rotate |

**Custom Exceptions:**

```java
public class TokenExpiredException extends RuntimeException { ... }
public class TokenInvalidException extends RuntimeException { ... }
public class RefreshTokenReuseException extends RuntimeException { ... }
public class SessionRevokedException extends RuntimeException { ... }
public class SigningKeyException extends RuntimeException { ... }
```

### 3.12 Database Indexes & Performance

| Table | Index | Purpose |
|---|---|---|
| `jwt_sessions` | `idx_jwt_sessions_user_id` | Find sessions by user |
| `jwt_sessions` | `idx_jwt_sessions_user_status` | Query active sessions per user (composite) |
| `jwt_sessions` | `idx_jwt_sessions_expires_at` | Cleanup expired sessions (scheduled job) |
| `jwt_sessions` | `idx_jwt_sessions_session_id (UNIQUE)` | Correlation lookup |
| `jwt_token_revocations` | `idx_jwt_rev_user_id` | Audit trail per user |
| `jwt_token_revocations` | `idx_jwt_rev_user_reason` | Filter by reason type |
| `jwt_token_revocations` | `idx_jwt_rev_revoked_at` | Time-range queries |
| `jwt_signing_keys` | `idx_jwt_key_version (UNIQUE)` | Key version uniqueness |
| `jwt_signing_keys` | `idx_jwt_key_active` | Find active key |

**Performance Targets (from testing strategy):**

| Metric | Threshold |
|---|---|
| JWT create + sign latency p99 | <10ms |
| JWT validate (in-memory) latency p99 | <5ms |
| Refresh endpoint throughput | >1000 RPS |
| Token revocation cache hit ratio | >95% |

**Scheduled Cleanup (cron job):**

```java
@Component
@Scheduled(fixedDelay = 3600_000)  //每小时执行
public class SessionCleanupTask {
    @Transactional
    public void cleanupExpiredSessions() {
        // Delete JwtSessions where expiresAt < now AND isRevoked = true
        // Hoặc status = 'EXPIRED'
        // Giữ lại revoked sessions ít nhất 30 ngày (GDPR compliance)
    }
}
```

### 3.13 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-security` | Spring Security filter chain, authentication |
| `spring-boot-starter-data-jpa` | ORM with MSSQL dialect |
| `io.jsonwebtoken:jjwt-api` (0.12.x) | JWT creation, parsing, validation |
| `io.jsonwebtoken:jjwt-impl` (0.12.x) | HMAC implementation |
| `io.jsonwebtoken:jjwt-jackson` (0.12.x) | JSON serialization for JWT |
| `com.github.ben-manes.caffeine:caffeine` | In-memory cache (revocation cache) |
| `spring-boot-starter-validation` | Bean validation (@Valid, @NotBlank) |
| `org.springframework.boot:spring-boot-starter-actuator` | Health checks, metrics |

### 3.14 Security Considerations Summary

| Concern | Mitigation | Reference |
|---|---|---|
| **XSS token theft** | Refresh token trong HTTP-only cookie — JavaScript không thể đọc | BR-274-07 |
| **MITM token interception** | Cookie Secure flag — chỉ gửi qua HTTPS | BR-274-07 |
| **CSRF attacks** | SameSite=Strict cookie attribute + CSRF filter disabled (rely on cookie attributes) | OWASP CSRF |
| **Token replay after logout** | RevocationCache + DB JwtTokenRevocation check (BR-274-11) | BR-274-11 |
| **Session hijack (reuse detection)** | Hash-based comparison — nếu refresh token được dùng sau logout → revoke all (BR-274-04) | BR-274-04 |
| **Key compromise** | Key stored in env var (không hardcoded) + key fingerprint trong DB (BR-274-08) | BR-274-08 |
| **Sensitive data in JWT** | Payload chỉ chứa sub + roles + permissions + sessionId + jti (BR-274-10) | BR-274-10 |
| **Token overflow** | Access token ngắn (15 phút), refresh token dài (7 ngày) + hash+salt lưu DB (BR-274-01, BR-274-02, BR-274-03) | BR-274-01, BR-274-03 |
| **Algorithm confusion** | Phase 1: HS256 chỉ, validate algorithm explicitly (BR-274-12) | BR-274-12 |
| **In-memory token persistence** | No localStorage/sessionStorage — backend chỉ định nghĩa cookie policy, client không lưu token trong browser storage | Out of Scope |
| **Audit trail** | JwtTokenRevocation + F-005 AccessLog event publishing | In Scope |

## 4. Cross-Feature Dependencies

| Depends On | Reason |
|---|---|
| **F-271** (Đăng ký tài khoản) | JwtSession liên kết với User entity từ F-271 |
| **F-272** (Đăng nhập lần đầu + TOTP) | Login flow trigger token creation |
| **F-273** (Đăng nhập lần tiếp theo + TOTP) | Token issuance after 2FA verification |
| **F-275** (Phân quyền 3 mức) | JWT payload chứa roles + permissions từ F-275 |
| **F-005** (M-001) (Audit log) | Session events published qua ApplicationEvent → F-005 |

## 5. QA Gate — SA Review Notes

### Items for Designer
- Xác nhận cookie policy (SameSite=Strict phù hợp với SPA CORS setup)
- Đánh giá key rotation UX: admin experience khi rotate key
- Thiết kế health check endpoint cho JWT signing key status

### Items for Security Review
- Validate hash algorithm cho refreshToken: SHA-256 đủ mạnh không? (khuyến nghị SHA-512 hoặc PBKDF2)
- Đánh giá CSRF strategy (SameSite=Strict vs dual-cookie)
- Key entropy validation: env var tối thiểu 256-bit (32 bytes hex = 64 chars)

### Items for Tech Lead
- Refresh token rotation policy: Phase 1 giữ nguyên token (không rotate), Phase 2 thêm strict rotate (revoke-old + issue-new)
- Cleanup job: tần suất + retention policy cho expired/revoked sessions
- Revocation cache TTL 5 phút — có thể adjust theo traffic pattern
