---
id: F-272
name: Dang nhap lan dau + TOTP setup
slug: dang-nhap-lan-dau-totp-setup
module-id: M-010
stage: tech-lead
status: in_development
created: 2026-06-23T08:30:00Z
last-updated: 2026-06-23T08:30:00Z
---
# TL: F-272 -- Technical Implementation Plan

> **SA Design source**: `docs/modules/M-010/_features/F-272/sa/feature-design.md`  
> **Feature brief**: `docs/modules/M-010/_features/F-272/feature-brief.md`  
> **Module**: M-010 (Xac thuc & Phan quyen)  
> **Target stack**: Spring Boot 3.3.6 / Java 17 / Maven / PostgreSQL / Redis  
> **JWT library**: jjwt 0.12.5 (already in `pom.xml`)  
> **PasswordEncoder**: BCrypt via `spring-boot-starter-security` (already wired)

---

## 1. Scope Summary

F-272 implements **first-login TOTP enrollment**: after successful credential authentication (email/phone + password), if the user has no TOTP secret enrolled (`totp_secret_hash IS NULL`), the system forces TOTP setup via QR scan before issuing a JWT. Subsequent logins for already-enrolled users skip TOTP setup entirely (delegated to F-273).

---

## 2. Component Breakdown

### 2.1 Component Inventory

| # | Component | Package | Kind | Responsibility |
|---|---|---|---|---|
| C1 | `AuthController` (enhanced) | `user.controller` | `@RestController` | Route `/api/auth/login`, dispatch to 2 flows |
| C2 | `AuthService` | `user.service` | `@Service` | Orchestrates: credential -> MFA status -> TOTP or JWT |
| C3 | `TotpService` | `security.totp.service` | `@Service` | Secret gen, code verify, PBKDF2 hash, lock management |
| C4 | `QRGenerationService` | `security.totp.service` | `@Service` | ZXing QR generation (SVG + PNG) from TOTP URI |
| C5 | `TotpRateLimiter` | `security.totp.service` | `@Component` | Redis-based attempt tracking + lockout |
| C6 | `TotpEnrollSession` | `security.totp.dto` | `record` (POJO) | In-memory / Redis session DTO |
| C7 | `RedisSessionService` | `security.totp.service` | `@Service` | Redis CRUD for enrollment sessions |
| C8 | `ConstantTimeComparer` | `security.totp.util` | `@Component` | Timing-safe byte comparison |
| C9 | `JwtUtil` (enhanced) | `security` | `@Component` | Add `totp_enabled` claim + refresh token generation |
| C10 | `User` (extended) | `user.entity` | `@Entity` | Add `totp_secret_hash`, `totp_enabled`, `last_totp_code`, `totp_verified_at` |
| C11 | `UserRepository` (extended) | `user.repository` | `JpaRepository` | Add `findByEmailWithTotpInfo`, `findByPhoneWithTotpInfo` |
| C12 | `AuditLog` (new) | `common.entity` | `@Entity` | TOTP event audit trail |
| C13 | `TotpSetupController` | `auth.controller` | `@RestController` | Routes `/api/auth/totp/setup|verify|regenerate` |
| C14 | `SecurityConfig` (modified) | `config` | `@Configuration` | Permit TOTP endpoints, add session-based auth header |
| C15 | `TotpSecretHasher` | `security.totp.util` | `@Component` | PBKDF2-SHA256 hash/verify of raw TOTP secret |
| C16 | `LoginRequest` (extended) | `user.dto` | DTO | Support `identifier` (email OR phone) instead of `username` |
| C17 | `LoginResponse` (extended) | `user.dto` | DTO | Support 3 status values: `totp_setup_required`, `authenticated`, error |
| C18 | `TotpSetupRequestDTO` | `auth.dto` | DTO | `sessionId` + `identifier` |
| C19 | `TotpVerifyRequestDTO` | `auth.dto` | DTO | `sessionId` + `code` |
| C20 | `TotpSetupResponseDTO` | `auth.dto` | DTO | `sessionId`, `qrCode` (base64), `qrUri`, `expiresAt`, `instructions` |
| C21 | `TotpVerifyResponseDTO` | `auth.dto` | DTO | JWT fields + claims |
| C22 | `GlobalExceptionHandler` (extended) | `common.exception` | `@RestControllerAdvice` | TOTP-specific error codes |
| C23 | `MssqlMigrationF272` | `src/main/resources/db/migration` | SQL script | DDL: add TOTP columns |

### 2.2 Dependency Graph (Component-Level)

```
AuthController (C1)
 |---> AuthService (C2)
 |     |---> UserRepository (C11)           [credential lookup]
 |     |---> TotpService (C3)               [secret gen + verify]
 |     |     |---> QRGenerationService (C4) [QR generation]
 |     |     |---> RedisSessionService (C7) [session persistence]
 |     |     |---> TotpRateLimiter (C5)     [attempt tracking]
 |     |     |---> TotpSecretHasher (C15)   [PBKDF2 hash]
 |     |     +---> ConstantTimeComparer (C8) [timing-safe compare]
 |     +---> JwtUtil (C9)                   [JWT issuance]
 |
TotpSetupController (C13)
 |---> TotpService (C3)                     [verify, regenerate]
 |---> RedisSessionService (C7)             [session reads]
 |---> TotpRateLimiter (C5)                 [lockout check]
 +---> JwtUtil (C9)                         [final JWT after verify]
```

### 2.3 DI Wiring (Spring @ComponentScan)

All components use constructor injection. Spring Boot's `@ComponentScan(basePackages = "com.hanghai.kchtg")` (default from `KchtgApplication`) covers all packages.

**Package layout:**

```
com.hanghai.kchtg
+-- auth.controller       <-- TotpSetupController (C13)
+-- auth.dto              <-- TotpSetupRequestDTO, TotpVerifyRequestDTO,
|                            TotpSetupResponseDTO, TotpVerifyResponseDTO
+-- user.controller       <-- AuthController (C1, enhanced)
+-- user.service          <-- AuthService (C2), UserService (existing)
+-- user.repository       <-- UserRepository (C11, extended)
+-- user.dto              <-- LoginRequest (extended), LoginResponse (extended)
+-- user.entity           <-- User (extended)
+-- security              <-- JwtUtil (C9, extended), SecurityConfig (C14, modified)
+-- security.totp.service  <-- TotpService (C3), QRGenerationService (C4),
|                            RedisSessionService (C7), TotpRateLimiter (C5)
+-- security.totp.util     <-- ConstantTimeComparer (C8), TotpSecretHasher (C15)
+-- security.totp.dto      <-- TotpEnrollSession (C6)
+-- common.entity          <-- AuditLog (C12)
+-- common.exception       <-- GlobalExceptionHandler (C22, extended)
+-- config                 <-- SecurityConfig (C14, modified)
```

---

## 3. Package Structure (New Packages)

```
src/main/java/com/hanghai/kchtg/
+-- auth/
|   +-- controller/
|   |   +-- TotpSetupController.java          (C13 -- TOTP enrollment endpoints)
|   +-- dto/
|       +-- TotpSetupRequestDTO.java           (C18)
|       +-- TotpVerifyRequestDTO.java          (C19)
|       +-- TotpSetupResponseDTO.java          (C20)
|       +-- TotpVerifyResponseDTO.java         (C21)
|
+-- security/
|   +-- totp/
|   |   +-- service/
|   |   |   +-- TotpService.java               (C3 -- core TOTP logic)
|   |   |   +-- QRGenerationService.java       (C4 -- ZXing QR)
|   |   |   +-- RedisSessionService.java       (C7 -- Redis session CRUD)
|   |   |   +-- TotpRateLimiter.java           (C5 -- attempt tracking)
|   |   +-- util/
|   |   |   +-- ConstantTimeComparer.java      (C8 -- timing-safe compare)
|   |   |   +-- TotpSecretHasher.java          (C15 -- PBKDF2-SHA256)
|   |   +-- dto/
|   |       +-- TotpEnrollSession.java         (C6 -- session record)
|   +-- JwtUtil.java                           (C9 -- extended)
|   +-- JwtAuthFilter.java                     (unchanged)
|   +-- JwtProperties.java                     (unchanged)
|   +-- EncryptionUtil.java                    (unchanged)
|
+-- user/
|   +-- controller/
|   |   +-- AuthController.java                (C1 -- extended)
|   +-- service/
|   |   +-- AuthService.java                   (C2 -- new)
|   +-- repository/
|   |   +-- UserRepository.java                (C11 -- extended)
|   +-- entity/
|   |   +-- User.java                          (C10 -- extended)
|   +-- dto/
|       +-- LoginRequest.java                  (C16 -- extended)
|       +-- LoginResponse.java                 (C17 -- extended)
|
+-- common/
    +-- entity/
    |   +-- AuditLog.java                      (C12 -- new)
    +-- exception/
        +-- GlobalExceptionHandler.java        (C22 -- extended)
```

---

## 4. Interface Contracts

### 4.1 AuthService (orchestration layer)

```java
package com.hanghai.kchtg.user.service;

public interface AuthService {
    /**
     * Authenticate by identifier (email or phone) + password.
     * Returns an AuthResult describing the next step.
     */
    AuthResult authenticate(String identifier, String password);
}

public sealed interface AuthResult {
    record TotpSetupRequired(String sessionId, String userId) implements AuthResult {}
    record Authenticated(String accessToken, String refreshToken,
                         String tokenType, long expiresIn,
                         Long userId, String role, boolean totpEnabled)
            implements AuthResult {}
    record AuthError(String errorCode, String message, Object extra) implements AuthResult {}
}
```

### 4.2 TotpService (core TOTP logic)

```java
package com.hanghai.kchtg.security.totp.service;

public interface TotpService {
    TotpEnrollSession generateSecret(String userId, String identifier);
    boolean verifyCode(String sessionId, String code);
    TotpEnrollSession regenerateQR(String sessionId);
    String hashSecret(byte[] rawSecret);
    boolean verifyHashedSecret(String storedHex, byte[] rawSecret);
    boolean isLocked(String sessionId);
    void unlock(String sessionId);
}
```

### 4.3 QRGenerationService

```java
package com.hanghai.kchtg.security.totp.service;

public interface QRGenerationService {
    /**
     * Generate QR as Base64-encoded SVG from TOTP URI.
     * Returns: data:image/svg+xml;base64,<svg-content>
     */
    String generateQRAsSVG(String totpUri);

    /**
     * Generate QR as Base64-encoded PNG (mobile fallback).
     */
    String generateQRAsPNG(String totpUri);
}
```

### 4.4 RedisSessionService

```java
package com.hanghai.kchtg.security.totp.service;

public interface RedisSessionService {
    String createSession(String userId, TotpEnrollSession session);
    TotpEnrollSession getSession(String redisKey);
    void updateSession(String redisKey, TotpEnrollSession session);
    void deleteSession(String redisKey);
    boolean sessionExists(String redisKey);
}
```

### 4.5 TotpRateLimiter

```java
package com.hanghai.kchtg.security.totp.service;

public interface TotpRateLimiter {
    int recordFailedAttempt(String sessionId);  // 0-4 remaining, -1 if locked
    boolean isLocked(String sessionId);
    void clearAttempts(String sessionId);
    int getRemainingAttempts(String sessionId);
}
```

### 4.6 TotpSecretHasher

```java
package com.hanghai.kchtg.security.totp.util;

/**
 * PBKDF2-SHA256 for TOTP secret persistence.
 * Output: "salt_hex:hash_hex" format.
 */
public interface TotpSecretHasher {
    String hash(byte[] rawSecret);
    boolean verify(byte[] rawSecret, String storedHash);
}
```

### 4.7 JwtUtil (extended)

```java
package com.hanghai.kchtg.security;

// NEW methods to add to existing JwtUtil:
String generateToken(String username, String role, boolean totpEnabled);
String generateRefreshToken(String username);
boolean extractTotpEnabled(String token);
```

### 4.8 User Entity (new fields)

```java
// Fields to add to User.java (package com.hanghai.kchtg.user.entity):

@Column(name = "totp_secret_hash", length = 64)
private String totpSecretHash;   // PBKDF2 hex hash, NULL if not enrolled

@Column(name = "totp_enabled", columnDefinition = "BIT DEFAULT 0")
private Boolean totpEnabled = false;

@Column(name = "last_totp_code", length = 6)
private String lastTotpCode;     // anti-replay: last verified 6-digit code

@Column(name = "totp_verified_at")
private LocalDateTime totpVerifiedAt;
```

### 4.9 AuthController (enhanced login behavior)

```
POST /api/auth/login -- extended:
  1. Find user by email OR phone
  2. Check account lock (F-277): locked_until > now? -> 403
  3. Verify password via PasswordEncoder.matches()
  4. Check totp_secret_hash:
     - NULL -> TotpSetupRequired (return sessionId)
     - NOT NULL && totp_enabled -> Authenticated (return JWT)
  5. Same error message for invalid email AND invalid password
```

### 4.10 TotpSetupController (new endpoints)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/totp/setup` | Session (sessionId) | Generate QR + TOTP URI |
| POST | `/api/auth/totp/verify` | Session (sessionId) | Verify code + finalize enrollment |
| POST | `/api/auth/totp/regenerate` | Session (sessionId) | Re-generate expired QR |

### 4.11 AuditLog Entity (new)

```java
package com.hanghai.kchtg.common.entity;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_al_user_id", columnList = "user_id"),
    @Index(name = "idx_al_action", columnList = "action"),
    @Index(name = "idx_al_created_at", columnList = "created_at")
})
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    @Column(nullable = false, length = 50) private String action;
    // Values: totp_setup_start, totp_setup_success, totp_setup_fail,
    //         totp_verify_fail, totp_qr_generated, totp_qr_expired, totp_verify_locked
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    @Column(columnDefinition = "JSON") private String details;
    private LocalDateTime createdAt;
}
```

---

## 5. TOTP Library Integration

### 5.1 Maven Dependencies (pom.xml additions)

```xml
<!-- TOTP computation (RFC 6238) -->
<dependency>
    <groupId>ru.yandex.infra</groupId>
    <artifactId>authenticator</artifactId>
    <version>1.0.1</version>
</dependency>

<!-- QR code encoding -->
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>core</artifactId>
    <version>3.5.3</version>
</dependency>
<dependency>
    <groupId>com.google.zxing</groupId>
    <artifactId>javase</artifactId>
    <version>3.5.3</version>
</dependency>

<!-- Redis session storage -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 5.2 TOTP Algorithm (RFC 6238)

```
Step 1: Generate 20-byte secret via SecureRandom.generateSeed(20)
Step 2: Encode as Base32 string (32 chars for 20 bytes)
Step 3: Build TOTP URI:
    otpauth://totp/{issuer}:{identifier}?secret={base32}&algorithm=SHA1&digits=6&period=30
Step 4: Encode URI to QR (ZXing 300x300, SVG or PNG)
Step 5: Verify: HmacSHA1(secret, floor(now/30000)) with tolerance [step-1, step, step+1]
```

### 5.3 Authenticator Library Usage

```java
// Secret generation:
byte[] rawSecret = SecureRandom.getInstanceStrong().generateSeed(20);
String base32Secret = Base32.encode(rawSecret);

// Verification with tolerance:
boolean isValid = Authenticator.verifyTotp(base32Secret, userCode, 1); // +/-1 step
```

---

## 6. QR Service Design

### 6.1 ZXing-based Server-Side QR Generation

```java
@Service
public class QRGenerationService implements QRGenerationService {
    private static final int QR_SIZE = 300;

    @Override
    public String generateQRAsSVG(String totpUri) {
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix bitMatrix = new QRCodeWriter()
            .encode(totpUri, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);
        return "data:image/svg+xml;base64,"
            + Base64.getEncoder().encodeToString(svgFromMatrix(bitMatrix));
    }

    @Override
    public String generateQRAsPNG(String totpUri) {
        Map<EncodeHintType, Object> hints = Map.of(EncodeHintType.CHARACTER_SET, "UTF-8");
        BitMatrix bitMatrix = new QRCodeWriter()
            .encode(totpUri, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);
        BufferedImage image = MatrixToImageConfig.toBufferedImage(bitMatrix);
        return "data:image/png;base64," + encodeToBase64(image, "PNG");
    }
}
```

### 6.2 Security Constraints

- Raw Base32 secret **never** in response body (only URI in `qrUri` for manual entry)
- QR always server-generated (not client-side)
- QR expires at 60s, enforced server-side via `qrExpiresAt` tracking
- Response always JSON, QR embedded as `data:` URI (XSS-safe)

---

## 7. Redis Session Management

### 7.1 Key Schema

| Key Pattern | TTL | Content |
|---|---|---|
| `totp:enroll:{userId}` | 300s (5 min) | JSON: `{ secretHash, rawSecretB32, qrUri, qrGeneratedAt, qrExpiresAt, attempts, lockedUntil, identifier }` |
| `totp:lock:{sessionId}` | 900s (15 min) | Timestamp of lockout |
| `totp:attempts:{sessionId}` | 900s (15 min) | Integer counter |

### 7.2 Session Lifecycle

```
1. Login success + totp_secret IS NULL:
   -> Redis: SET totp:enroll:{userId} {session data} EX 300

2. User calls /api/auth/totp/setup:
   -> GET session, generate QR from rawSecretB32, set qrExpiresAt = now+60s

3. QR expired (>60s), user calls /regenerate:
   -> GET session, verify qrExpiresAt < now, re-generate QR with fresh 60s

4. User calls /api/auth/totp/verify:
   -> GET session, check lockout, verify code (Â±1 tolerance)
   -> If valid: hash secret (PBKDF2), UPDATE users, DELETE session, issue JWT
   -> If invalid: INCR totp:attempts, if >= 5 -> write lock key, DELETE session

5. Session expired (300s):
   -> User must re-authenticate via /login
```

### 7.3 Redis Configuration (application.yml)

```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}
      password: ${REDIS_PASSWORD:}
      timeout: 5000ms
```

### 7.4 Redis Serialization

Use `RedisTemplate<String, String>` with Jackson `GenericJackson2JsonRedisSerializer` for compact JSON.

---

## 8. Database Changes

### 8.1 User Entity Extension (Hibernate DDL)

Dev (H2, `ddl-auto: update`): Auto-adds columns.
Prod (PostgreSQL, `ddl-auto: validate`): Migration script required.

### 8.2 Migration SQL

```sql
-- F-272: Add TOTP fields to app_users
ALTER TABLE app_users
ADD COLUMN totp_secret_hash VARCHAR(64) NULL,
ADD COLUMN totp_enabled BIT NOT NULL DEFAULT 0,
ADD COLUMN last_totp_code VARCHAR(6) NULL,
ADD COLUMN totp_verified_at DATETIME2 NULL;

CREATE INDEX idx_app_users_totp_enabled ON app_users(totp_enabled)
WHERE totp_enabled = 1;

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT IDENTITY PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(100),
    details JSON,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);
CREATE INDEX idx_al_user_id ON audit_logs(user_id);
CREATE INDEX idx_al_action ON audit_logs(action);
CREATE INDEX idx_al_created_at ON audit_logs(created_at);
CREATE INDEX idx_al_totp_related ON audit_logs(user_id, action, created_at);
```

---

## 9. Security Architecture

### 9.1 Secret Hashing (BR-272-002, BR-272-003)

```
PBKDF2-SHA256(
  password = raw_secret_bytes,        // 20-byte TOTP secret
  salt     = SecureRandom(16 bytes),  // unique per user
  iterations = 100_000,
  dkLength = 32
)
Output: "salt_hex:hash_hex" stored in users.totp_secret_hash
```

### 9.2 Timing-Safe Comparison

XOR accumulation over full byte array -- never short-circuits.

### 9.3 Anti-Replay

`user.last_totp_code` stores the last verified 6-digit code. Same code in same time-step -> reject.

### 9.4 Rate Limiting (BR-272-006)

5 failed attempts / 15 min -> lockout -> must re-auth.

### 9.5 Session-Based Auth for TOTP Endpoints

TOTP enrollment uses Redis session ID (not JWT) -- prevents JWT hijack for MFA bypass.

---

## 10. Implementation Tasks (Phased)

### Phase 1: Foundation (Day 1-2) -- 3d
| # | Task | Component |
|---|---|---|
| T1 | Add Maven deps (authenticator, zxing, redis-starter) | `pom.xml` |
| T2 | Extend `User` entity with TOTP fields | `User.java` |
| T3 | Add Redis config + connection | `RedisConfig.java`, `application.yml` |
| T4 | Create `AuditLog` entity | `AuditLog.java` |
| T5 | Create DTOs (TotpSetup/Verify Request/Response, TotpEnrollSession) | `auth.dto/`, `security.totp.dto/` |

### Phase 2: Core TOTP Logic (Day 3-4) -- 4d
| # | Task | Component |
|---|---|---|
| T6 | Implement `TotpSecretHasher` (PBKDF2-SHA256) | `TotpSecretHasher.java` |
| T7 | Implement `ConstantTimeComparer` | `ConstantTimeComparer.java` |
| T8 | Implement `TotpService` (secret gen, verify, hash) | `TotpService.java` |
| T9 | Implement `QRGenerationService` (ZXing SVG + PNG) | `QRGenerationService.java` |
| T10 | Implement `TotpRateLimiter` (Redis-based) | `TotpRateLimiter.java` |

### Phase 3: Session Management (Day 5) -- 1.5d
| # | Task | Component |
|---|---|---|
| T11 | Implement `RedisSessionService` | `RedisSessionService.java` |
| T12 | Enhance `JwtUtil` with `totp_enabled` claim + refresh token | `JwtUtil.java` |

### Phase 4: Controllers & Services (Day 6-7) -- 5d
| # | Task | Component |
|---|---|---|
| T13 | Implement `AuthService` (orchestration) | `AuthService.java` |
| T14 | Extend `AuthController` login (2-flow dispatch) | `AuthController.java` |
| T15 | Implement `TotpSetupController` (setup, verify, regenerate) | `TotpSetupController.java` |
| T16 | Extend `LoginRequest`/`LoginResponse` DTOs | DTOs |
| T17 | Update `SecurityConfig` -- permit TOTP endpoints | `SecurityConfig.java` |

### Phase 5: Error Handling, Audit & Testing (Day 8-10) -- 5.5d
| # | Task | Component |
|---|---|---|
| T18 | Extend `GlobalExceptionHandler` with TOTP error codes | `GlobalExceptionHandler.java` |
| T19 | Implement async audit log writing | `AuditLog` + event publisher |
| T20 | Unit tests (TotpService, QRGenerationService, Hasher, RateLimiter) | Test classes |
| T21 | Integration tests (happy path, skip path, locked account) | Service tests |
| T22 | E2E test (full first-login flow) | E2E test |

**Total estimated effort: ~19 developer-days**

---

## 11. Test Strategy

| Test | Component | Approach |
|---|---|---|
| TOTP secret generation (20-byte, CSPRNG) | `TotpService` | Unit: verify length + Base32 correctness |
| TOTP code verification (RFC 6238 vectors) | `TotpService` | Unit: known secret+time -> known code, +/-1 tolerance |
| PBKDF2 hashing deterministic | `TotpSecretHasher` | Unit: same input -> same output |
| QR URI format (RFC 6238) | `TotpService`/`QRGen` | Unit: validate URI structure |
| QR SVG/Base64 encoding | `QRGen` | Unit: parse SVG, verify valid XML + base64 |
| Session TTL enforcement | `RedisSessionService` | Integration: expire -> GET returns null |
| Rate limit 5 attempts / 15min | `TotpRateLimiter` | Integration: 5 fails -> `isLocked()` = true |
| Anti-replay | `TotpService` | Integration: same code twice -> reject |
| Constant-time comparison | `ConstantTimeComparer` | Unit: timing test |
| Happy path flow | `AuthService` | Integration: register->login->setup->verify->JWT |
| Skip path (totp_enabled=true) | `AuthService` | Integration: pre-enrolled user -> JWT directly |
| Locked account reject | `AuthController` | Integration: locked user -> 403 |
| QR expired -> re-generate | `TotpSetupController` | Integration: /regenerate -> new QR |
| Session expired | `TotpSetupController` | Integration: >300s -> 400 SESSION_EXPIRED |

---

## 12. Acceptance Criteria Verification

| AC | Implementation |
|---|---|
| Credential auth (email/phone + password) | `AuthController.login()` -> `AuthService.authenticate()` |
| QR code RFC 6238 compliant | `QRGenerationService` via ZXing |
| TOTP 6-digit verification | `TotpService.verifyCode()` with +/-1 tolerance |
| JWT with `totp_enabled: true` claim | `JwtUtil.generateToken()` with claim |
| Reject >=5 wrong codes / 15min | `TotpRateLimiter` + Redis lockout |
| Reject locked accounts (F-277) | `AuthService` checks `locked_until` |
| QR expires in 60s | `RedisSessionService` + `qrExpiresAt` check |
| `totp_secret` hashed (PBKDF2) | `TotpSecretHasher` -- 100k iterations, 16-byte salt |

---

## 13. Cross-Feature Dependencies

| Feature | Relationship |
|---|---|
| **F-271** (Registration) | Consumed -- F-272 triggered on first login post-registration |
| **F-273** (Subsequent login) | Dependent -- delegates to F-272's AuthService for MFA check |
| **F-274** (JWT session) | Consumed -- F-272 calls JwtUtil for token issuance |
| **F-275** (3-level RBAC) | Dependent -- JWT role claim from F-275 |
| **F-277** (Login attempt policy) | Consumed -- F-272 checks `locked_until` / `failed_login_count` |

---

## 14. Security Checklist

```
[+] Credential auth BEFORE TOTP setup (cannot skip to QR)
[+] QR server-generated, raw Base32 never in response body
[+] Secret hashed (PBKDF2) BEFORE persistence
[+] TOTP secret never in logs (sanitization)
[+] Constant-time comparison for TOTP codes
[+] Rate limiting on /verify (5 attempts / 15min lockout)
[+] Session-based mechanism for TOTP (not JWT)
[+] QR expires 60s (enforced server-side)
[+] Audit log every TOTP event
[+] Account lock (F-277) blocks TOTP setup
[+] Anti-replay: last_totp_code checked
[+] Same error for invalid email AND invalid password
[+] JWT contains totp_enabled claim
```

---

## 15. CI/CD & Deployment Checklist

- [ ] `pom.xml` updated with new dependencies
- [ ] Redis added to infra (dev: Docker `redis:7-alpine`, prod: managed Redis)
- [ ] Migration SQL merged to migration pipeline
- [ ] `application.yml` updated with Redis config for prod
- [ ] Env vars: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E test passes
- [ ] Security scan: no secret leakage, no timing-attack surface
- [ ] Performance test: login + TOTP setup < 500ms (p99)

---

*Plan generated: 2026-06-23*  
*Next stage: Implementation (assign to developer)*
