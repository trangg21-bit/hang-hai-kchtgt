---
id: F-271
name: "Đăng ký tài khoản"
slug: dang-ky-tai-khoan
module-id: M-010
stage: system-architect
status: in_design
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-23T00:00:00Z
locked-fields: []
consumed_by_modules: []
---

# SA Stage: F-271 — Đăng ký tài khoản

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 UserAccount (extends M-001 baseline)

> **Note:** F-271 bổ sung/cập nhật các trường mật khẩu và lockout vào UserAccount đã định nghĩa ở F-001 (M-001).
> Các field mới được đánh dấu bằng `← F-271`.

```java
@Entity
@Table(name = "user_accounts", indexes = {
    @Index(name = "idx_user_accounts_email", columnList = "email", unique = true),
    @Index(name = "idx_user_accounts_username", columnList = "username", unique = true),
    @Index(name = "idx_user_accounts_status", columnList = "status"),
    @Index(name = "idx_user_accounts_role_id", columnList = "role_id"),
    @Index(name = "idx_user_accounts_phone", columnList = "phone", unique = true)
})
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "username", length = 100, nullable = false, unique = true)
    private String username;

    @Column(name = "email", length = 255, nullable = false, unique = true)
    private String email;

    @Column(name = "phone", length = 20, unique = true)
    private String phone; // đăng ký qua SĐT (tùy chọn)

    // ← F-271: Password fields (bcrypt hash, salt embedded in hash)
    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "password_expires_at")
    private LocalDateTime passwordExpiresAt; // ← F-276 integration

    @Column(name = "password_last_changed_at")
    private LocalDateTime passwordLastChangedAt; // ← F-276 integration

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Unit organization;

    @Column(name = "status", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | inactive | locked | pending_verification

    // ← F-277: Lockout tracking fields
    @Column(name = "login_fail_count", columnDefinition = "INT DEFAULT 0")
    private Integer loginFailCount = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (loginFailCount == null) loginFailCount = 0;
    }

    @PreUpdate void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 1.2 VerificationToken (F-271 core entity)

> **Purpose:** Email/Phone verification after registration. Token-based account activation flow.

```java
@Entity
@Table(name = "verification_tokens", indexes = {
    @Index(name = "idx_verification_tokens_token", columnList = "token", unique = true),
    @Index(name = "idx_verification_tokens_user_id", columnList = "user_id")
})
public class VerificationToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "token", length = 255, nullable = false, unique = true)
    private String token;

    @Column(name = "verification_type", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20)")
    private String verificationType; // email | phone

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = LocalDateTime.now().plusMinutes(30); // 30-minute TTL
    }
}
```

### 1.3 AccountRegistrationAudit (F-271 audit trail)

> **Purpose:** Immutable log of every registration attempt (success/failure) for security auditing.

```java
@Entity
@Table(name = "account_registration_audits", indexes = {
    @Index(name = "idx_reg_audit_user_email", columnList = "user_email"),
    @Index(name = "idx_reg_audit_created_at", columnList = "created_at"),
    @Index(name = "idx_reg_audit_ip", columnList = "ip_address")
})
public class AccountRegistrationAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "user_email", length = 255)
    private String userEmail;

    @Column(name = "user_phone", length = 20)
    private String userPhone;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "result", length = 20, nullable = false,
            columnDefinition = "VARCHAR(20)")
    private String result; // success | failed_duplicate | failed_validation | failed_system

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "referer", length = 500)
    private String referer;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
```

### 1.4 Relationship Diagram

```
UserAccount 1──N VerificationToken
UserAccount 1──N AccountRegistrationAudit
UserAccount N──1 Role         (via role_id FK)
UserAccount N──1 Unit         (via organization_id FK — optional)
UserAccount 1──N UserRole     (via F-002, junction for many-to-many)
UserAccount 1──1 UserPassword (via F-276, password hash + expiration)
UserAccount 1──N LoginAttempt (via F-277, login attempt tracking)
```

## 2. DDL — Database Schema (MSSQL 2022)

### 2.1 Verification_Tokens

```sql
CREATE TABLE [dbo].[verification_tokens] (
    [id]                  BIGINT           IDENTITY(1,1) NOT NULL,
    [user_id]             BIGINT           NOT NULL,
    [token]               NVARCHAR(255)    NOT NULL,
    [verification_type]   VARCHAR(20)      NOT NULL,   -- 'email' | 'phone'
    [expires_at]          DATETIME2(3)     NOT NULL,
    [verified_at]         DATETIME2(3)     NULL,
    [created_at]          DATETIME2(3)     NOT NULL CONSTRAINT [DF_verification_tokens_created_at] DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_verification_tokens] PRIMARY KEY CLUSTERED ([id] ASC),
    CONSTRAINT [UQ_verification_tokens_token] UNIQUE NONCLUSTERED ([token] ASC),
    CONSTRAINT [FK_verification_tokens_user] FOREIGN KEY ([user_id])
        REFERENCES [dbo].[user_accounts] ([id])
        ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX [idx_verification_tokens_user_id]
    ON [dbo].[verification_tokens] ([user_id]) INCLUDE ([token], [expires_at], [verification_type]);

CREATE NONCLUSTERED INDEX [idx_verification_tokens_expires]
    ON [dbo].[verification_tokens] ([expires_at]) INCLUDE ([user_id], [token])
    WHERE [verified_at] IS NULL;  -- Filtered index: only pending tokens
```

### 2.2 Account_Registration_Audits

```sql
CREATE TABLE [dbo].[account_registration_audits] (
    [id]                BIGINT            IDENTITY(1,1) NOT NULL,
    [user_email]        NVARCHAR(255)     NULL,
    [user_phone]        NVARCHAR(20)      NULL,
    [username]          NVARCHAR(100)     NULL,
    [result]            VARCHAR(20)       NOT NULL,     -- 'success' | 'failed_duplicate' | 'failed_validation' | 'failed_system'
    [failure_reason]    NVARCHAR(500)     NULL,
    [ip_address]        NVARCHAR(45)      NULL,
    [user_agent]        NVARCHAR(500)     NULL,
    [referer]           NVARCHAR(500)     NULL,
    [created_at]        DATETIME2(3)      NOT NULL CONSTRAINT [DF_reg_audit_created_at] DEFAULT SYSDATETIME(),
    CONSTRAINT [PK_account_registration_audits] PRIMARY KEY CLUSTERED ([id] ASC)
);

CREATE NONCLUSTERED INDEX [idx_reg_audit_user_email]
    ON [dbo].[account_registration_audits] ([user_email]);

CREATE NONCLUSTERED INDEX [idx_reg_audit_created_at]
    ON [dbo].[account_registration_audits] ([created_at])
    INCLUDE ([user_email], [result]);

CREATE NONCLUSTERED INDEX [idx_reg_audit_ip]
    ON [dbo].[account_registration_audits] ([ip_address])
    INCLUDE ([user_email], [created_at]);
```

### 2.3 Updates to User_Accounts (F-271 additions to M-001 baseline)

```sql
-- Add phone column if not exists (for SĐT-based registration)
IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'phone')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [phone] NVARCHAR(20) NULL;
    CREATE UNIQUE NONCLUSTERED INDEX [idx_user_accounts_phone]
        ON [dbo].[user_accounts] ([phone]) WHERE [phone] IS NOT NULL;
END

-- Add password lifecycle columns (F-271 + F-276 integration)
IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'password_hash')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [password_hash] NVARCHAR(255) NOT NULL CONSTRAINT [DF_user_accounts_pw_hash] DEFAULT '';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'password_expires_at')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [password_expires_at] DATETIME2(3) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'password_last_changed_at')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [password_last_changed_at] DATETIME2(3) NULL;
END

-- Add lockout tracking columns (F-277 integration)
IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'login_fail_count')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [login_fail_count] INT NOT NULL CONSTRAINT [DF_user_accounts_fail_count] DEFAULT 0;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[user_accounts]')
    AND name = 'locked_until')
BEGIN
    ALTER TABLE [dbo].[user_accounts] ADD [locked_until] DATETIME2(3) NULL;
END
```

### 2.4 DDL Summary Table

| Table | PK | Unique Indexes | Non-Clustered Indexes | Notes |
|---|---|---|---|---|
| `verification_tokens` | `id` (IDENTITY) | `token` | `user_id`, `expires_at` (filtered) | 30-min TTL, auto-cleanup via scheduled job |
| `account_registration_audits` | `id` (IDENTITY) | — | `user_email`, `created_at`, `ip_address` | Immutable audit, append-only |
| `user_accounts` (updates) | `id` (IDENTITY) | `email`, `username`, `phone` | `status`, `role_id`, `login_fail_count` | Fields added by F-271/F-276/F-277 |

## 3. API Endpoint Specs

All endpoints use `/api/v1/` prefix. Request/Response bodies are JSON.  
Error responses follow the standard format:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
```

### 3.1 Registration Flow

| Method | Endpoint | Description | Auth | Request Body | Response (200) |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Đăng ký tài khoản mới (email hoặc SĐT) | Public | `RegisterAccountDTO` (see §3.2) | `RegistrationResponseDTO` (see §3.3) |

**Status Codes:**
| Code | Meaning |
|---|---|
| `201 Created` | Đăng ký thành công, verification token đã tạo |
| `400 Bad Request` | Dữ liệu không hợp lệ (validation error) |
| `409 Conflict` | Email/username/SĐT đã tồn tại |
| `429 Too Many Requests` | Rate limit exceeded (3 đăng ký/15 phút/ip) |
| `500 Internal Server Error` | Lỗi hệ thống |

#### §3.2 Request Body — RegisterAccountDTO

```json
{
  "email": "user@example.com",        // required if phone not provided
  "phone": "+84901234567",            // required if email not provided
  "username": "nguyenvana",           // required: 3-100 chars, lowercase + underscore + number only
  "password": "EncryptedBase64String", // required: client-side encrypted, server-side validated
  "fullName": "Nguyễn Văn A"          // optional: 0-200 chars
}
```

**Validation rules:**
- `email` and `phone` are mutually exclusive — at least one required, both optional (but not both null).
- `email`: valid RFC 5322 format if provided.
- `phone`: E.164 format if provided (e.g., `+84901234567` or `84901234567`).
- `username`: `[a-z0-9_]`, 3–100 characters, no consecutive underscores, not starting with underscore.
- `password`: client-side AES-256 encrypted before transmission (public key from `GET /api/v1/auth/register-config`). Server decrypts, then validates against F-276 complexity policy.
- `fullName`: UTF-8, max 200 characters.

#### §3.3 Response Body — RegistrationResponseDTO

```json
{
  "success": true,
  "data": {
    "userId": 12345,
    "username": "nguyenvana",
    "email": "user@example.com",
    "emailVerified": false,
    "status": "pending_verification",
    "verificationMethod": "email",
    "message": "Vui lòng kiểm tra email để xác thực tài khoản"
  }
}
```

#### §3.4 Error Response Examples

```json
// 409 — Duplicate
{
  "success": false,
  "error": {
    "code": "DUPLICATE_EMAIL",
    "message": "Email đã được sử dụng"
  }
}

// 400 — Validation
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      { "field": "username", "message": "Username đã tồn tại" },
      { "field": "password", "message": "Mật khẩu quá ngắn (tối thiểu 12 ký tự)" }
    ]
  }
}
```

### 3.2 Verification Flow

| Method | Endpoint | Description | Auth | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/verify-email` | Xác thực email | Public | `{ token }` | `VerificationResponseDTO` |
| `POST` | `/api/v1/auth/verify-phone` | Xác thực SĐT | Public | `{ token, code }` | `VerificationResponseDTO` |
| `POST` | `/api/v1/auth/resend-verification` | Gửi lại mã xác thực | Public | `{ email }` | `{ success: true }` |

**VerificationResponseDTO:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "status": "active",
    "message": "Xác thực thành công. Tài khoản của bạn đã được kích hoạt."
  }
}
```

**Behavior:**
- `POST /verify-email`: Accepts `token` (UUID string from email link). Finds `VerificationToken` where `verificationType='email'`, `token=value`, `expires_at > now`. On match: sets `verifiedAt = now`, updates `UserAccount.status = 'active'`, deletes used token.
- `POST /verify-phone`: Accepts `token` + `code` (numeric SMS code). Validates code against cached OTP. On success: same flow as email verification.
- `POST /resend-verification`: Validates `email`, finds pending `VerificationToken`, generates new token+code, sends new notification. Rate limit: 1 resend/5 minutes per email.

### 3.3 Registration Config (Password Policy Disclosure)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/auth/register-config` | Trả về cấu hình đăng ký (password policy, validation rules) | Public |

**Response:**
```json
{
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
  "usernameRules": {
    "minLength": 3,
    "maxLength": 100,
    "pattern": "^[a-z0-9_]+$"
  },
  "rateLimit": {
    "maxAttempts": 3,
    "windowMinutes": 15
  }
}
```

> This endpoint delivers F-276 password policy to the client so the frontend can show a password strength meter inline.

### 3.4 Security Headers & Rate Limiting

| Header / Mechanism | Value |
|---|---|
| `Rate-Limit` | `3` requests per 15-minute sliding window per IP on `POST /register` |
| `X-RateLimit-Remaining` | Remaining attempts in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (register page) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |

## 4. Service Layer Design

### 4.1 Component Architecture

```
ReactJS (Registration Page)
    │
    ├── POST /api/v1/auth/register-config     → RegisterConfigController
    │                                              └── RegisterConfigService
    │
    ├── POST /api/v1/auth/register            → AuthController
    │                                              ├── RegistrationService
    │                                              │   ├── UserService (create UserAccount)
    │                                              │   ├── VerificationTokenService (generate token)
    │                                              │   ├── PasswordEncoder (BCrypt)
    │                                              │   ├── PasswordPolicyValidator (F-276 integration)
    │                                              │   └── AccountRegistrationAuditService
    │                                              ├── RateLimiterService (IP-based)
    │                                              └── NotificationService (email/SMS)
    │
    └── POST /api/v1/auth/verify-email        → VerificationController
                                             └── VerificationTokenService (validate + activate)
```

### 4.2 Service Interface Definitions

#### RegistrationService

```java
@Service
@Transactional
public class RegistrationService {

    private final UserRepository userRepository;
    private final VerificationTokenService verificationTokenService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PasswordEncoder passwordEncoder;
    private final AccountRegistrationAuditService auditService;
    private final NotificationService notificationService;
    private final LockoutPolicyRepository lockoutPolicyRepo; // F-277

    /**
     * Main registration flow:
     * 1. Validate rate limit (IP-based, 3 attempts / 15 min)
     * 2. Validate uniqueness (email, username, phone)
     * 3. Validate password against F-276 policy
     * 4. Encrypt password (client-side already encrypted; server decrypts)
     * 5. Create UserAccount (status = 'pending_verification')
     * 6. Generate VerificationToken (email or phone)
     * 7. Send verification notification
     * 8. Log audit record
     * 9. Return RegistrationResponse
     */
    public RegistrationResponse register(RegisterAccountDTO dto) {
        // Step 1: Rate limit check
        rateLimiterService.checkRegisterLimit(dto.ipAddress);

        // Step 2: Uniqueness validation
        validateUniqueness(dto);

        // Step 3: Password policy validation (F-276 integration)
        passwordPolicyValidator.validate(dto.password());

        // Step 4: Decrypt client-side encrypted password
        String decryptedPassword = clientEncryptionService.decrypt(dto.password());

        // Step 5: Create user account
        UserAccount user = new UserAccount();
        user.setUsername(dto.username());
        user.setEmail(dto.email());
        user.setPhone(dto.phone());
        user.setFullName(dto.fullName());
        user.setPasswordHash(passwordEncoder.encode(decryptedPassword));
        user.setPasswordLastChangedAt(LocalDateTime.now());
        user.setPasswordExpiresAt(LocalDateTime.now().plusDays(90)); // default F-276
        user.setStatus("pending_verification");
        user.setLoginFailCount(0);
        user.setLockedUntil(null);

        user = userRepository.save(user);

        // Step 6: Generate verification token
        String verificationType = (dto.email() != null) ? "email" : "phone";
        VerificationToken token = verificationTokenService.createToken(user, verificationType);

        // Step 7: Send notification
        if ("email".equals(verificationType)) {
            notificationService.sendVerificationEmail(user.getEmail(), token.getToken());
        } else {
            notificationService.sendVerificationSms(user.getPhone(), token.getToken());
        }

        // Step 8: Audit log
        auditService.logRegistration(user, "success", null, dto.ipAddress(), dto.userAgent());

        // Step 9: Response
        return new RegistrationResponse(
            user.getId(), user.getUsername(),
            dto.email(), dto.phone(),
            false, "pending_verification", verificationType
        );
    }

    private void validateUniqueness(RegisterAccountDTO dto) {
        if (dto.email() != null && userRepository.existsByEmail(dto.email())) {
            throw new DuplicateResourceException("DUPLICATE_EMAIL", "Email đã được sử dụng");
        }
        if (userRepository.existsByUsername(dto.username())) {
            throw new DuplicateResourceException("DUPLICATE_USERNAME", "Username đã tồn tại");
        }
        if (dto.phone() != null && userRepository.existsByPhone(dto.phone())) {
            throw new DuplicateResourceException("DUPLICATE_PHONE", "Số điện thoại đã được sử dụng");
        }
    }
}
```

#### PasswordPolicyValidator (F-276 Integration)

```java
@Service
public class PasswordPolicyValidator {

    private final PasswordPolicyRepository policyRepo;
    private static final PasswordPolicy DEFAULT_POLICY = new PasswordPolicy(
        12, true, true, true, true, "!@#$%^&*()-_=+",
        90, 5, true
    );

    /**
     * Validate password against F-276 password policy.
     * Reads from database (singleton PasswordPolicy row), falls back to defaults.
     */
    public void validate(String password) {
        PasswordPolicy policy = policyRepo.findFirstOrderByCreatedAtDesc()
            .orElse(DEFAULT_POLICY);

        List<String> violations = new ArrayList<>();

        // BR-276-01: Minimum length
        if (password.length() < policy.getMaxLength()) {
            violations.add("Mật khẩu quá ngắn (tối thiểu " + policy.getMinLength() + " ký tự)");
        }

        // BR-276-02: Character class requirements
        if (policy.isRequireUppercase() && password.chars().noneMatch(Character::isUpperCase)) {
            violations.add("Mật khẩu cần ít nhất 1 ký tự chữ hoa (A-Z)");
        }
        if (policy.isRequireLowercase() && password.chars().noneMatch(Character::isLowerCase)) {
            violations.add("Mật khẩu cần ít nhất 1 ký tự chữ thường (a-z)");
        }
        if (policy.isRequireDigit() && password.chars().noneMatch(Character::isDigit)) {
            violations.add("Mật khẩu cần ít nhất 1 ký tự số (0-9)");
        }
        if (policy.isRequireSpecialChar()) {
            String charset = policy.getSpecialCharSet();
            if (password.chars().noneMatch(c -> charset.indexOf(c) >= 0)) {
                violations.add("Mật khẩu cần ít nhất 1 ký tự đặc biệt (" + charset + ")");
            }
        }

        // BR-276-03: No username/email in password
        if (policy.isBlockUsernameInPassword() && password.length() >= 4) {
            // This is validated at controller layer with username context
            // (not here — requires DTO context)
        }

        if (!violations.isEmpty()) {
            throw new ValidationException("PASSWORD_POLICY_VIOLATION", violations);
        }
    }
}
```

#### VerificationTokenService

```java
@Service
public class VerificationTokenService {

    private final VerificationTokenRepository tokenRepo;
    private static final int TOKEN_TTL_MINUTES = 30;
    private static final int TOKEN_LENGTH = 64;

    /** Generate a new verification token for a user */
    @Transactional
    public VerificationToken createToken(UserAccount user, String type) {
        // Invalidate any existing pending tokens for this user
        tokenRepo.findByUserIdAndVerifiedIsNull(user.getId()).forEach(t -> t.setVerifiedAt(LocalDateTime.now()));

        String rawToken = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        String hashedToken = DigestUtils.sha256Hex(rawToken); // Store hash, send raw token

        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setToken(hashedToken);
        token.setVerificationType(type);
        tokenRepo.save(token);

        return new VerificationToken(token, rawToken); // rawToken included in notification
    }

    /** Validate and consume a verification token */
    @Transactional
    public boolean verifyToken(String rawToken, String expectedType) {
        String hashedToken = DigestUtils.sha256Hex(rawToken);

        Optional<VerificationToken> opt = tokenRepo.findByTokenAndVerificationType(hashedToken, expectedType);
        if (opt.isEmpty()) return false;

        VerificationToken token = opt.get();

        // Check expiration
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) return false;

        // Mark as verified
        token.setVerifiedAt(LocalDateTime.now());
        tokenRepo.save(token);

        // Activate user account
        token.getUser().setStatus("active");
        token.getUser().setPasswordLastChangedAt(LocalDateTime.now());
        tokenRepo.save(token.getUser());

        return true;
    }
}
```

### 4.3 Service Method Summary

| Service | Key Methods | Transactional? | Dependencies |
|---|---|---|---|
| `RegistrationService` | `register(dto)`, `validateUniqueness(dto)` | Yes (REQUIRED) | UserService, PasswordPolicyValidator, VerificationTokenService, NotificationService, AuditService |
| `VerificationTokenService` | `createToken(user, type)`, `verifyToken(rawToken, type)` | Yes (REQUIRED) | VerificationTokenRepository |
| `PasswordPolicyValidator` | `validate(password)` | No (stateless) | PasswordPolicyRepository (F-276) |
| `AccountRegistrationAuditService` | `logRegistration(user, result, reason, ip, ua)` | Yes (REQUIRES_NEW) | AccountRegistrationAuditRepository |
| `RateLimiterService` | `checkRegisterLimit(ipAddress)` | No (stateless) | Redis / local cache |
| `NotificationService` | `sendVerificationEmail(email, token)`, `sendVerificationSms(phone, token)` | No | SMTP / SMS gateway |
| `ClientEncryptionService` | `decrypt(encryptedPassword)` | No | RSA private key (server-side) |

## 5. Security Considerations

### 5.1 Password Security

| Concern | Mitigation | Standard |
|---|---|---|
| **Plaintext storage** | BCrypt with work factor ≥ 12 (adaptive hash). Salt embedded in hash string. Never store plaintext. | OWASP Password Storage Cheat Sheet |
| **Client-side encryption** | Password encrypted with server's RSA public key (from `/register-config`) before transmission. Server decrypts with private key. | Defense in depth (layered encryption) |
| **Password policy enforcement** | Password validated against F-276 `PasswordPolicy` at registration time. Complexity: min 12 chars, uppercase, lowercase, digit, special char. | BR-276-01 to BR-276-03 |
| **Timing attacks** | BCrypt's `PasswordEncoder.matches()` uses constant-time comparison internally. | OWASP Authentication Cheat Sheet |
| **Password reuse** | At registration time, no history exists yet — F-276 history check applies only at *change-password* time. | BR-276-04 |
| **Leakage prevention** | Password never appears in logs, error messages, DB queries (parameterized only), or API responses. | Internal security policy |

### 5.2 Registration Security

| Concern | Mitigation |
|---|---|
| **Brute-force registration** | Rate limit: max 3 registration attempts per IP per 15-minute sliding window. Enforced at `RegistrationService` layer + NGINX reverse-proxy layer. |
| **Account enumeration** | Error messages are generic: "Email đã được sử dụng" (never "Email exists but username is available"). Same generic message for all uniqueness violations. |
| **Credential stuffing** | Rate limiting + CAPTCHA (enabled after 2 failed attempts per IP, per F-277 design principles). |
| **Email/phone spoofing** | Verification token required — account stays `pending_verification` until token is consumed. |
| **Token theft** | Verification token hashed (SHA-256) before DB storage. Raw token sent via email/SMS only. Token invalidated after use. |
| **Token brute-force** | 64-character random UUID-based tokens. Effective entropy > 300 bits. |
| **SQL Injection** | All queries via Spring Data JPA (parameterized). No raw SQL in repository methods. |
| **XSS** | Registration page CSP headers. Input sanitization on username (alphanumeric + underscore only). |
| **CSRF** | JWT Bearer token authentication for authenticated endpoints. SameSite=Strict on cookies. |

### 5.3 Data Protection

| Aspect | Implementation |
|---|---|
| **PII in DB** | Email, phone, username stored as-is (encrypted at rest via MSSQL TDE recommended). |
| **Audit logs** | IP address, user-agent stored for registration attempts. Retained 180 days minimum. |
| **Password hash column** | `password_hash` field has default value `''` — prevents null exposure in backups. |
| **Soft delete** | `deleted_at` column on `UserAccount`. Deleted users' verification tokens cascade-deleted (FK constraint). |

### 5.4 Threat Model Summary

```
ATTACK VECTOR                    MITIGATION
─────────────────                ──────────────────────────────────────
Brute-force register             Rate limit: 3 attempts / 15 min / IP
Credential stuffing              Rate limit + CAPTCHA (after 2 fails)
Account enumeration              Generic error messages
Password interception            RSA client-side encryption
Password brute-force (post-      F-277 lockout (5 fails → 30-min lock)
  registration)
Email verification bypass        Token-based, 30-min TTL, single-use
Token replay                     Token hashed in DB, auto-deleted after use
SQL injection                    JPA parameterized queries only
XSS on registration form         CSP headers, input validation (regex)
CSRF on registration             JWT Bearer, SameSite cookies
```

## 6. Integration Map

### 6.1 Feature Dependencies

```
F-271 (Đăng ký tài khoản) depends on:
  │
  ├── F-276 (Chính sách mật khẩu)
  │     ├── Validate password complexity at registration time
  │     ├── Apply PasswordPolicy from database (singleton)
  │     ├── Set passwordExpiresAt = now + 90 days at creation
  │     └── Set passwordLastChangedAt = now at creation
  │
  ├── F-277 (Chính sách giới hạn đăng nhập sai)
  │     ├── Initialize loginFailCount = 0 at creation
  │     ├── Initialize lockedUntil = null at creation
  │     └── Lockout does NOT apply during registration (only at login)
  │
  ├── F-001 (M-001: Quản lý tài khoản người dùng)
  │     ├── UserAccount entity baseline (id, username, email, role, status)
  │     ├── Role assignment (default: 'user' role at creation)
  │     └── Unit/organization assignment (if applicable)
  │
  ├── F-002 (M-001: Quản lý nhóm người dùng)
  │     └── UserAccount → UserRole → GroupMember (default membership)
  │
  ├── F-272 (Đăng nhập lần đầu + TOTP setup)
  │     └── F-271 creates account → F-272 handles first login + TOTP enrollment
  │
  ├── F-274 (Quản lý JWT session)
  │     └── F-271 registration does NOT create JWT (JWT created at F-272 login)
  │
  └── F-275 (Phân quyền 3 mức)
        └── F-271 assigns default 'user' role (Level 1); admin upgrade via F-275
```

### 6.2 Integration Points Detail

#### F-271 → F-276 (Password Policy)

```
RegistrationService.register()
    │
    └── PasswordPolicyValidator.validate(password)
              │
              ├── Reads PasswordPolicy from DB (singleton row)
              ├── Checks: minLength, requireUppercase, requireLowercase,
              │       requireDigit, requireSpecialChar, blockUsernameInPassword
              └── Returns ValidationException with specific violation messages

RegistrationService.register()
    │
    └── Sets on UserAccount:
              ├── passwordHash = BCrypt.encode(password)
              ├── passwordExpiresAt = now + policy.maxAgeDays
              └── passwordLastChangedAt = now
```

#### F-271 → F-277 (Lockout Policy)

```
RegistrationService.register()
    │
    └── Sets on UserAccount:
              ├── loginFailCount = 0 (initialized fresh)
              └── lockedUntil = null (no lockout at creation)

Note: F-277 lockout policy (maxFailedAttempts=5, lockoutDuration=30min, window=15min)
      is read at F-272/F-273 login time, NOT at registration time.
      Registration itself is not subject to lockout — only login attempts.
```

#### F-271 → F-272 (First Login + TOTP)

```
F-271 creates UserAccount(status='pending_verification')
    │
    └── After email/phone verification:
              └── UserAccount.status → 'active'
                    │
                    └── F-272 login flow:
                          ├── Authenticates with username + password
                          ├── Checks password expiration (F-276)
                          ├── Checks lockout status (F-277)
                          ├── Generates temp JWT
                          └── Redirects to TOTP setup page
```

#### F-271 → F-001 (User Account Baseline)

```
F-271 reuses M-001's UserAccount entity (defined in F-001 SA).
New fields added by F-271:
  - phone (nullable, unique)
  - password_hash
  - password_expires_at
  - password_last_changed_at
  - login_fail_count
  - locked_until

Default role assignment at registration:
  - Role code: 'user' (Level 1 — standard user)
  - Organization: null (user may assign later or auto-assign based on invitation)
```

### 6.3 Cross-Module Communication Pattern

```
┌─────────────┐    REST API     ┌─────────────────┐    REST API     ┌─────────────┐
│  ReactJS    │ ◄────────────► │  Auth Service     │ ◄────────────► │  M-001       │
│  (UI)       │                │  (F-271 controller)│                │  (User Mgmt) │
└─────────────┘                └─────────────────┘                └─────────────┘
                                       │                                    │
                                       │ ApplicationEvent                   │
                                       ▼                                    ▼
                              ┌─────────────────┐                ┌─────────────────┐
                              │  Notification     │                │  Role/Group     │
                              │  Service          │                │  Service (F-002)│
                              └─────────────────┘                └─────────────────┘
                                       │                                    │
                                       ▼                                    ▼
                              ┌─────────────────┐                ┌─────────────────┐
                              │  SMTP / SMS     │                │  Default user   │
                              │  Gateway        │                │  role assigned  │
                              └─────────────────┘                └─────────────────┘
```

## 7. Frontend Integration Notes

### 7.1 Registration Page Flow

```
User opens /register
    │
    ├── GET /api/v1/auth/register-config
    │       └── Renders password strength meter (from passwordPolicy)
    │       └── Renders username validation rules
    │       └── Renders rate limit info
    │
    ├── User fills form:
    │       ├── Email or Phone (mutually exclusive)
    │       ├── Username (client-side regex validation: ^[a-z0-9_]{3,100}$)
    │       ├── Password (client-side encryption via WebCrypto API with server public key)
    │       └── Full name (optional)
    │
    ├── Submit POST /api/v1/auth/register
    │       ├── Client encrypts password with RSA public key
    │       ├── Sends encrypted password in request body
    │       └── Server decrypts, validates, creates account
    │
    ├── 201 Created → Show "Check your email for verification code"
    │
    └── Redirect to /verify-email (or /verify-phone)
            └── User enters verification code received via email/SMS
```

### 7.2 Client-Side Password Encryption

```typescript
// Pseudocode: Client-side password encryption
// Uses RSA-OAEP with SHA-256, key fetched from /register-config

async function encryptPassword(password: string): Promise<string> {
  const config = await fetch('/api/v1/auth/register-config');
  const publicKeyPem = config.publicKey; // RSA 2048 public key PEM

  const publicKey = await crypto.subtle.importKey(
    'pem', publicKeyPem, { name: 'RSA-OAEP', hash: 'SHA-256' },
    false, ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    new TextEncoder().encode(password)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

## 8. Database Indexes & Performance

| Table | Index | Type | Columns | Purpose |
|---|---|---|---|---|
| `verification_tokens` | PK | Clustered | `id` | Primary lookup |
| `verification_tokens` | UQ | Unique NonClustered | `token` | Token validation |
| `verification_tokens` | — | NonClustered | `user_id` | User token lookup |
| `verification_tokens` | — | NonClustered (filtered) | `expires_at` WHERE `verified_at IS NULL` | Expired token cleanup |
| `account_registration_audits` | PK | Clustered | `id` | Primary lookup |
| `account_registration_audits` | — | NonClustered | `user_email` | Audit search by email |
| `account_registration_audits` | — | NonClustered | `created_at` | Time-range audit queries |
| `account_registration_audits` | — | NonClustered | `ip_address` | IP-based audit |
| `user_accounts` | PK | Clustered | `id` | Primary lookup |
| `user_accounts` | UQ | Unique NonClustered | `email` | Registration uniqueness |
| `user_accounts` | UQ | Unique NonClustered | `username` | Registration uniqueness |
| `user_accounts` | UQ | Unique NonClustered | `phone` (filtered) | Registration uniqueness |
| `user_accounts` | — | NonClustered | `status` | Filtered queries |
| `user_accounts` | — | NonClustered | `role_id` | Role-based queries |
| `user_accounts` | — | NonClustered | `login_fail_count` | Lockout queries (F-277) |

**Performance targets:**
- Registration API response time: **< 500ms** (p95), dominated by BCrypt hash (~200ms)
- Verification token creation: **< 100ms**
- Verification token validation: **< 50ms**
- Unique constraint check: **< 5ms** (indexed lookups)

## 9. Error Codes Reference

| Code | HTTP | Description |
|---|---|---|
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `DUPLICATE_USERNAME` | 409 | Username already taken |
| `DUPLICATE_PHONE` | 409 | Phone number already registered |
| `VALIDATION_ERROR` | 400 | Request body validation failed (field-level errors) |
| `PASSWORD_POLICY_VIOLATION` | 400 | Password does not meet F-276 complexity requirements |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many registration attempts from this IP |
| `TOKEN_EXPIRED` | 400 | Verification token has expired (> 30 minutes) |
| `TOKEN_INVALID` | 400 | Verification token not found or already consumed |
| `ACCOUNT_ALREADY_ACTIVE` | 400 | Account is already verified and active |
| `SYSTEM_ERROR` | 500 | Unexpected server error |
| `EMAIL_SEND_FAILED` | 500 | Notification service unavailable |
| `SMS_SEND_FAILED` | 500 | SMS gateway unavailable |

## 10. Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + MSSQL dialect |
| `spring-boot-starter-security` | Spring Security filter chain |
| `jjwt` (io.jsonwebtoken) | JWT token management (for F-272 login flow) |
| `spring-boot-starter-validation` | Bean validation (@Valid, @NotBlank) |
| `commons-codec` (Apache) | SHA-256 hash for verification token storage |
| `spring-boot-starter-mail` | Email sending (SMTP) |
| `spring-boot-starter-cache` | Caching for PasswordPolicy (Redis/local) |
| `resilience4j-spring-boot3` | Circuit breaker on notification services |
| `bcprov-jdk18on` (Bouncy Castle) | BCrypt password hashing |

## 11. Migration Notes

### 11.1 Schema Migration Order

1. **Step 1:** Add `phone`, `password_hash`, `password_expires_at`, `password_last_changed_at`, `login_fail_count`, `locked_until` to `user_accounts` (IF NOT EXISTS guard).
2. **Step 2:** Create `verification_tokens` table with FK to `user_accounts`.
3. **Step 3:** Create `account_registration_audits` table.
4. **Step 4:** Create indexes on new tables.
5. **Step 5:** Seed `PasswordPolicy` singleton row (F-276).
6. **Step 6:** Seed `LockoutPolicy` singleton row (F-277).
7. **Step 7:** Create unique index on `user_accounts.phone` (filtered).

### 11.2 Data Migration

- No data migration needed — all new fields have defaults or nullable constraints.
- Existing `user_accounts` rows (from M-001) remain unaffected.
- `password_hash` defaults to `''` — existing accounts can be migrated at login time (on-the-fly bcrypt upgrade).
