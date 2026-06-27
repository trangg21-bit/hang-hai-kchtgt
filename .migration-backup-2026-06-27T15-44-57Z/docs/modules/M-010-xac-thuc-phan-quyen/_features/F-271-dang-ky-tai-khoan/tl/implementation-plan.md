# F-271 Dang ky tai khoan: Technical Implementation Plan

> **Feature:** F-271 (M-010: Xac thuc & Phan quyen)
> **SA Design:** `sa/feature-design.md`
> **Stage:** Tech-Lead Ready for implementation
> **Date:** 2026-06-23
> **Adaptation note:** All code references adapted to the existing project conventions: `com.hanghai.kchtg` package, UUID primary keys (via `BaseEntity`), `ApiResponse<T>` envelope, `user/` package as the auth domain, H2/PostgreSQL DB profiles, no MSSQL-specific features.

---

## Table of Contents

1. [Scope and Architecture Overview](#1-scope-and-architecture-overview)
2. [Component Breakdown](#2-component-breakdown)
3. [Package Structure](#3-package-structure)
4. [Interface Contracts](#4-interface-contracts)
5. [Dependency Injection Wiring](#5-dependency-injection-wiring)
6. [Error Handling Strategy](#6-error-handling-strategy)
7. [Entity Design and Migration](#7-entity-design-and-migration)
8. [Implementation Checklist](#8-implementation-checklist)
9. [Risk and Dependency Matrix](#9-risk-and-dependency-matrix)

---

## 1. Scope and Architecture Overview

### In-Scope (F-271)

| Area | What is built |
|---|---|
| **API** | `POST /api/auth/register` account creation; `POST /api/auth/verify-email` / `verify-phone`; `POST /api/auth/resend-verification`; `GET /api/auth/register-config` |
| **Entity** | `VerificationToken` (new table); `User` extensions (new columns: `passwordHash`, `passwordExpiresAt`, `passwordLastChangedAt`, `loginFailCount`, `lockedUntil`); `AccountRegistrationAudit` (new table) |
| **Service** | `RegistrationService` (main flow), `VerificationTokenService`, `PasswordPolicyValidator`, `AccountRegistrationAuditService`, `RateLimiterService`, `NotificationService`, `ClientEncryptionService` |
| **Security** | BCrypt password hashing; rate limiting (IP-based); client-side RSA encryption support; generic error messages |
| **Integration** | F-276 (password policy read), F-277 (lockout init at 0), F-001 (reuse `User` entity), F-272 (verification to active to F-272 first-login) |

### Out-of-Scope (deferred to other features)

| Deferred | Feature |
|---|---|
| JWT token generation on login | F-272 |
| TOTP setup on first login | F-272 |
| Lockout policy enforcement (max-failed-attempts to lock) | F-277 |
| Password history check at change-password time | F-276 |
| Password expiration enforcement at login | F-276 |
| SMS gateway integration | Separate feature |

### Architecture Diagram

```
ReactJS (Registration UI)
    |
    +-- GET  /api/auth/register-config     -> RegisterConfigController -> RegisterConfigService
    |
    +-- POST /api/auth/register            -> RegistrationController
    |         +-- RegistrationService
    |         |   +-- UserRepository (extends)
    |         |   +-- VerificationTokenService
    |         |   +-- PasswordPolicyValidator
    |         |   +-- ClientEncryptionService
    |         |   +-- AccountRegistrationAuditService
    |         |   +-- NotificationService
    |         +-- RateLimiterService
    |         +-- EncryptionUtil (reuse existing)
    |
    +-- POST /api/auth/verify-email        -> VerificationController
              +-- VerificationTokenService
```

---

## 2. Component Breakdown

### 2.1 DTOs (Data Transfer Objects)

#### `RegisterAccountRequest`

```java
package com.hanghai.kchtg.user.dto;
// Fields:
//   String email          -- required if phone is null
//   String phone          -- required if email is null
//   String username       -- required, [a-z0-9_]{3,100}
//   String password       -- required, client-side encrypted
//   String fullName       -- optional, max 200 chars
```

Validation:
- Mutually exclusive: exactly one of `email`/`phone` must be present
- `email`: RFC 5322 format (use `@Email` + custom validator)
- `phone`: E.164 format (regex: `^\+?[0-9]{10,15}$`)
- `username`: regex `^[a-z0-9_][a-z0-9_]{2,99}$` (no leading underscore, no consecutive underscores)

#### `RegisterConfigResponse`

```java
// Fields:
//   PasswordPolicyDTO passwordPolicy
//   String publicKey      -- RSA-2048 public key PEM (for client-side encryption)
//   RateLimitConfigDTO rateLimit
```

#### `RegisterResponse`

```java
// Fields:
//   UUID userId
//   String username
//   String email (null if phone-based)
//   String phone (null if email-based)
//   boolean emailVerified
//   String status   -- "pending_verification"
//   String verificationMethod -- "email" | "phone"
```

#### `VerifyTokenRequest`

```java
// Fields:
//   String token     -- raw verification token from email/SMS
```

#### `ResendVerificationRequest`

```java
// Fields:
//   String email  -- to find pending token
```

#### `VerifyResponse`

```java
// Fields:
//   boolean verified
//   String status  -- "active"
//   String message
```

### 2.2 Entities

#### `VerificationToken` (NEW)

```java
package com.hanghai.kchtg.user.entity;

@Entity
@Table(name = "verification_tokens", indexes = {
    @Index(name = "idx_vt_token", columnList = "token", unique = true),
    @Index(name = "idx_vt_user_id", columnList = "user_id"),
    @Index(name = "idx_vt_expires", columnList = "expires_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VerificationToken {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_vt_user"))
    private User user;

    @Column(name = "token", length = 255, nullable = false, unique = true)
    private String token;  // SHA-256 hash of raw token

    @Column(name = "verification_type", length = 20, nullable = false)
    private String verificationType;  // "email" | "phone"

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // TTL: 30 minutes from creation
    @PrePersist
    void onCreate() {
        expiresAt = LocalDateTime.now().plusMinutes(30);
    }
}
```

Note: The project uses UUID PKs via `BaseEntity`. We follow the same pattern rather than `IDENTITY` (which is MSSQL-specific).

#### `AccountRegistrationAudit` (NEW)

```java
package com.hanghai.kchtg.user.entity;

@Entity
@Table(name = "account_registration_audits", indexes = {
    @Index(name = "idx_ara_email", columnList = "user_email"),
    @Index(name = "idx_ara_created", columnList = "created_at"),
    @Index(name = "idx_ara_ip", columnList = "ip_address")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AccountRegistrationAudit {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "user_phone", length = 20)
    private String userPhone;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "result", length = 20, nullable = false)
    private String result;  // "success" | "failed_duplicate" | "failed_validation" | "failed_system"

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

#### `User` Entity Modifications (IN-PLACE UPDATE)

The existing `User` entity needs the following additions:

```java
// ADD these fields to existing User.java:

/** Password hash -- BCrypt, salt embedded in hash string. */
@Column(name = "password_hash", length = 255, nullable = false)
private String passwordHash;

/** Password expiration -- defaults to now() + 90 days at creation. */
@Column(name = "password_expires_at")
private LocalDateTime passwordExpiresAt;

/** Last password change timestamp. */
@Column(name = "password_last_changed_at")
private LocalDateTime passwordLastChangedAt;

/** Login failure count -- reset at successful login. F-277 enforces lockout. */
@Column(name = "login_fail_count", columnDefinition = "INT DEFAULT 0")
private Integer loginFailCount = 0;

/** Locked until timestamp -- null when not locked. F-277 enforces lockout. */
@Column(name = "locked_until")
private LocalDateTime lockedUntil;
```

**Migration strategy for existing `User` rows:**
- Add columns via Hibernate `ddl-auto: update` (already configured for dev)
- `passwordHash` defaults to empty string; migration at login (upgrade to BCrypt on-the-fly)
- `passwordExpiresAt` / `passwordLastChangedAt` nullable -- existing accounts unaffected
- `loginFailCount` defaults to 0; `lockedUntil` defaults to null
- **No manual migration script needed** -- schema changes are additive and backward-compatible

### 2.3 Services

#### `RegistrationService` (CORE)

```java
@Service
@Transactional
public class RegistrationService {

    private final UserRepository userRepository;
    private final VerificationTokenService verificationTokenService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final ClientEncryptionService clientEncryptionService;
    private final AccountRegistrationAuditService auditService;
    private final NotificationService notificationService;
    private final RateLimiterService rateLimiterService;

    // Constructor injection (no @Autowired needed)

    @Transactional
    public RegisterResponse register(RegisterAccountRequest dto, String ipAddress, String userAgent) {
        // 1. Rate limit check (IP-based, 3 attempts / 15 min)
        rateLimiterService.checkRegisterLimit(ipAddress);

        // 2. Mutually exclusive email/phone
        validateContactMethod(dto.getEmail(), dto.getPhone());

        // 3. Uniqueness check
        validateUniqueness(dto);

        // 4. Password policy validation (F-276)
        passwordPolicyValidator.validate(dto.getPassword(), dto.getUsername());

        // 5. Decrypt client-side encrypted password
        String decryptedPassword = clientEncryptionService.decrypt(dto.getPassword());

        // 6. Create UserAccount
        User user = createUserAccount(dto, decryptedPassword);

        // 7. Generate and store verification token
        String verificationType = dto.getEmail() != null ? "email" : "phone";
        VerificationToken token = verificationTokenService.createToken(user, verificationType);

        // 8. Send verification notification (fire-and-forget)
        sendVerificationNotification(user, verificationType, token);

        // 9. Audit log (REQUIRES_NEW to survive rollback of main tx)
        auditService.logRegistration(user, "success", null, ipAddress, userAgent);

        // 10. Return response
        return new RegisterResponse(user, verificationType);
    }
}
```

Transaction strategy: The `@Transactional` on `register()` covers steps 2-6 (repo saves). Steps 7-8 are within the same transaction. The audit log in step 9 needs `@Transactional(propagation = Propagation.REQUIRES_NEW)` so it persists even if the main registration rolls back.

#### `VerificationTokenService`

```java
@Service
public class VerificationTokenService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public VerificationToken createToken(User user, String verificationType) {
        // Invalidate any existing pending tokens for this user
        tokenRepository.findByUserIdAndVerifiedAtIsNull(user.getId()).forEach(t -> {
            t.setVerifiedAt(LocalDateTime.now());
            tokenRepository.save(t);
        });

        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String hashedToken = sha256Hex(rawToken);

        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setToken(hashedToken);
        token.setVerificationType(verificationType);
        tokenRepository.save(token);

        return new VerificationToken(token, rawToken);
    }

    @Transactional
    public boolean verifyToken(String rawToken, String expectedType) {
        String hashedToken = sha256Hex(rawToken);
        var opt = tokenRepository.findByTokenAndVerificationType(hashedToken, expectedType);
        if (opt.isEmpty()) return false;

        VerificationToken token = opt.get();
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) return false;

        token.setVerifiedAt(LocalDateTime.now());
        tokenRepository.save(token);

        // Activate user account
        User user = token.getUser();
        user.setStatus(UserStatus.ACTIVE);
        user.setPasswordLastChangedAt(LocalDateTime.now());
        userRepository.save(user);

        return true;
    }
}
```

#### `PasswordPolicyValidator` (F-276 Integration)

```java
@Service
public class PasswordPolicyValidator {

    private static final int DEFAULT_MIN_LENGTH = 12;
    // ... other defaults

    public void validate(String password, String username) {
        // F-276: Read policy from database (singleton row) via PasswordPolicyRepository
        // Fall back to defaults if no policy row exists
        // Check: minLength, uppercase, lowercase, digit, special char, blockUsername
        // Throw ValidationException with specific violation messages on failure
    }
}
```

#### `AccountRegistrationAuditService`

```java
@Service
public class AccountRegistrationAuditService {

    private final AccountRegistrationAuditRepository auditRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logRegistration(User user, String result, String failureReason,
                                 String ipAddress, String userAgent) {
        AccountRegistrationAudit audit = new AccountRegistrationAudit();
        audit.setUserEmail(user.getEmail());
        audit.setUserPhone(user.getPhone());
        audit.setUsername(user.getUsername());
        audit.setResult(result);
        audit.setFailureReason(failureReason);
        audit.setIpAddress(ipAddress);
        audit.setUserAgent(userAgent);
        auditRepository.save(audit);
    }
}
```

#### `RateLimiterService` (IP-based, in-memory)

```java
@Service
public class RateLimiterService {

    // 3 attempts per 15-minute sliding window per IP
    private static final int MAX_ATTEMPTS = 3;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    private final Map<String, Deque<Instant>> attemptsByIp = new ConcurrentHashMap<>();

    public void checkRegisterLimit(String ipAddress) {
        Instant now = Instant.now();
        Deque<Instant> attempts = attemptsByIp.computeIfAbsent(ipAddress, k -> new ArrayDeque<>());

        // Remove expired entries
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(now.minus(WINDOW))) {
            attempts.pollFirst();
        }

        if (attempts.size() >= MAX_ATTEMPTS) {
            throw new RateLimitExceededException("RATE_LIMIT_EXCEEDED",
                "Qua giai han dang ky. Vui long thu lai sau 15 phut.");
        }

        attempts.addLast(now);
    }
}
```

Note: In prod, replace with Redis-based rate limiting.

#### `NotificationService` (abstraction)

```java
@Service
public class NotificationService {

    public void sendVerificationEmail(String email, String token) {
        // Build email content with verification link:
        //   /verify-email?token={token}
        // Send via spring-boot-starter-mail (SMTP)
    }

    public void sendVerificationSms(String phone, String token) {
        // Placeholder -- SMS gateway integration deferred
        log.warn("SMS verification not yet implemented for {}", phone);
    }
}
```

#### `ClientEncryptionService` (RSA)

The SA design calls for RSA client-side encryption. The existing `EncryptionUtil` provides AES-256-GCM (symmetric). For RSA client-server encryption, we need a new component:

```java
@Component
public class ClientEncryptionService {

    private final PrivateKey privateKey;
    private final PublicKey publicKey;
    private final String publicKeyPem;

    // Load from application.yml:
    //   rsa:
    //     private-key: |  (RSA 2048 PEM)
    //     public-key: |   (RSA 2048 PEM)

    public String decrypt(String encryptedBase64) {
        // RSA-OAEP with SHA-256
        return plaintext;
    }

    public String getPublicKeyPem() {
        return publicKeyPem;
    }
}
```

Risk: RSA key management requires secure storage. For initial implementation, use a static key pair from `application.yml`. Rotate keys via a dedicated key-management feature.

### 2.4 Controllers

#### `RegistrationController`

```java
@RestController
@RequestMapping("/api/auth")
public class RegistrationController {

    private final RegistrationService registrationService;
    private final RateLimiterService rateLimiterService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterAccountRequest dto,
            HttpServletRequest request) {

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        try {
            rateLimiterService.checkRegisterLimit(ipAddress);
        } catch (RateLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(ApiResponse.error(e.getMessage()));
        }

        try {
            RegisterResponse response = registrationService.register(dto, ipAddress, userAgent);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                    "Dang ky thanh cong. Vui long kiem tra email de xac thuc tai khoan.",
                    response));
        } catch (DuplicateResourceException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(e.getMessage()));
        } catch (ValidationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", e.getViolations()));
        }
    }
}
```

#### `RegisterConfigController`

```java
@RestController
@RequestMapping("/api/auth")
public class RegisterConfigController {

    private final ClientEncryptionService clientEncryptionService;
    private final PasswordPolicyValidator passwordPolicyValidator;

    @GetMapping("/register-config")
    public ResponseEntity<ApiResponse<RegisterConfigResponse>> getConfig() {
        RegisterConfigResponse config = new RegisterConfigResponse(
            passwordPolicyValidator.getPolicy(),
            clientEncryptionService.getPublicKeyPem(),
            new RateLimitConfigDTO(3, 15)
        );
        return ResponseEntity.ok(ApiResponse.success(config));
    }
}
```

#### `VerificationController`

```java
@RestController
@RequestMapping("/api/auth")
public class VerificationController {

    private final VerificationTokenService verificationTokenService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyEmail(
            @Valid @RequestBody VerifyTokenRequest request) {

        boolean verified = verificationTokenService.verifyToken(request.getToken(), "email");
        if (!verified) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Ma xac thuc khong hop le hoac da het han."));
        }

        return ResponseEntity.ok(ApiResponse.success(
            "Xac thanh cong. Tai khoan cua ban da duoc kich hoat.",
            new VerifyResponse(true, "active", "Xac thanh cong.")));
    }

    @PostMapping("/verify-phone")
    public ResponseEntity<ApiResponse<VerifyResponse>> verifyPhone(
            @Valid @RequestBody VerifyTokenRequest request) {
        // Same flow as email
        boolean verified = verificationTokenService.verifyToken(request.getToken(), "phone");
        // ...
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        // Find user by email -> create new token -> send notification
        // Rate limit: 1 resend / 5 minutes per email
        // ...
    }
}
```

---

## 3. Package Structure

Following the existing project convention (`com.hanghai.kchtg.<domain>.<layer>`), the new code lives under `user/`:

```
src/main/java/com/hanghai/kchtg/user/
+-- dto/
|   +-- RegisterAccountRequest.java        -- NEW
|   +-- RegisterResponse.java              -- NEW
|   +-- RegisterConfigResponse.java        -- NEW
|   +-- VerifyTokenRequest.java            -- NEW
|   +-- VerifyResponse.java                -- NEW
|   +-- ResendVerificationRequest.java     -- NEW
|   +-- RateLimitConfigDTO.java            -- NEW (inner helper)
|
+-- entity/
|   +-- User.java                          -- EXTEND (add columns)
|   +-- UserStatus.java                    -- EXTEND (add PENDING_VERIFICATION)
|   +-- VerificationToken.java             -- NEW
|   +-- AccountRegistrationAudit.java      -- NEW
|
+-- repository/
|   +-- UserRepository.java                -- EXTEND (add existsByPhone, etc.)
|   +-- VerificationTokenRepository.java   -- NEW
|   +-- AccountRegistrationAuditRepository.java -- NEW
|
+-- service/
|   +-- UserService.java                   -- (existing, unchanged)
|   +-- RegistrationService.java           -- NEW
|   +-- VerificationTokenService.java      -- NEW
|   +-- PasswordPolicyValidator.java       -- NEW
|   +-- AccountRegistrationAuditService.java -- NEW
|   +-- RateLimiterService.java            -- NEW
|   +-- NotificationService.java           -- NEW
|
+-- controller/
|   +-- AuthController.java                -- (existing login -- unchanged)
|   +-- RegistrationController.java        -- NEW
|   +-- RegisterConfigController.java      -- NEW
|   +-- VerificationController.java        -- NEW
|
+-- exception/
|   +-- RegistrationException.java         -- NEW (base)
|   +-- DuplicateResourceException.java    -- NEW (extends RegistrationException)
|   +-- ValidationException.java           -- NEW (extends RegistrationException)
|   +-- RateLimitExceededException.java    -- NEW (extends RegistrationException)

src/main/java/com/hanghai/kchtg/security/
+-- ClientEncryptionService.java           -- NEW (RSA client-side encryption)

src/main/resources/
+-- application.yml                        -- EXTEND (add RSA key config, rate limit settings)
+-- data.sql                               -- EXTEND (seed PasswordPolicy row for F-276)
```

---

## 4. Interface Contracts

### 4.1 API Endpoints Summary

| Method | Endpoint | Auth | Status Codes | Returns |
|---|---|---|---|---|
| `GET` | `/api/auth/register-config` | None | 200 | `RegisterConfigResponse` |
| `POST` | `/api/auth/register` | None | 201, 400, 409, 429, 500 | `RegisterResponse` |
| `POST` | `/api/auth/verify-email` | None | 200, 400 | `VerifyResponse` |
| `POST` | `/api/auth/verify-phone` | None | 200, 400 | `VerifyResponse` |
| `POST` | `/api/auth/resend-verification` | None | 200, 400, 429 | `{ success: true }` |

### 4.2 Request/Response JSON Schemas

**POST /api/auth/register -- Request**
```json
{
  "email": "user@example.com",
  "phone": null,
  "username": "nguyenvana",
  "password": "EncryptedBase64String",
  "fullName": "Nguyen Van A"
}
```

**POST /api/auth/register -- Response (201)**
```json
{
  "success": true,
  "message": "Dang ky thanh cong. Vui long kiem tra email de xac thuc tai khoan.",
  "data": {
    "userId": "a1b2c3d4-...",
    "username": "nguyenvana",
    "email": "user@example.com",
    "phone": null,
    "emailVerified": false,
    "status": "pending_verification",
    "verificationMethod": "email"
  },
  "timestamp": "2026-06-23T08:00:00"
}
```

**POST /api/auth/register -- Error (409)**
```json
{
  "success": false,
  "message": "Email da duoc su dung",
  "timestamp": "2026-06-23T08:00:00"
}
```

**POST /api/auth/register -- Error (400 validation)**
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "username": "Username da ton tai",
    "password": "Mat khau qua ngan (toi thieu 12 ky tu)"
  },
  "timestamp": "2026-06-23T08:00:00"
}
```

**POST /api/auth/register -- Error (429)**
```json
{
  "success": false,
  "message": "Qua giai han dang ky. Vui long thu lai sau 15 phut.",
  "timestamp": "2026-06-23T08:00:00"
}
```

**GET /api/auth/register-config -- Response (200)**
```json
{
  "success": true,
  "data": {
    "passwordPolicy": {
      "minLength": 12,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireDigit": true,
      "requireSpecialChar": true,
      "specialCharSet": "!@#$%^&*()-_=+",
      "maxAgeDays": 90,
      "historyDepth": 5,
      "blockUsernameInPassword": true
    },
    "publicKey": "-----BEGIN PUBLIC KEY-----\n...",
    "rateLimit": {
      "maxAttempts": 3,
      "windowMinutes": 15
    }
  }
}
```

### 4.3 Repository Interfaces

#### `VerificationTokenRepository`

```java
@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByTokenAndVerificationType(String token, String type);
    List<VerificationToken> findByUserIdAndVerifiedAtIsNull(UUID userId);
    Optional<VerificationToken> findByToken(String token);
    void deleteByUserId(UUID userId);
}
```

#### `AccountRegistrationAuditRepository`

```java
@Repository
public interface AccountRegistrationAuditRepository
        extends JpaRepository<AccountRegistrationAudit, UUID> {
    List<AccountRegistrationAudit> findByUserEmail(String email);
    List<AccountRegistrationAudit> findByIpAddress(String ipAddress);
    List<AccountRegistrationAudit> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
}
```

#### `UserRepository` additions

```java
// ADD to existing UserRepository:
boolean existsByPhone(String phone);
Optional<User> findByPhone(String phone);
```

---

## 5. Dependency Injection Wiring

All dependencies resolved via Spring constructor injection. No `@Autowired` needed (Spring Boot 3.x).

```
+--------------------------------------------------------------+
|                      Spring ApplicationContext                  |
|                                                                |
|  @Component +----------------------+   @Service +-----------+|
|             |   EncryptionUtil     |            |  RateLimiter||
|             |   (AES-256-GCM)      |            |   Service   ||
|             +----------------------+            +-------------+|
|                      |                                  |     |
|                      v (reuse for AES operations)       |     |
|             +----------------------+                    |     |
|             |  ClientEncryption    |                    |     |
|             |    Service           |                    |     |
|             |  (RSA for client)    |                    |     |
|             +----------------------+                    |     |
|                      |                                  |     |
|                      v                                  |     |
|             +----------------------+                    |     |
|             |  PasswordPolicy      |                    |     |
|             |  Validator           |                    |     |
|             +----------------------+                    |     |
|                      |                                  |     |
|                      v                                  |     |
|             +----------------------+   @Service +-----+-----+|
|             |  Registration       |<---------->|  AccountReg||
|             |  Service            |            |  AuditService||
|             +---------------------+            +-------------+|
|                      |                                        |
|                      +---> UserRepository                      |
|                      +---> VerificationTokenService            |
|                      |    +---> VerificationTokenRepository    |
|                      +---> NotificationService                  |
|                           +---> Spring Mail / SMS (abstraction) |
|                                                                |
|  +----------------------------------------------------------+  |
|  |  @RestController                                            |  |
|  |  RegistrationController                                     |  |
|  |  +-- RegistrationService                                   |  |
|  |  +-- RateLimiterService                                    |  |
|  |                                                              |  |
|  |  RegisterConfigController                                   |  |
|  |  +-- ClientEncryptionService                                |  |
|  |  +-- PasswordPolicyValidator                                |  |
|  |                                                              |  |
|  |  VerificationController                                     |  |
|  |  +-- VerificationTokenService                               |  |
|  |  +-- UserRepository                                         |  |
|  |  +-- NotificationService                                    |  |
|  +----------------------------------------------------------+  |
|                                                                |
|  +----------------------------------------------------------+  |
|  |  @RestControllerAdvice                                      |  |
|  |  GlobalExceptionHandler                                     |  |
|  |  +-- RegistrationException subclasses -> appropriate HTTP  |  |
|  |  +-- (existing handlers remain unchanged)                  |  |
|  +----------------------------------------------------------+  |
+--------------------------------------------------------------+
```

**Bean lifecycle notes:**
- `EncryptionUtil` -- already exists; reused for AES operations
- `ClientEncryptionService` -- new; holds RSA key pair loaded from `application.yml`
- `RateLimiterService` -- singleton; in-memory map
- `PasswordPolicyValidator` -- singleton; lazy-loads policy from DB; caches in memory
- All services use constructor injection -- no circular dependency risk

---

## 6. Error Handling Strategy

### 6.1 Exception Hierarchy

```
RegistrationException (abstract, extends RuntimeException)
+-- DuplicateResourceException   -> 409 Conflict
|   +-- DUPLICATE_EMAIL
|   +-- DUPLICATE_USERNAME
|   +-- DUPLICATE_PHONE
+-- ValidationException          -> 400 Bad Request
|   +-- PASSWORD_POLICY_VIOLATION
|   +-- FIELD_VALIDATION_ERROR
+-- RateLimitExceededException   -> 429 Too Many Requests
+-- VerificationException        -> 400 Bad Request
    +-- TOKEN_EXPIRED
    +-- TOKEN_INVALID
    +-- ACCOUNT_ALREADY_ACTIVE
```

### 6.2 GlobalExceptionHandler Extension

Extend the existing `GlobalExceptionHandler` with handlers for F-271 exception types:

```java
// ADD these methods to GlobalExceptionHandler.java:

@ExceptionHandler(DuplicateResourceException.class)
public ResponseEntity<ApiResponse<String>> handleDuplicateResource(
        DuplicateResourceException ex) {
    log.warn("Duplicate resource: {}", ex.getMessage());
    return ResponseEntity
        .status(HttpStatus.CONFLICT)
        .body(ApiResponse.error(ex.getMessage()));
}

@ExceptionHandler(ValidationException.class)
public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
        ValidationException ex) {
    log.debug("Registration validation failed: {}", ex.getViolations());
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error("Validation failed", ex.getViolations()));
}

@ExceptionHandler(RateLimitExceededException.class)
public ResponseEntity<ApiResponse<String>> handleRateLimit(
        RateLimitExceededException ex) {
    log.info("Rate limit exceeded from IP: {}", ex.getIpAddress());
    return ResponseEntity
        .status(HttpStatus.TOO_MANY_REQUESTS)
        .body(ApiResponse.error(ex.getMessage()));
}

@ExceptionHandler(VerificationException.class)
public ResponseEntity<ApiResponse<String>> handleVerification(
        VerificationException ex) {
    log.debug("Verification failed: {}", ex.getMessage());
    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(ApiResponse.error(ex.getMessage()));
}
```

### 6.3 Security Principles

| Principle | Implementation |
|---|---|
| No account enumeration | All uniqueness violations return 409 with specific field name |
| No password leakage | Password never logged, never in error messages, never in API responses |
| Audit trail | Every registration attempt (success/failure) logged in `account_registration_audits` |
| Rate limiting | IP-based sliding window; enforced at controller and service layer |
| Client-side encryption | Password encrypted with RSA public key before transmission |
| Token security | Verification tokens hashed (SHA-256) in DB; raw token sent via email/SMS; single-use with 30-min TTL |

---

## 7. Entity Design and Migration

### 7.1 Database Changes (Hibernate DDL)

With `spring.jpa.hibernate.ddl-auto: update`, Hibernate will automatically:
1. Add columns to `app_users` table (via `User` entity modifications)
2. Create `verification_tokens` table
3. Create `account_registration_audits` table
4. Create indexes

For production (PostgreSQL with `ddl-auto: validate`), a Flyway/Liquibase migration script is needed:

```sql
-- V1__add_registration_fields_to_users.sql
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT '';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_last_changed_at TIMESTAMP;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS login_fail_count INT DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- V2__create_verification_tokens.sql
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    verification_type VARCHAR(20) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_vt_user_id ON verification_tokens(user_id);
CREATE INDEX idx_vt_expires ON verification_tokens(expires_at);

-- V3__create_registration_audits.sql
CREATE TABLE account_registration_audits (
    id UUID PRIMARY KEY,
    user_email VARCHAR(255),
    user_phone VARCHAR(20),
    username VARCHAR(100),
    result VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_ara_email ON account_registration_audits(user_email);
CREATE INDEX idx_ara_created ON account_registration_audits(created_at);
CREATE INDEX idx_ara_ip ON account_registration_audits(ip_address);
```

### 7.2 Entity Relationship Summary

```
User (1) --+-- (N) VerificationToken
           +-- (N) AccountRegistrationAudit
           +-- (1) OrgUnit  (existing, LAZY)

VerificationToken (N) -- (1) User  (FK user_id, ON DELETE CASCADE)

AccountRegistrationAudit -- standalone append-only table (no FK to User)
```

### 7.3 UserStatus Enum Extension

Add `PENDING_VERIFICATION` to existing enum:

```java
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    LOCKED,
    DELETED,
    PENDING_VERIFICATION   -- NEW: assigned at registration, transitions to ACTIVE on verification
}
```

---

## 8. Implementation Checklist

### Phase 1: Foundation (Day 1)

- [ ] **1.1** Extend `UserStatus` enum with `PENDING_VERIFICATION`
- [ ] **1.2** Add new columns to `User` entity: `passwordHash`, `passwordExpiresAt`, `passwordLastChangedAt`, `loginFailCount`, `lockedUntil`
- [ ] **1.3** Add `existsByPhone()` and `findByPhone()` to `UserRepository`
- [ ] **1.4** Add `data.sql` seed for `PasswordPolicy` singleton row (F-276)
- [ ] **1.5** Create `VerificationToken` entity
- [ ] **1.6** Create `AccountRegistrationAudit` entity
- [ ] **1.7** Create `VerificationTokenRepository`
- [ ] **1.8** Create `AccountRegistrationAuditRepository`
- [ ] **1.9** Verify DDL generation with H2 (dev profile)

### Phase 2: Core Services (Day 2)

- [ ] **2.1** Create `ClientEncryptionService` (RSA key pair + encrypt/decrypt)
- [ ] **2.2** Create `PasswordPolicyValidator` with default policy
- [ ] **2.3** Create `RateLimiterService` (in-memory sliding window)
- [ ] **2.4** Create `AccountRegistrationAuditService` with `REQUIRES_NEW`
- [ ] **2.5** Create `NotificationService` stub (email only, SMS deferred)
- [ ] **2.6** Create `VerificationTokenService` with `createToken()` and `verifyToken()`
- [ ] **2.7** Create `RegistrationService` with full registration flow

### Phase 3: DTOs and Controllers (Day 3)

- [ ] **3.1** Create all request DTOs: `RegisterAccountRequest`, `VerifyTokenRequest`, `ResendVerificationRequest`
- [ ] **3.2** Create all response DTOs: `RegisterResponse`, `RegisterConfigResponse`, `VerifyResponse`, `RateLimitConfigDTO`
- [ ] **3.3** Create `RegistrationController` with `POST /api/auth/register`
- [ ] **3.4** Create `RegisterConfigController` with `GET /api/auth/register-config`
- [ ] **3.5** Create `VerificationController` with `verify-email`, `verify-phone`, `resend-verification`

### Phase 4: Exception Handling and Security (Day 3-4)

- [ ] **4.1** Create exception hierarchy: `RegistrationException` and subclasses
- [ ] **4.2** Extend `GlobalExceptionHandler` with F-271 handlers
- [ ] **4.3** Add security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] **4.4** Verify rate limit enforcement (test 4+ attempts from same IP)
- [ ] **4.5** Test client-side RSA encryption / server-side decryption flow

### Phase 5: Integration and Testing (Day 4-5)

- [ ] **5.1** Test full registration to verification flow end-to-end
- [ ] **5.2** Test duplicate email/username/phone detection (409 responses)
- [ ] **5.3** Test password policy enforcement (reject weak passwords)
- [ ] **5.4** Test audit log entries created for each attempt
- [ ] **5.5** Test verification token expiration (30-min TTL)
- [ ] **5.6** Test resend verification (5-min cooldown)
- [ ] **5.7** Write unit tests for all services
- [ ] **5.8** Write integration tests for all controllers
- [ ] **5.9** Performance test: registration < 500ms p95

### Phase 6: Polish and Production Prep (Day 5-6)

- [ ] **6.1** Add Flyway migration scripts for production (PostgreSQL)
- [ ] **6.2** Configure production RSA key pair (rotate from dev key)
- [ ] **6.3** Replace in-memory rate limiter with Redis-based (prod profile)
- [ ] **6.4** Add Swagger/OpenAPI documentation for new endpoints
- [ ] **6.5** Update `implementations.yaml` with primary owner
- [ ] **6.6** Code review + security audit
- [ ] **6.7** Update feature status to `implemented`

---

## 9. Risk and Dependency Matrix

| Risk | Severity | Mitigation | Owner |
|---|---|---|---|
| RSA key management (static key in yml) | High | Rotate key pair before prod; add key versioning | Backend Dev |
| SMS gateway not yet available | Medium | `verify-phone` endpoint returns "not implemented" message; gate behind feature flag | Backend Dev |
| In-memory rate limiter does not scale to multi-instance | Medium | Use Redis-based rate limiter for prod; in-memory for dev/single-instance | Backend Dev |
| `ddl-auto: update` in prod (already `validate`) | Low | Migration script (Flyway) provided in Phase 6 | DevOps/Backend |
| F-276 `PasswordPolicy` not yet implemented | High | Use default policy; F-276 must be merged before or alongside F-271 | Backend Dev |
| Client-side RSA encryption adds frontend complexity | Medium | Provide SDK or library; test with curl first, frontend integration later | Frontend + Backend |
| `User.phone` unique constraint with nullable | Medium | Unique index on nullable column needs filtered index. H2/PostgreSQL support varies. Test carefully. | Backend Dev |
| Circular dependency risk in verification flow | Low | Inject `UserRepository` directly; no bidirectional service references | Backend Dev |

### Feature Dependencies (must be ready)

| Dependency | Status | Notes |
|---|---|---|
| F-276 (Password Policy) | Must be merged | `PasswordPolicy` singleton row needed; `PasswordPolicyValidator` reads from DB |
| F-001 (User entity baseline) | Already exists | `User`, `UserStatus`, `UserRepository` exist |
| F-272 (First login + TOTP) | Deferred | F-271 creates account to F-272 uses it |
| Spring Security filter chain | Already configured | `JwtAuthFilter`, `PasswordEncoder` bean exist |
| Spring Mail (`spring-boot-starter-mail`) | Needs config | SMTP credentials in `application-prod.yml` |

---

## Appendix A: File-by-File Implementation Order

Recommended implementation order to avoid build breakage:

1. `UserStatus.java` -- add `PENDING_VERIFICATION`
2. `User.java` -- add new fields
3. `UserRepository.java` -- add `existsByPhone`, `findByPhone`
4. `VerificationToken.java` -- new entity
5. `AccountRegistrationAudit.java` -- new entity
6. `VerificationTokenRepository.java` -- new
7. `AccountRegistrationAuditRepository.java` -- new
8. `RegistrationException.java` -- new (base)
9. All exception subclasses
10. `ClientEncryptionService.java` -- new
11. `PasswordPolicyValidator.java` -- new
12. `RateLimiterService.java` -- new
13. `AccountRegistrationAuditService.java` -- new
14. `NotificationService.java` -- new
15. `VerificationTokenService.java` -- new
16. `RegistrationService.java` -- new
17. All DTOs
18. `RegistrationController.java` -- new
19. `RegisterConfigController.java` -- new
20. `VerificationController.java` -- new
21. `GlobalExceptionHandler.java` -- extend
22. `application.yml` -- add RSA key config, rate limit settings
23. `data.sql` -- seed `PasswordPolicy`

---

## Appendix B: Configuration Changes

### `application.yml` additions

```yaml
# -- Registration Configuration ------------------------------------------------
registration:
  rate-limit:
    max-attempts: 3
    window-minutes: 15
  verification:
    token-ttl-minutes: 30
    resend-cooldown-minutes: 5

# -- RSA Key Pair for Client-Side Encryption ------------------------------------
rsa:
  private-key: |
    -----BEGIN RSA PRIVATE KEY-----
    MIIEpAIBAAKCAQEA... (rotate for prod)
    -----END RSA PRIVATE KEY-----
  public-key: |
    -----BEGIN PUBLIC KEY-----
    MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA... (rotate for prod)
    -----END PUBLIC KEY-----
```

### Dependencies (pom.xml / build.gradle)

Already satisfied by existing:
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-security`
- `spring-boot-starter-validation`
- `spring-boot-starter-mail` -- add if not present

New dependencies needed:
- `resilience4j-spring-boot3` -- for circuit breaker on notification services (optional, Phase 6)
