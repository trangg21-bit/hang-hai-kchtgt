---
id: F-272
name: Đăng nhập lần đầu + TOTP setup
slug: dang-nhap-lan-dau-totp-setup
module-id: M-010
stage: system-architect
status: in_design
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-23T08:11:34Z
---
# SA Stage: F-272 — Đăng nhập lần đầu + TOTP setup

> **Feature-brief source**: `docs/modules/M-010-xac-thuc-phan-quyen/_features/F-272-dang-nhap-lan-dau-totp-setup/feature-brief.md`  
> **Module**: M-010 (Xác thực & Phân quyền)  
> **References**: RFC 6238 (TOTP), NIST SP 800-132 (GUID/GTOTP), OWASP ASVS v4.0, OWASP Secure Coding Practices

---

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 User (extended from F-271)

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email", unique = true),
    @Index(name = "idx_users_phone", columnList = "phone", unique = true),
    @Index(name = "idx_users_totp_enabled", columnList = "totp_enabled"),
    @Index(name = "idx_users_locked_until", columnList = "locked_until")
})
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 20, unique = true)
    private String phone;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash; // bcrypt ($2a$ or $2b$ prefix, 60 chars)

    // ─── TOTP fields (F-272) ───
    /**
     * Hashed TOTP secret — PBKDF2-SHA256 with ≥16-byte salt, ≥100,000 iterations.
     * Stored as hex-encoded string (64 chars for 32-byte digest).
     * NULL when TOTP has not been enrolled.
     */
    @Column(name = "totp_secret_hash", length = 64)
    private String totpSecretHash;

    @Column(name = "totp_enabled", columnDefinition = "BIT DEFAULT 0")
    private Boolean totpEnabled = false;

    @Column(name = "last_totp_code", length = 6)
    private String lastTotpCode; // prevent replay (last used code)

    @Column(name = "totp_verified_at")
    private LocalDateTime totpVerifiedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // ─── Lock fields (F-277) ───
    @Column(name = "failed_login_count", columnDefinition = "INT DEFAULT 0")
    private Integer failedLoginCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 TotpEnrollSession (temporary — Redis-backed, not a DB entity)

> **Design decision**: TOTP enrollment sessions are short-lived (≤60s) and do **not** persist to MSSQL. They are stored in Redis with automatic TTL expiration. See §3.2 for implementation details.

```java
// Logical DTO only — no @Entity, no table.
public class TotpEnrollSession {
    private String sessionId;      // Redis key: "totp:enroll:{userId}"
    private Long userId;
    private String secretHash;     // PBKDF2 hash of raw secret
    private String rawSecretB32;   // base32-encoded secret for QR generation (never stored, only in memory)
    private String qrUri;          // otpauth://totp/... for QR generation
    private Instant qrGeneratedAt;
    private Instant qrExpiresAt;   // qrGeneratedAt + 60s
    private int attempts;          // failed verification attempts
    private Instant lockedUntil;   // if BR-272-006 triggered
}
```

### 1.3 AuditLog (shared with F-005 pattern)

```java
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_logs_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_logs_action", columnList = "action"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at"),
    @Index(name = "idx_audit_logs_totp_related", columnList = "user_id, action, created_at")
})
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "user_id") private Long userId; // null for system events

    @Column(name = "action", length = 50, nullable = false) private String action;
    // Values: totp_setup_start | totp_setup_success | totp_setup_fail | totp_verify_fail
    //         | totp_qr_generated | totp_qr_expired | totp_verify_locked

    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "user_agent", length = 500) private String userAgent;
    @Column(name = "session_id", length = 100) private String sessionId;
    @Column(name = "details", columnDefinition = "JSON") private String details;
    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
```

### 1.4 Relationship Diagram

```
User 1──1 TotpEnrollSession (ephemeral, Redis)
User 1──N AuditLog (totp-related events)
User N──1 Role
```

---

## 2. API Endpoints

All endpoints prefixed with `/api/v1/auth/`. No JWT required for `/auth/login` and `/auth/totp/*` (the TOTP flow itself is part of authentication).

### 2.1 Login (credential auth)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Credential authentication (email/phone + password) | Public |

**Request body:**
```json
{
  "identifier": "user@example.com",  // email OR phone
  "password": "plaintext password"
}
```

**Response 200 — credentials valid, TOTP setup required:**
```json
{
  "success": true,
  "data": {
    "status": "totp_setup_required",
    "sessionId": "redis-key-for-enrollment",
    "message": "Vui lòng thiết lập TOTP để tiếp tục"
  }
}
```

**Response 200 — TOTP already enabled (skip to JWT):**
```json
{
  "success": true,
  "data": {
    "status": "authenticated",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "claims": {
      "user_id": 42,
      "role": "user",
      "totp_enabled": true
    }
  }
}
```

**Response 401 — invalid credentials:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email/số điện thoại hoặc mật khẩu không đúng"
  }
}
```

**Response 403 — account locked (F-277):**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Tài khoản đã bị khóa. Vui lòng thử lại sau {{lockedUntil}}",
    "lockedUntil": "2026-06-23T01:15:00Z"
  }
}
```

### 2.2 TOTP Setup

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/totp/setup` | Generate QR code + TOTP URI | Session-based (login response sessionId) |
| POST | `/api/v1/auth/totp/verify` | Verify TOTP code + complete enrollment | Session-based |
| POST | `/api/v1/auth/totp/regenerate` | Regenerate QR (old QR expired) | Session-based |

**POST `/api/v1/auth/totp/setup`**

*Request body:*
```json
{
  "sessionId": "redis-key-for-enrollment",
  "identifier": "user@example.com"  // for TOTP URI issuer:account
}
```

*Response 200:*
```json
{
  "success": true,
  "data": {
    "sessionId": "redis-key-for-enrollment",
    "qrCode": "data:image/svg+xml;base64,PHN2Zy4u.",
    "qrUri": "otpauth://totp/HaiHaiKChKTGT:user@example.com?secret=JBSWY3DPEHPK3PXP&algorithm=SHA1&digits=6&period=30",
    "expiresAt": "2026-06-23T00:01:00Z",
    "instructions": {
      "step1": "Mở ứng dụng xác thực (Google Authenticator, Authy, Microsoft Authenticator...)",
      "step2": "Quét mã QR hoặc nhập thủ công key bên trên",
      "step3": "Nhập mã 6 chữ số hiển thị trên ứng dụng vào bước xác nhận"
    }
  }
}
```

**POST `/api/v1/auth/totp/verify`**

*Request body:*
```json
{
  "sessionId": "redis-key-for-enrollment",
  "code": "123456"
}
```

*Response 200 — success + JWT issued:*
```json
{
  "success": true,
  "data": {
    "status": "authenticated",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "claims": {
      "user_id": 42,
      "role": "user",
      "totp_enabled": true
    }
  }
}
```

*Response 400 — invalid code:*
```json
{
  "success": false,
  "error": {
    "code": "TOTP_CODE_INVALID",
    "message": "Mã TOTP không đúng. Vui lòng thử lại.",
    "remainingAttempts": 4
  }
}
```

*Response 429 — locked (BR-272-006):*
```json
{
  "success": false,
  "error": {
    "code": "TOTP_VERIFY_LOCKED",
    "message": "Quá 5 lần nhập sai. Vui lòng đăng nhập lại.",
    "lockedUntil": "2026-06-23T00:30:00Z"
  }
}
```

**POST `/api/v1/auth/totp/regenerate`**

*Request body:*
```json
{
  "sessionId": "redis-key-for-enrollment"
}
```

*Response 200:* Same structure as `/setup` response (new QR code + URI, fresh 60s expiry).

### 2.3 Endpoint Summary

| # | Method | Endpoint | Auth | Rate-limit | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/login` | Public | 10 req/15min/IP (F-277) | Credential check |
| 2 | POST | `/api/v1/auth/totp/setup` | Session | 5 req/min/session | Generate QR |
| 3 | POST | `/api/v1/auth/totp/verify` | Session | 5 attempts/15min/session | Verify + complete |
| 4 | POST | `/api/v1/auth/totp/regenerate` | Session | 3 req/min/session | Re-generate QR |

---

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS / Mobile Client (First-login flow)
        │
        ▼
┌─────────────────────────────────────────────────┐
│                  Spring Boot API                  │
│                                                   │
│  ┌──────────┐    ┌──────────────┐                │
│  │ AuthCtrl │───►│ AuthService  │                 │
│  └──────────┘    └──────┬───────┘                 │
│                         │                         │
│              ┌──────────┼──────────────┐          │
│              ▼          ▼              ▼          │
│       Credential   TotpService    JwtService     │
│       Verifier    ┌──┴───┐              │        │
│                    │      │              ▼        │
│               QRGen  TotpVer    JWT Builder      │
│               Service Service              │     │
│                                              ▼     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Redis Cache                                │  │
│  │  - totp:enroll:{userId}: QR + session state │  │
│  │  - totp:lock:{userId}: verification lock    │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │  MSSQL (JPA/Hibernate)                       │  │
│  │  - users (totp_secret_hash, totp_enabled)   │  │
│  │  - audit_logs                               │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key interactions:**
- `AuthController.login()` calls `AuthService.authenticate()` which performs credential check via `PasswordEncoder.matches()`.
- If `user.getTotpSecretHash() == null` → calls `TotpService.generateSecret()` → `QRGenerationService.createQR()` → stores session in Redis → returns QR + session ID.
- `TotpService.verify()` reads raw secret from Redis session, computes TOTP code with ±1 tolerance, compares with constant-time check → if valid, hashes secret with PBKDF2, writes to User entity, publishes audit event, generates JWT.
- `JwtService` creates access token (1h) + refresh token (7d) with `totp_enabled: true` claim.

### 3.2 TOTP Enrollment Session Architecture

**Redis Key Design:**

| Key Pattern | TTL | Content |
|---|---|---|
| `totp:enroll:{userId}` | 300s (5 min, soft expiry) | JSON: `{secretHash, rawSecretB32, qrUri, qrGeneratedAt, qrExpiresAt, attempts, lockedUntil, identifier}` |
| `totp:lock:{userId}` | 900s (15 min) | Integer: timestamp of lock |

**Session lifecycle:**
1. After successful credential auth → create `totp:enroll:{userId}` in Redis with 5-min TTL.
2. User requests QR → read session from Redis → generate QR → update `qrGeneratedAt`/`qrExpiresAt` in session.
3. QR expires after 60s → user can call `/regenerate` for new QR (session still valid).
4. Session expires (5 min) → user must re-authenticate via `/login`.
5. After successful verify → delete session key (cleanup).
6. On lock (5 failures) → write `totp:lock:{userId}`, delete enroll session → user must re-auth.

### 3.3 TOTP Service Design (RFC 6238 compliant)

**Library choice**: `ru.yandex.infra:authenticator` (or `com.nimroddd:totp` as alternative) — both are Java-compatible TOTP libraries implementing RFC 6238.

**TOTP generation algorithm:**

```
1. Generate 20-byte cryptographic random secret
   └─ using java.security.SecureRandom (CSPRNG)

2. Encode secret as Base32 string (32 chars for 20 bytes)

3. Build TOTP URI:
   otpauth://totp/{issuer}:{identifier}?
     secret={base32_secret}&
     algorithm=SHA1&
     digits=6&
     period=30

4. Generate QR code from URI
   └─ using ZXing library (QRCode encoder)

5. Verify TOTP code:
   └─ HmacSHA1(secret_bytes, time_step)
   └─ time_step = floor(current_time / 30)
   └─ tolerance: [time_step-1, time_step, time_step+1]
```

**TotpService interface:**

```java
public interface TotpService {
    /** Generate a new TOTP enrollment session for the given user. */
    TotpEnrollSession generateSecret(Long userId, String identifier);

    /** Verify a TOTP code against the enrollment session. Returns true on success. */
    boolean verifyCode(String sessionId, String code);

    /** Regenerate QR code (same secret, new timestamp). */
    TotpEnrollSession regenerateQR(String sessionId);

    /** Hash a raw TOTP secret for persistent storage (PBKDF2). */
    String hashSecret(byte[] rawSecret);

    /** Verify a stored hash against a raw secret (for post-enrollment auth). */
    boolean verifyHashedSecret(String storedHash, byte[] rawSecret);

    /** Check if verification is temporarily locked. */
    boolean isLocked(Long userId);

    /** Unlock after re-authentication. */
    void unlock(Long userId);
}
```

### 3.4 QR Code Generation Service

**Approach**: Server-side QR generation using **ZXing** library → returns Base64-encoded SVG or PNG inline in API response.

```java
@Service
public class QRGenerationService {

    /**
     * Generate a QR code as Base64-encoded SVG from a TOTP URI.
     *
     * @param totpUri otpauth://totp/... URI
     * @return data:image/svg+xml;base64,...
     */
    public String generateQRAsSVG(String totpUri) {
        QRCodeEncoder encoder = new QRCodeEncoder(totpUri, 300, 300, BarcodeFormat.QR_CODE);
        BitMatrix matrix = encoder.encode();
        return SVGWriter.toSVG(matrix, "utf-8");
    }

    /**
     * Generate a QR code as Base64-encoded PNG (alternative for mobile clients
     * that prefer raster formats).
     */
    public String generateQRAsPNG(String totpUri) throws WriterException, IOException {
        QRCodeEncoder encoder = new QRCodeEncoder(totpUri, 300, 300, BarcodeFormat.QR_CODE);
        BitMatrix matrix = encoder.encode();
        BufferedImage image = MatrixToImageConfig.toBufferedImage(matrix);
        return encodeToBase64(image, "PNG");
    }
}
```

**Design decisions:**
- **SVG preferred** for web clients (scalable, smaller payload, no rendering artifacts).
- **PNG fallback** available for mobile clients (React Native, etc.).
- QR size: 300×300 pixels (optimal for mobile camera scanning).
- **Never** expose the raw Base32 secret in the response body — only the QR image + URI.

### 3.5 Security Architecture

#### 3.5.1 TOTP Secret Storage (BR-272-002, BR-272-003)

```
Raw secret (20 bytes, CSPRNG)
    │
    ├── In memory only during enrollment session (Redis, TTL ≤ 300s)
    │   └── NEVER written to disk or logs
    │
    └── After successful verification:
        PBKDF2-SHA256(
            password = raw_secret_bytes,
            salt = random_16_bytes,    // stored alongside hash: "salt_hex:hash_hex"
            iterations = 100_000,     // per OWASP 2023 guidelines
            dkLength = 32             // 256-bit derived key
        )
        │
        └── Stored in users.totp_secret_hash (VARCHAR(64), hex-encoded)
```

**Why PBKDF2 hash instead of raw storage:**
- If database is compromised, attacker cannot derive the TOTP secret without also cracking PBKDF2.
- The raw secret is never stored anywhere on disk — only the hash exists in the database.
- During verification (F-273), the raw secret is read from Redis session, hashed with same PBKDF2 params, and compared to stored hash.

#### 3.5.2 Constant-Time Comparison

```java
import org.springframework.security.crypto.codec.Hex;

/**
 * Constant-time string comparison to prevent timing attacks.
 * Always compares all bytes regardless of match position.
 */
public class ConstantTimeComparer {
    public static boolean equal(String a, String b) {
        if (a == null || b == null) return false;
        byte[] aBytes = Hex.decode(a.toLowerCase());
        byte[] bBytes = Hex.decode(b.toLowerCase());
        if (aBytes.length != bBytes.length) return false;
        int result = 0;
        for (int i = 0; i < aBytes.length; i++) {
            result |= aBytes[i] ^ bBytes[i];
        }
        return result == 0;
    }
}
```

#### 3.5.3 Anti-Replay Protection (BR-272-006)

```java
/**
 * TOTP verification rate limiting per user session.
 * Track attempts in Redis with sliding window.
 */
@Component
public class TotpRateLimiter {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration LOCKOUT_PERIOD = Duration.ofMinutes(15);

    /**
     * Record a failed attempt. Returns remaining attempts.
     * Returns -1 if locked.
     */
    public int recordFailedAttempt(String sessionId) {
        String key = "totp:attempts:" + sessionId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count == 1) {
            redisTemplate.expire(key, LOCKOUT_PERIOD);
        }
        if (count >= MAX_ATTEMPTS) {
            redisTemplate.opsForValue().set("totp:lock:" + sessionId,
                Instant.now().plus(LOCKOUT_PERIOD).toString());
            redisTemplate.expire("totp:lock:" + sessionId, LOCKOUT_PERIOD);
            return -1;
        }
        return MAX_ATTEMPTS - (int) count;
    }

    public boolean isLocked(String sessionId) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("totp:lock:" + sessionId));
    }
}
```

#### 3.5.4 Security Controls Summary

| Control | Implementation | Standard |
|---|---|---|
| **CSPRNG secret generation** | `SecureRandom.generateSeed(20)` | NIST SP 800-132 |
| **Secret hashing** | PBKDF2-SHA256, 100k iterations, 16-byte salt | OWASP Secure Coding |
| **QR expiry** | 60s TTL on QR data, enforced server-side | Security best practice |
| **TOTP tolerance** | ±1 time-step (±30s window) | RFC 6238 §5.2 |
| **Constant-time compare** | Byte-level XOR accumulation | OWASP ASVS 5.4.4 |
| **Replay prevention** | Store `last_totp_code` in User entity; reject if code equals last used | RFC 6238 §5.2 |
| **Rate limiting** | Redis-based sliding window, 5 attempts/15min lockout | OWASP ASVS 5.4.6 |
| **Secret leakage prevention** | Secret never in logs, never in DB, never in API responses | OWASP ASVS 6.5.1 |
| **XSS prevention** | QR returned as `data:image/svg+xml;base64,...`, not raw HTML | OWASP ASVS 7.1 |
| **Credential privacy** | Same error message for invalid email and invalid password | OWASP ASVS 2.1.1 |

#### 3.5.5 Flow Security Checklist

```
[✓] Credential auth before TOTP setup (cannot skip to QR generation)
[✓] QR code server-generated, never exposed as raw Base32
[✓] Secret hashed before persistence (PBKDF2)
[✓] TOTP secret never appears in logs (log sanitization)
[✓] Constant-time comparison for TOTP codes
[✓] Rate limiting on /verify endpoint
[✓] Session-based auth for TOTP endpoints (not JWT — prevents hijack of JWT with MFA bypass)
[✓] QR expires after 60s (enforced server-side via ttl comparison)
[✓] Audit log every TOTP event (start, success, fail, lock)
[✓] Account lock (F-277) blocks TOTP setup
[✓] Anti-replay: last_totp_code checked on verify
```

### 3.6 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `UserRepository` — Spring Data JPA interface for `users` and `audit_logs` tables |
| **DTO Pattern** | `LoginRequestDTO`, `LoginResponseDTO`, `TotpSetupRequestDTO`, `TotpVerifyRequestDTO`, `TotpResponseDTO` |
| **Strategy Pattern** | `TOTPAlgorithmStrategy` — abstracts RFC 6238 computation (sha1, digits, period); easily swappable for future HMAC variants |
| **Session Management** | Redis-backed `TotpEnrollSession` — stateless API, ephemeral state in cache |
| **Facade Pattern** | `AuthServiceFacade` — orchestrates: credential check → MFA status check → TOTP flow or JWT issuance |
| **Observer Pattern** | Spring `ApplicationEventPublisher` — publishes `TotpSetupEvent` for audit logging and downstream notifications |
| **Builder Pattern** | `JWTBuilder` — assembles JWT with claims (`user_id`, `role`, `totp_enabled`, `iat`, `exp`) |
| **Circuit Breaker** | Not required (no external dependencies in this flow) |

### 3.7 Spring Security Configuration

```
SecurityFilterChain for /api/v1/auth/**:
  ┌────────────────────────────────────────────────┐
  │  permitAll():                                   │
  │    POST /api/v1/auth/login                      │
  │    POST /api/v1/auth/totp/setup                 │
  │    POST /api/v1/auth/totp/verify                │
  │    POST /api/v1/auth/totp/regenerate            │
  │                                                 │
  │  anyRequest().authenticated()                   │
  │    → JwtAuthenticationFilter (Bearer token)     │
  └────────────────────────────────────────────────┘
```

**Note**: The TOTP enrollment uses a session-based mechanism (sessionId from Redis) rather than JWT — because the user is not yet authenticated at this stage. This prevents an attacker from hijacking a JWT to bypass MFA enrollment.

### 3.8 Transaction Management

| Method | Transaction | Propagation | Notes |
|---|---|---|---|
| `AuthService.authenticate()` | Yes | `REQUIRED` | Credential check is read-only (can use `REQUIRES_NEW` with `readOnly=true`) |
| `TotpService.verify()` + `UserService.enableTOTP()` | Yes | `REQUIRED` | Atomic: hash secret + update User + clear Redis session |
| `AuditLogService.log()` | Yes (separate) | `REQUIRES_NEW` | Audit log survives main transaction rollback |

### 3.9 Error Handling

Global exception handler (`@RestControllerAdvice`) returns:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "User-readable message" } }
```

Standard error codes for F-272:

| Code | HTTP | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email/phone or password (does not reveal which) |
| `ACCOUNT_LOCKED` | 403 | Account locked by F-277 policy |
| `TOTP_SETUP_REQUIRED` | 403 | User has TOTP enabled but not yet enrolled (should not occur) |
| `TOTP_CODE_INVALID` | 400 | TOTP code does not match (up to 4 remaining attempts) |
| `TOTP_VERIFY_LOCKED` | 429 | Too many failed TOTP attempts (15min lockout) |
| `SESSION_EXPIRED` | 400 | TOTP enrollment session expired (5 min) |
| `QR_EXPIRED` | 400 | QR code no longer valid (60s) |
| `SESSION_NOT_FOUND` | 404 | Enrollment session does not exist |

### 3.10 Database Indexes & Performance

| Table | Index | Type | Purpose |
|---|---|---|---|
| `users` | `idx_users_email` | UNIQUE | Login by email |
| `users` | `idx_users_phone` | UNIQUE | Login by phone |
| `users` | `idx_users_totp_enabled` | NON-UNIQUE | Filter for MFA enrollment status |
| `users` | `idx_users_locked_until` | NON-UNIQUE | Query for locked accounts |
| `audit_logs` | `idx_audit_logs_user_id` | NON-UNIQUE | Per-user audit queries |
| `audit_logs` | `idx_audit_logs_action` | NON-UNIQUE | Filter by event type |
| `audit_logs` | `idx_audit_logs_created_at` | NON-UNIQUE | Date-range queries |
| `audit_logs` | `idx_audit_logs_totp_related` | COMPOSITE | `(user_id, action, created_at)` — TOTP audit optimization |

**Performance notes:**
- `totp_secret_hash` column is nullable, indexed only if many users have MFA enabled.
- Redis is preferred over DB for session state (sub-ms reads/writes, auto-TTL).
- Audit log writes are async (`@Async` or `CompletableFuture`) to avoid login latency.
- JWT size is kept small (< 500 bytes) to minimize network overhead.

### 3.11 Dependencies

| Dependency | Version | Purpose |
|---|---|---|
| `spring-boot-starter-security` | 3.x | Authentication & authorization |
| `spring-boot-starter-data-jpa` | 3.x | ORM with MSSQL dialect |
| `jjwt` (io.jsonwebtoken) | 0.12.x | JWT creation & validation |
| `org.mindrot:jbcrypt` | 0.4.x | bcrypt password hashing |
| `com.github.zxing:core` | 3.5.x | QR code encoding |
| `com.github.zxing:javase` | 3.5.x | SVG/PNG rendering for QR |
| `ru.yandex.infra:authenticator` | 1.0.x | RFC 6238 TOTP computation |
| `spring-boot-starter-data-redis` | 3.x | Redis session storage |
| `spring-boot-starter-validation` | 3.x | Bean validation (@Valid, @NotBlank) |

---

## 4. Data Flow Sequence

### 4.1 Happy Path (First Login with TOTP Setup)

```
Client                          Server                         Redis          MSSQL
  │                               │                              │               │
  │── POST /auth/login ──────────►│                              │               │
  │   {email, password}           │── Authenticate ─────────────►│               │
  │                               │  Check locked ──────────────►│               │
  │                               │  Verify bcrypt ──────────────────────────────►│
  │                               │  totp_secret IS NULL? ───────┴────── YES ─────┤
  │                               │  Generate 20-byte secret ────────────────────►│
  │                               │  (SecureRandom)                               │
  │                               │  Hash secret (PBKDF2)                         │
  │                               │  Store in Redis (5min TTL) ──────────────────►│
  │                               │  Build TOTP URI                               │
  │                               │  Generate QR (ZXing)                          │
  │  ◄── 200: status=totp_setup_  │── Return QR + sessionId + URI ───────────────►│
  │      required + QR + URI ────│                              │               │
  │                               │── Audit: totp_setup_start ────────────────────►│
  │                               │                              │               │
  │── Scan QR with ────────────►  │                              │               │
  │  Authenticator App            │                              │               │
  │                               │                              │               │
  │── POST /auth/totp/verify ───►│                              │               │
  │   {sessionId, code}           │── Read session from Redis ──►│               │
  │                               │── Verify code (±1 tolerance)│               │
  │                               │── Constant-time compare ─────────────────────►│
  │                               │── Hash secret for storage ───────────────────►│
  │                               │── UPDATE users SET ──────────────────────────►│
  │                               │   totp_secret_hash = ?,                               │
  │                               │   totp_enabled = true,                              │
  │                               │   last_totp_code = ?                                │
  │                               │── Clear Redis session                               │
  │                               │── Audit: totp_setup_success ─────────────────────►│
  │                               │── Generate JWT (totp_enabled: true)               │
  │  ◄── 200: accessToken ───────│                              │               │
  │      refreshToken ──────────│                              │               │
  │      claims ────────────────│                              │               │
  │                               │                              │               │
  │── Redirect to dashboard ────►│                              │               │
```

### 4.2 Subsequent Login (TOTP Already Enabled)

```
Client                          Server                         Redis          MSSQL
  │                               │                              │               │
  │── POST /auth/login ──────────►│                              │               │
  │   {email, password}           │── Authenticate ─────────────►│               │
  │                               │  Check locked ──────────────►│               │
  │                               │  Verify bcrypt ──────────────────────────────►│
  │                               │  totp_enabled IS true? ────────── YES ─────────┤
  │                               │  Skip TOTP setup                                          │
  │                               │── Generate JWT (totp_enabled: true)               │
  │  ◄── 200: accessToken ───────│                              │               │
  │      refreshToken ──────────│                              │               │
  │      claims ────────────────│                              │               │
```

---

## 5. Migration Script (MSSQL)

```sql
-- F-272: Add TOTP fields to users table
-- Run as part of database migration pipeline

ALTER TABLE users
ADD totp_secret_hash VARCHAR(64) NULL,
    totp_enabled BIT NOT NULL DEFAULT 0,
    last_totp_code VARCHAR(6) NULL,
    totp_verified_at DATETIME2 NULL;

-- Index for fast MFA status queries
CREATE INDEX idx_users_totp_enabled ON users(totp_enabled)
WHERE totp_enabled = 1;  -- Filtered index (MSSQL 2022+)

-- Update existing users: MFA not enforced for pre-existing accounts
-- (totp_secret_hash is NULL, totp_enabled is 0 — they will be prompted on first login)
```

---

## 6. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Redis downtime during enrollment | User stuck in TOTP setup flow | Low | Fallback to in-memory cache; degrade gracefully |
| Clock drift between server and client | TOTP code rejected | Low | ±1 time-step tolerance (30s window) |
| PBKDF2 brute-force on stored hash | TOTP secret compromised | Low | 100k iterations + unique salt per user |
| QR code intercepted on screen | Secret leaked to bystander | Medium | 60s expiry + server-side validation before persistence |
| Replay of TOTP code | Unauthorized access | Low | `last_totp_code` check + constant-time comparison |
| Secret stored in plaintext (dev error) | Critical data breach | Low | Code review + lint rule forbidding `totpSecret` (without `_hash` suffix) field |
| JWT issued without TOTP check | MFA bypass | Critical | `AuthService` enforces TOTP check before JWT generation |
