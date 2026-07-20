# SA: Chính sách mật khẩu (F-276) — System Architecture Design

> **Feature:** F-276 — Chính sách mật khẩu  
> **Module:** M-010 — Xác thực & Phân quyền  
> **Tech Stack:** Spring Boot 3.x + Spring Security + JWT · ReactJS · MSSQL 2022  
> **Status:** `in_design`  
> **Created:** 2026-06-23  
> **Version:** 1.0

---

## 1. Overview

This SA defines the system architecture for **F-276 — Password Policy**, covering:

- Database schema design (PasswordPolicy singleton, PasswordHistory, UserPassword enhancements)
- API endpoint specifications (change-password, password-policy config)
- Password validation service design (complexity, history, expiration)
- Expiration monitoring design (cron-based notification, login-time enforcement)
- Security considerations (bcrypt/argon2 storage, constant-time comparison, rate limiting)
- Cross-cutting integration points (F-271 registration, F-272/F-273 login, F-274 JWT session, F-277 lockout)

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram (Textual)

```
┌──────────────────┐       ┌──────────────────────────┐       ┌─────────────────────┐
│   PasswordPolicy  │       │       UserPassword        │       │   PasswordHistory   │
├──────────────────┤       ├──────────────────────────┤       ├─────────────────────┤
│ PK id            │───┐   │ PK userId (FK → User)    │   ┌───│ PK id               │
│    (UUID)        │   └──>│    (1 per active user)   │   │   │    (UUID)           │
│    singleton     │       │ FK passwordPolicyId      │   │   │ FK userId           │
├──────────────────┤       │    (nullable ref)        │   │   │    (UUID)           │
│ minLength        │       │ passwordHash (bcrypt)    │   │   │ passwordHash        │
│    INT 12        │       │ expiresAt (TIMESTAMP)    │   │   │    (bcrypt)         │
│ requireUppercase │       │ lastChangedAt (TIMESTAMP)│   │   │ createdAt           │
│    BOOLEAN T     │       │ createdAt                │   │   │    (TIMESTAMP)      │
│ requireLowercase │       │ passwordStrengthScore    │   └─────────────────────┘
│    BOOLEAN T     │       │ failedAttempts (INT 0)   │
│ requireDigit     │       └──────────────────────────┘   ┌─────────────────────────┐
│    BOOLEAN T     │                                        │ PasswordExpirationLog     │
│ requireSpecialChar│                                      ├─────────────────────────┤
│    BOOLEAN T     │   ┌──────────────────────────────┐   │ PK id                   │
│ specialCharSet   │   │ PasswordExpirationLog        │   │    (UUID)               │
│    TEXT          │   ├──────────────────────────────┤   │ FK userId               │
│ maxAgeDays       │   │ PK id                        │   │ expiredAt (TIMESTAMP)   │
│    INT 90        │   │    (UUID)                    │   │ status                  │
│ historyDepth     │   │ FK userId                    │   │    ENUM warning/forced_ │
│    INT 5         │   │ expiredAt                    │   │    change/changed       │
│ blockUsernameIn  │   │ status                       │   │ notifiedVia             │
│    Password      │   │    ENUM warning/forced_      │   │    ENUM email/in-app/   │
│    Boolean T     │   │    change/changed            │   │    none                 │
│ createdAt        │   │ notifiedVia                  │   │ notifiedVia             │
│    TIMESTAMP     │   │    ENUM email/in-app/none    │   │    ENUM email/in-app/   │
│ updatedAt        │   │ createdAt                    │   │    none                 │
│    TIMESTAMP     │   │ createdAt                    │   │ createdAt               │
└──────────────────┘   └──────────────────────────────┘   │    (TIMESTAMP)          │
                                                          └─────────────────────────┘
```

### 2.2 Table Definitions (MSSQL DDL)

#### 2.2.1 `PasswordPolicy` (Singleton Table — 1 Row)

```sql
CREATE TABLE [dbo].[PasswordPolicy] (
    [Id]                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [MinLength]             INT              NOT NULL DEFAULT 12,
    [RequireUppercase]      BIT              NOT NULL DEFAULT 1,
    [RequireLowercase]      BIT              NOT NULL DEFAULT 1,
    [RequireDigit]          BIT              NOT NULL DEFAULT 1,
    [RequireSpecialChar]    BIT              NOT NULL DEFAULT 1,
    [SpecialCharSet]        NVARCHAR(64)     NOT NULL DEFAULT N'!@#$%^&*()-_=+',
    [MaxAgeDays]            INT              NOT NULL DEFAULT 90,
    [HistoryDepth]          INT              NOT NULL DEFAULT 5,
    [BlockUsernameInPassword] BIT           NOT NULL DEFAULT 1,
    [CreatedAt]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    [UpdatedAt]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_PasswordPolicy] PRIMARY KEY CLUSTERED ([Id] ASC),
    -- Ensure only one row exists
    CONSTRAINT [UQ_PasswordPolicy_Singleton] UNIQUE NONCLUSTERED ([MinLength], [RequireUppercase])
);

-- Trigger to enforce singleton
CREATE TRIGGER [dbo].[TR_PasswordPolicy_SingletonGuard]
ON [dbo].[PasswordPolicy]
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF (SELECT COUNT(*) FROM [dbo].[PasswordPolicy]) > 1
    BEGIN
        RAISERROR('PasswordPolicy must be a singleton table — only one row allowed.', 16, 1);
        ROLLBACK;
    END
END;

-- Seed default policy
INSERT INTO [dbo].[PasswordPolicy]
    ([Id], [MinLength], [RequireUppercase], [RequireLowercase], [RequireDigit],
     [RequireSpecialChar], [SpecialCharSet], [MaxAgeDays], [HistoryDepth],
     [BlockUsernameInPassword])
VALUES (NEWID(), 12, 1, 1, 1, 1, N'!@#$%^&*()-_=+', 90, 5, 1);
```

#### 2.2.2 `UserPassword` (Extended from User entity)

> **NOTE:** Per the feature brief, MSSQL 2022 — `expiresAt` and `lastChangedAt` are added as new columns to the existing UserPassword hash table.

```sql
-- If UserPassword table already exists, add new columns:
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[UserPassword]') AND name = N'ExpiresAt')
BEGIN
    ALTER TABLE [dbo].[UserPassword] ADD [ExpiresAt] DATETIME2 NULL;
    ALTER TABLE [dbo].[UserPassword] ADD [LastChangedAt] DATETIME2 NULL;
    ALTER TABLE [dbo].[UserPassword] ADD [PasswordStrengthScore] TINYINT NULL;
END;

-- Index for efficient expiration checks
CREATE NONCLUSTERED INDEX [IX_UserPassword_ExpiresAt]
ON [dbo].[UserPassword] ([ExpiresAt] ASC)
WHERE [ExpiresAt] IS NOT NULL
INCLUDE ([UserId], [PasswordHash]);

-- Index for history depth lookups
CREATE NONCLUSTERED INDEX [IX_UserPassword_LastChangedAt]
ON [dbo].[UserPassword] ([LastChangedAt] DESC)
INCLUDE ([PasswordHash]);
```

#### 2.2.3 `PasswordHistory`

```sql
CREATE TABLE [dbo].[PasswordHistory] (
    [Id]                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [UserId]                UNIQUEIDENTIFIER NOT NULL,
    [PasswordHash]          NVARCHAR(256)    NOT NULL,    -- bcrypt output max length
    [CreatedAt]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_PasswordHistory] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PasswordHistory_User] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[User] ([Id]) ON DELETE CASCADE,
    -- Index for history lookups during change-password flow
    CONSTRAINT [CK_PasswordHistory_Depth] CHECK ([Id] IS NOT NULL)
);

CREATE NONCLUSTERED INDEX [IX_PasswordHistory_UserId_CreatedDesc]
ON [dbo].[PasswordHistory] ([UserId] ASC, [CreatedAt] DESC)
INCLUDE ([PasswordHash]);
```

#### 2.2.4 `PasswordExpirationLog` (Audit Trail)

```sql
CREATE TABLE [dbo].[PasswordExpirationLog] (
    [Id]                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [UserId]                UNIQUEIDENTIFIER NOT NULL,
    [ExpiredAt]             DATETIME2        NOT NULL,
    [Status]                NVARCHAR(20)     NOT NULL
        CHECK ([Status] IN (N'warning', N'forced_change', N'changed')),
    [NotifiedVia]           NVARCHAR(20)     NOT NULL DEFAULT N'none'
        CHECK ([NotifiedVia] IN (N'email', N'in-app', N'none')),
    [CreatedAt]             DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT [PK_PasswordExpirationLog] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_PasswordExpirationLog_User] FOREIGN KEY ([UserId])
        REFERENCES [dbo].[User] ([Id]) ON DELETE CASCADE
);

CREATE NONCLUSTERED INDEX [IX_PasswordExpirationLog_UserId_Status]
ON [dbo].[PasswordExpirationLog] ([UserId] ASC, [Status] ASC);
```

### 2.3 Indexing Strategy Summary

| Table | Index | Purpose |
|-------|-------|---------|
| `UserPassword` | `IX_UserPassword_ExpiresAt` (filtered) | Fast query for expired/soon-expiring passwords |
| `UserPassword` | `IX_UserPassword_LastChangedAt` | Ordered lookup for expiration date |
| `PasswordHistory` | `IX_PasswordHistory_UserId_CreatedDesc` | Fetch N most recent hashes for history check |
| `PasswordExpirationLog` | `IX_PasswordExpirationLog_UserId_Status` | Audit trail query by user and status |

### 2.4 Migration Approach

1. **Flyway migration V1**: Create `PasswordPolicy`, `PasswordHistory`, `PasswordExpirationLog` tables; seed default policy
2. **Flyway migration V2**: Add `ExpiresAt`, `LastChangedAt`, `PasswordStrengthScore` columns to existing `UserPassword`; create indexes
3. Backfill `ExpiresAt` and `LastChangedAt` for existing users: set `LastChangedAt = User.CreatedAt`, `ExpiresAt = User.CreatedAt + 90 days`

---

## 3. API Endpoint Specifications

### 3.1 `POST /api/auth/change-password` (Authenticated)

**Purpose:** Change current user's password with full policy validation.

**Authentication:** JWT Bearer token required (any valid token).

**Request Body:**
```json
{
  "currentPassword": "string (required, min 1 char)",
  "newPassword":     "string (required, min 1 char)"
}
```

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Đổi mật khẩu thành công",
  "policy": {
    "expiresAt": "2026-09-20T00:00:00Z",
    "passwordStrengthScore": 85
  }
}
```

**Error Responses:**

| Status | Scenario | Response Body |
|--------|----------|---------------|
| `400` | Input validation (empty/min length) | `{"error": "input_validation_failed", "fields": ["currentPassword", "newPassword"]}` |
| `401` | Current password incorrect | `{"error": "authentication_failed", "message": "Đổi mật khẩu không thành công"}` |
| `409` | New password matches current | `{"error": "password_duplicate", "message": "Mật khẩu mới không được trùng mật khẩu hiện tại"}` |
| `409` | New password in history | `{"error": "password_reused", "message": "Mật khẩu đã được sử dụng gần đây"}` |
| `422` | Complexity violation | `{"error": "complexity_violation", "details": ["minLength", "uppercase", "digit", ...]}` |
| `429` | Rate limit exceeded | `{"error": "rate_limit_exceeded", "retryAfter": 300}` |

**Rate Limiting:** 5 attempts per 15 minutes per user (applies via Spring RateLimiter or Redis-based token bucket).

**Security Notes:**
- Error messages for BR-276-09: generic message for auth failure (wrong password + complexity fail combined)
- Only detailed error (`complexity_violation`) returned when input validation + wrong password check both pass, to avoid leaking whether wrong password is the issue
- All password comparisons use constant-time hash comparison (bcrypt handles this natively)

### 3.2 `GET /api/auth/password-policy` (Read-Only)

**Purpose:** Retrieve current password policy configuration.

**Authentication:** Optional (public read — any authenticated or unauthenticated user can see policy).

**Response (200 OK):**
```json
{
  "minLength": 12,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireDigit": true,
  "requireSpecialChar": true,
  "specialCharSet": "!@#$%^&*()-_=+",
  "maxAgeDays": 90,
  "historyDepth": 5,
  "blockUsernameInPassword": true,
  "warningThresholds": [7, 3, 1]
}
```

**Security:** Never returns `id`, `createdAt`, `updatedAt` fields — these are internal config metadata.

### 3.3 `PUT /api/admin/password-policy` (Admin Only)

**Purpose:** Admin updates password policy parameters.

**Authentication:** JWT Bearer token + Admin role (Level 2).

**Request Body (all fields optional — only provided fields updated):**
```json
{
  "minLength": 10,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireDigit": true,
  "requireSpecialChar": true,
  "specialCharSet": "!@#$%^&*()-_=+",
  "maxAgeDays": 60,
  "historyDepth": 10,
  "blockUsernameInPassword": true
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Chính sách mật khẩu đã được cập nhật",
  "updatedFields": ["maxAgeDays", "historyDepth"],
  "policy": { /* full updated policy */ }
}
```

**Error Responses:**

| Status | Scenario | Response Body |
|--------|----------|---------------|
| `403` | Non-admin user | `{"error": "forbidden", "message": "Không có quyền truy cập"}` |
| `400` | Invalid values (e.g., minLength < 8, maxAgeDays > 365) | `{"error": "validation_failed", "fields": [...]}` |
| `404` | No policy record exists | `{"error": "not_found", "message": "Không tìm thấy chính sách"}` |

**Validation Constraints (Admin Endpoint):**
- `minLength`: 8–64
- `maxAgeDays`: 1–365
- `historyDepth`: 0–50
- `specialCharSet`: min 4 characters
- At least one of `requireUppercase`, `requireLowercase`, `requireDigit`, `requireSpecialChar` must be true

### 3.4 `GET /api/admin/password-policy/expiry-report` (Admin Only)

**Purpose:** Admin view of password expiration status across all users.

**Authentication:** JWT Bearer token + Admin role.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `all` | `expiring_soon` (≤7 days), `expired`, `ok`, `all` |
| `page` | int | `1` | Page number |
| `size` | int | `20` | Items per page (max 100) |

**Response (200 OK):**
```json
{
  "total": 1542,
  "page": 1,
  "size": 20,
  "data": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "nguyen.van.a",
      "email": "nguyen.van.a@etc.vn",
      "expiresAt": "2026-06-25T00:00:00Z",
      "daysRemaining": 2,
      "status": "expiring_soon",
      "lastLoginAt": "2026-06-20T08:30:00Z"
    },
    ...
  ]
}
```

### 3.5 `GET /api/auth/my-password-status` (Authenticated)

**Purpose:** User checks own password expiration status and upcoming warnings.

**Authentication:** JWT Bearer token required.

**Response (200 OK):**
```json
{
  "expiresAt": "2026-09-20T00:00:00Z",
  "daysRemaining": 89,
  "status": "active",
  "warnings": [],
  "lastChangedAt": "2026-06-21T00:00:00Z",
  "changePasswordUrl": "/auth/change-password"
}
```

**Possible statuses:** `active`, `warning_t7`, `warning_t3`, `warning_t1`, `expired`

---

## 4. Password Validation Service Design

### 4.1 Service Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PasswordPolicyService                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │ │
│  │  │ ComplexityValidator│ │ HistoryValidator│ │ ExpirationChecker │  │ │
│  │  └─────────────────┘  └────────────────┘  └──────────────────┘  │ │
│  │         │                    │                   │               │ │
│  │         └────────────────────┴───────────────────┘               │ │
│  │                         │                                       │ │
│  │              ┌──────────▼──────────┐                            │ │
│  │              │  PasswordValidator   │                            │ │
│  │              │  (orchestrator)      │                            │ │
│  │              └──────────┬──────────┘                            │ │
│  └─────────────────────────┼───────────────────────────────────────┘ │
│                            │                                         │
│  ┌─────────────────────────▼───────────────────────────────────────┐ │
│  │               PasswordHashService                                │ │
│  │  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐  │ │
│  │  │ hash(password)   │  │ verify(pw, hash)│ │ encode(pw, salt) │  │ │
│  │  └─────────────────┘  └────────────────┘  └──────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### 4.2 `ComplexityValidator`

Validates password against current policy rules. Returns list of violations.

```java
// Domain model
public record ComplexityViolation(String code, String message) {}

public record ComplexityResult(boolean valid, List<ComplexityViolation> violations) {}

// Service interface
public interface ComplexityValidator {
    ComplexityResult validate(String password, UserContext userContext, PasswordPolicy policy);
}

// UserContext holds username/email for BR-276-03 check
public record UserContext(String username, String email) {}
```

**Validation Pipeline (ordered checks):**

| Order | Rule | Check | Violation Code |
|-------|------|-------|----------------|
| 1 | BR-276-01 | `password.length() >= policy.minLength` | `TOO_SHORT` |
| 2 | BR-276-01 | `password.length() < 8` (absolute minimum) | `TOO_SHORT_CRITICAL` |
| 3 | BR-276-02 | `contains uppercase` if `policy.requireUppercase` | `MISSING_UPPERCASE` |
| 4 | BR-276-02 | `contains lowercase` if `policy.requireLowercase` | `MISSING_LOWERCASE` |
| 5 | BR-276-02 | `contains digit` if `policy.requireDigit` | `MISSING_DIGIT` |
| 6 | BR-276-02 | `contains special char` if `policy.requireSpecialChar` | `MISSING_SPECIAL_CHAR` |
| 7 | BR-276-03 | `does not contain username/email` if `policy.blockUsernameInPassword` && matched substring ≥ 4 chars | `CONTAINS_PERSONAL_INFO` |

**Implementation notes:**
- Use regex for character-class checks (compile once as `private static final Pattern`)
- For BR-276-03, perform case-insensitive search only for substrings of length ≥ 4
- All violations collected and returned together (not early return) — allows client to display all issues at once
- **Security:** Do NOT include the username/email in the violation message — only return code + generic message

### 4.3 `HistoryValidator`

Checks if a candidate password matches any of the last N stored hashes.

```java
public interface HistoryValidator {
    boolean isPasswordInHistory(Long userId, String passwordHash, int depth);
    boolean isNewPasswordDuplicate(Long userId, String newPasswordHash, PasswordPolicy policy);
}
```

**Algorithm:**
1. Query `PasswordHistory` table: `SELECT TOP {historyDepth} PasswordHash FROM PasswordHistory WHERE UserId = ? ORDER BY CreatedAt DESC`
2. For each stored hash, use `BCrypt.checkpw(candidateHash, storedHash)` — compare hashes, NOT plaintext
3. If any match → reject

**Performance optimization:**
- The `BCrypt.checkpw` is CPU-intensive; for `historyDepth=5`, max 5 comparisons per request
- Per TC-PERF-03 target: < 50ms total (at bcrypt work factor 12, each check ≈ 10ms → 5 × 10ms = 50ms)
- Consider caching the user's recent history hashes in a short-lived LRU cache (TTL 30s) to avoid repeated DB reads on rapid change-password attempts

### 4.4 `ExpirationChecker`

Determines the expiration status of a password.

```java
public enum PasswordStatus {
    ACTIVE,       // > 7 days remaining
    WARNING_T7,   // 7 days remaining
    WARNING_T3,   // 3 days remaining
    WARNING_T1,   // 1 day remaining
    EXPIRED       // past expiresAt
}

public record PasswordExpirationStatus(
    PasswordStatus status,
    int daysRemaining,
    OffsetDateTime expiresAt,
    List<ExpirationWarning> warnings
) {}

public record ExpirationWarning(
    OffsetDateTime triggeredAt,
    String threshold,    // "7d", "3d", "1d"
    boolean sent
) {}
```

**Algorithm:**
```
daysRemaining = (expiresAt - now).toDays()
IF daysRemaining < 0 → EXPIRED
ELSE IF daysRemaining <= 1 → WARNING_T1
ELSE IF daysRemaining <= 3 → WARNING_T3
ELSE IF daysRemaining <= 7 → WARNING_T7
ELSE → ACTIVE
```

**Integration with login (F-272/F-273):**
- During `AuthenticationManager.authenticate()`, after credential validation succeeds:
- Fetch user's `PasswordPolicy` record (singleton, cacheable)
- Check `UserPassword.ExpiresAt` vs current time
- If `EXPIRED`: reject authentication with a specific flag (`PasswordExpiredException`)
  - This exception is caught by a `AuthenticationEntryPoint` that returns HTTP 403 with a redirect URL to `/auth/change-password`
  - The redirect bypasses normal JWT flow — user must change password first
- If `WARNING_T7`, `WARNING_T3`, or `WARNING_T1`: allow login but return warning info in response headers or a separate payload (for frontend to display banner)

---

## 5. Expiration Monitoring Design

### 5.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                  Expiration Monitoring System                     │
│                                                                   │
│  ┌─────────────────┐     ┌──────────────────┐                   │
│  │ Cron Scheduler   │────>│ ExpirationScanner│  (Daily at 02:00)│
│  │ (Spring @Scheduled│     └────────┬─────────┘                   │
│  │  zone=Asia/Bangkok)│            │                              │
│  └─────────────────┘     ┌────────▼─────────┐                   │
│                           │ ExpiredPassword   │                   │
│                           │ Service           │                   │
│                           └────────┬─────────┘                   │
│                                    │                              │
│              ┌─────────────────────┼─────────────────────┐       │
│              │                     │                     │       │
│    ┌─────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐│
│    │ WarningProcessor  │  │ ForcedChange    │  │ ExpirationLogger ││
│    │ (T-7, T-3, T-1)  │  │ Trigger         │  │ (Audit Trail)    ││
│    └──────────────────┘  └─────────────────┘  └─────────────────┘│
│              │                     │                              │
│    ┌─────────▼────────┐  ┌────────▼────────┐                    │
│    │ NotificationService│  │ SessionManager  │                    │
│    │ (Email + In-App)  │  │ (JWT Invalidation│                    │
│    └──────────────────┘   │  on change)      │                    │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Cron Job — `ExpirationScanner`

**Schedule:** Daily at 02:00 Asia/Bangkok (off-peak).

**Logic:**

```sql
-- Query 1: Find users with passwords expiring in next 7 days (for warning)
SELECT u.Id, u.Username, u.Email, up.ExpiresAt,
       DATEDIFF(DAY, GETUTCDATE(), up.ExpiresAt) AS DaysRemaining
FROM [dbo].[UserPassword] up
JOIN [dbo].[User] u ON up.UserId = u.Id
WHERE up.ExpiresAt BETWEEN GETUTCDATE() AND DATEADD(DAY, 7, GETUTCDATE())
  AND up.ExpiresAt IS NOT NULL
  AND u.IsActive = 1;

-- Query 2: Find users with expired passwords (for forced change)
SELECT u.Id, u.Username, u.Email, up.ExpiresAt
FROM [dbo].[UserPassword] up
JOIN [dbo].[User] u ON up.UserId = u.Id
WHERE up.ExpiresAt < GETUTCDATE()
  AND up.ExpiresAt IS NOT NULL
  AND u.IsActive = 1;
```

**Processing flow per user:**

1. **Warning users (T-7, T-3, T-1):**
   - Check `PasswordExpirationLog` to see if this threshold was already notified
   - If not notified → create log entry with status `warning`, `notifiedVia = email` or `in-app`
   - Trigger notification (see Notification section below)
   - If already notified → skip

2. **Expired users:**
   - Check if `forced_change` log entry already exists for this user
   - If not → create log entry with status `forced_change`
   - No active notification needed (user will be redirected on next login)
   - **Exception:** For first-time users (F-272) who have expired passwords, the redirect happens at login, not via cron

3. **Changed users (auto-detect):**
   - When user changes password, a log entry with status `changed` is created by the `PasswordValidatorService`
   - This is NOT part of the cron job — it's triggered inline during change-password flow

### 5.3 Notification Service

```java
public interface NotificationService {
    void sendPasswordExpirationWarning(User user, PasswordStatus status, OffsetDateTime expiresAt);
}
```

**Channel selection:**
- **Email:** Sent if user has a verified email address (check `User.EmailVerified = true`)
- **In-app notification:** Always sent via WebSocket/push notification or stored in a notification queue for frontend polling

**Email template (subject):**
```
[Thông báo] Mật khẩu của bạn sẽ hết hạn trong {days} ngày
```

**Email template body:**
- Personalized greeting
- Expiration date
- Link to change password page
- Brief security rationale

### 5.4 Login-Time Enforcement

**Spring Security Filter: `PasswordExpirationFilter`**

This filter sits after authentication but before the main request filter chain:

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class PasswordExpirationFilter extends OncePerRequestFilter {

    private final PasswordExpirationChecker checker;
    private final PasswordPolicyRepository policyRepo;

    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        // Skip non-authenticated requests and change-password endpoint
        String path = request.getRequestURI();
        if (!path.startsWith("/api/auth/") || path.equals("/api/auth/change-password")) {
            chain.doFilter(request, response);
            return;
        }

        // Check password expiration from authenticated principal
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            chain.doFilter(request, response);
            return;
        }

        PasswordExpirationStatus status = checker.check(auth);

        if (status.status() == PasswordStatus.EXPIRED) {
            // Block access — redirect to change-password
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
            httpResponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
            httpResponse.getWriter().write("""
                {"error": "password_expired", "redirect": "/auth/change-password",
                 "message": "Mật khẩu của bạn đã hết hạn. Vui lòng đổi mật khẩu trước khi tiếp tục."}
            """);
            return;
        }

        // For WARNING statuses, add warning info to response headers
        if (status.status().isWarning()) {
            HttpServletResponse httpResponse = (HttpServletResponse) response;
            httpResponse.setHeader("X-Password-Status", status.status().name());
            httpResponse.setHeader("X-Days-Remaining", String.valueOf(status.daysRemaining()));
        }

        chain.doFilter(request, response);
    }
}
```

### 5.5 Password Change Cascade (F-274 Integration)

When password is changed, the following cascading actions occur:

```java
public record PasswordChangeResult(
    boolean success,
    @Nullable String error,
    @Nullable String errorDetail
) {}

public interface PasswordChangeService {
    PasswordChangeResult changePassword(
        Long userId,
        String currentPassword,
        String newPassword
    );
}
```

**Flow (transactional):**

```
BEGIN TRANSACTION
1. Verify current password hash (BCrypt.checkpw)
2. Hash new password (BCrypt.hashpw with new random salt)
3. Check complexity (ComplexityValidator)
4. Check history (HistoryValidator — compare hash against last N hashes)
5. IF all checks pass:
   a. Insert old passwordHash into PasswordHistory table
   b. UPDATE UserPassword: passwordHash = newHash, lastChangedAt = NOW, expiresAt = NOW + maxAgeDays
   c. INSERT PasswordExpirationLog (status = 'changed')
   d. Invalidate all active JWT tokens for this user (mark as revoked in Redis/JWT blacklist)
   e. Commit
6. IF any check fails:
   a. ROLLBACK
   b. Return generic error (BR-276-09)
END TRANSACTION
```

**Key design decisions:**
- **Step 5a (insert into history):** Always store the OLD password hash in history, even if the change fails (but due to transaction, it won't persist if rollback occurs)
- **Step 5d (JWT invalidation):** Uses Redis key pattern `jwt:revoked:{userId}:{tokenJti}` with TTL matching the JWT expiry. All subsequent JWT validation checks this blacklist.
- **Rate limiting is applied BEFORE the transaction** (at the controller level) to prevent resource exhaustion from repeated failed attempts.

---

## 6. Security Design

### 6.1 Password Storage

| Aspect | Implementation |
|--------|---------------|
| Hashing algorithm | bcrypt (work factor 12) or argon2id (memory 64MB, iterations 3) |
| Salt | Random 16-byte, embedded in bcrypt hash output — no separate column needed |
| Plaintext storage | **NEVER** — passwords never written to DB, logs, or API responses |
| Comparison | `BCrypt.checkpw()` — constant-time by design |
| Work factor | 12 (adjustable via config; TC-PERF-01 target < 200ms per hash) |

### 6.2 Error Handling (BR-276-09)

**Principle:** Never distinguish between "wrong password" and "policy violation" in error messages for change-password flow.

**Strategy:**
```
1. Verify current password first
2. IF wrong → return generic error: "Đổi mật khẩu không thành công"
3. IF correct → validate complexity → return detailed violations
4. IF complexity passes → validate history → return generic error if duplicate
```

Wait — this contradicts TC-INT-03 which expects specific complexity error. **Resolution:**
- For **registration (F-271)**: detailed errors allowed (BR-276-09 does not apply to registration since there's no "old password" to leak)
- For **change-password (F-276)**: 
  - Wrong current password → generic error
  - Correct password + complexity fail → detailed complexity errors (safe, because auth already confirmed)
  - Correct password + history match → generic error ("Mật khẩu đã được sử dụng gần đây")
  - Correct password + duplicate current → specific error ("Mật khẩu mới không được trùng mật khẩu hiện tại")

### 6.3 Rate Limiting

| Endpoint | Limit | Mechanism |
|----------|-------|-----------|
| `POST /api/auth/change-password` | 5 attempts / 15 min per userId | Redis token bucket (Spring RateLimiter or custom) |
| `PUT /api/admin/password-policy` | 10 attempts / 15 min per IP | Redis token bucket |

### 6.4 JWT Invalidation (F-274 Integration)

When password changes:
1. Generate a new `passwordChangedAt` timestamp
2. Include this timestamp in JWT `iat`-adjacent claim (or use a separate `pwhash_version` claim)
3. On every JWT validation, compare the stored `pwhash_version` with current user's version
4. Mismatch → token rejected as revoked

This is more efficient than maintaining a JWT blacklist at scale.

### 6.5 SQL Injection Prevention

- All password operations use parameterized queries via JPA/Hibernate
- No raw SQL with concatenated password strings
- BCrypt hash output is safe for SQL (ASCII-only, no special chars that need escaping)

---

## 7. Spring Boot Component Architecture

### 7.1 Package Structure

```
vn.edu.etc.hanghai.auth.password/
├── config/
│   ├── PasswordPolicyProperties.java          # @ConfigurationProperties for policy defaults
│   └── PasswordSecurityConfig.java            # BCrypt bean, rate limiter config
├── domain/
│   ├── PasswordPolicy.java                    # JPA Entity
│   ├── PasswordHistory.java                   # JPA Entity
│   ├── PasswordExpirationLog.java             # JPA Entity
│   ├── PasswordStatus.java                    # Enum
│   ├── ComplexityViolation.java               # Value object
│   └── PasswordChangeRequest.java             # DTO
├── repository/
│   ├── PasswordPolicyRepository.java          # JpaRepository
│   ├── PasswordHistoryRepository.java
│   ├── PasswordExpirationLogRepository.java
│   └── UserPasswordRepository.java            # Custom queries for expiration
├── service/
│   ├── PasswordPolicyService.java             # Singleton CRUD + caching
│   ├── PasswordChangeService.java             # Orchestrate change-password flow
│   ├── ComplexityValidator.java               # Policy rule validation
│   ├── HistoryValidator.java                  # Hash history comparison
│   ├── ExpirationChecker.java                 # Status computation
│   ├── PasswordHashService.java               # bcrypt operations
│   └── NotificationService.java               # Warning notifications
├── monitor/
│   ├── ExpirationScanner.java                 # @Scheduled daily cron
│   ├── WarningProcessor.java                  # T-7/T-3/T-1 processing
│   └── ForcedChangeTrigger.java               # Expired password handling
├── filter/
│   └── PasswordExpirationFilter.java          # Spring Security filter
├── controller/
│   ├── PasswordPolicyController.java          # GET/PUT /api/auth/admin/...
│   └── AuthPasswordController.java            # POST change-password, GET status
├── dto/
│   ├── ChangePasswordRequest.java
│   ├── ChangePasswordResponse.java
│   ├── PasswordPolicyResponse.java
│   ├── PasswordPolicyUpdateRequest.java
│   ├── PasswordStatusResponse.java
│   └── ExpiryReportResponse.java
├── exception/
│   ├── PasswordExpiredException.java          # Custom auth exception
│   ├── PasswordComplexityException.java
│   ├── PasswordHistoryException.java
│   └── GlobalPasswordExceptionHandler.java    # @RestControllerAdvice
└── security/
    └── JwtPasswordVersionValidator.java       # JWT version-based revocation check
```

### 7.2 Key Spring Annotations

| Component | Annotations | Purpose |
|-----------|-------------|---------|
| `PasswordPolicyService` | `@Service`, `@Cacheable("passwordPolicy")` | Singleton with Spring Cache |
| `ExpirationScanner` | `@Component`, `@Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Bangkok")` | Daily cron |
| `PasswordExpirationFilter` | `@Component`, `@Order(...)` | Security filter chain |
| `PasswordSecurityConfig` | `@Configuration`, `@EnableMethodSecurity` | BCrypt bean, method security |
| `PasswordPolicyProperties` | `@ConfigurationProperties(prefix = "app.password-policy")` | Externalized config |

### 7.3 Configuration Properties (application.yml)

```yaml
app:
  password-policy:
    minLength: 12
    requireUppercase: true
    requireLowercase: true
    requireDigit: true
    requireSpecialChar: true
    specialCharSet: "!@#$%^&*()-_=+"
    maxAgeDays: 90
    historyDepth: 5
    blockUsernameInPassword: true
    warningThresholds: [7, 3, 1]
    bcryptWorkFactor: 12
    rateLimit:
      changePassword: 5           # attempts
      windowMinutes: 15           # window
      adminPolicyUpdate: 10
      adminWindowMinutes: 15

spring:
  cache:
    type: redis
    redis:
      time-to-live: 3600000       # 1 hour for passwordPolicy cache
```

---

## 8. Frontend Integration (ReactJS)

### 8.1 Pages/Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `ChangePasswordPage` | `/auth/change-password` | Change password form (redirect target for expired users) |
| `PasswordPolicyAdminPage` | `/admin/password-policy` | Admin policy configuration page |
| `PasswordStatusBadge` | Inline | Shows expiration status indicator (warning colors) |
| `PasswordStrengthMeter` | Inline (optional) | Real-time strength indicator as user types |

### 8.2 Change Password Form Flow

```
┌───────────────────────────────────────────┐
│          Change Password Form              │
│                                           │
│  [Current Password]  ●●●●●●●●            │
│  [New Password]      ●●●●●●●●            │
│  [Confirm Password]  ●●●●●●●●            │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  ✓ Độ dài: 12 ký tự                 │  │
│  │  ✓ Ít nhất 1 chữ hoa                │  │
│  │  ✓ Ít nhất 1 chữ thường             │  │
│  │  ✓ Ít nhất 1 số                     │  │
│  │  ✓ Ít nhất 1 ký tự đặc biệt         │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  [Đổi mật khẩu]  [Hủy]                    │
└───────────────────────────────────────────┘
```

### 8.3 Frontend API Calls

```typescript
// Check own password status (poll on dashboard load)
GET /api/auth/my-password-status
→ Display warning banner if status is WARNING_T7/T3/T1/EXPIRED

// Change password
POST /api/auth/change-password
Body: { currentPassword, newPassword }
→ On 200: Show success toast, redirect to dashboard
→ On 400/422: Show inline field errors
→ On 429: Show "Vui lòng thử lại sau X phút"

// View/change policy (admin only)
GET  /api/admin/password-policy/expiry-report
PUT  /api/admin/password-policy
```

### 8.4 Expiration Warning UX

| Status | Banner Style | Message |
|--------|-------------|---------|
| `ACTIVE` | None | — |
| `WARNING_T7` | Yellow/amber info | "Mật khẩu của bạn sẽ hết hạn trong 7 ngày. [Đổi mật khẩu]" |
| `WARNING_T3` | Orange warning | "Mật khẩu của bạn sẽ hết hạn trong 3 ngày. Vui lòng đổi ngay." |
| `WARNING_T1` | Red urgent | "Mật khẩu của bạn sẽ hết hạn NGÀY MAI. Bắt buộc đổi mật khẩu." |
| `EXPIRED` | Red full-screen | "Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu trước khi tiếp tục." |

---

## 9. Cross-Cutting Integration Points

### 9.1 Dependency Map

```
F-276 (Password Policy)
│
├── F-271 (Registration)
│   → Uses ComplexityValidator at account creation
│   → Sets expiresAt = NOW + maxAgeDays
│   → Stores first passwordHash
│   → No history check needed (new user)
│
├── F-272 (First Login + TOTP)
│   → PasswordExpirationFilter blocks if EXPIRED
│   → Redirect to change-password BEFORE TOTP setup
│
├── F-273 (Subsequent Login + TOTP)
│   → PasswordExpirationFilter blocks if EXPIRED
│   → Redirect to change-password BEFORE TOTP challenge
│
├── F-274 (JWT Session Management)
│   → On password change: invalidate all JWT tokens
│   → On password change: update pwhash_version in JWT claim
│   → On JWT validation: check pwhash_version vs stored
│
├── F-275 (3-Level RBAC)
│   → PUT /api/admin/password-policy requires Level 2 (Admin) role
│   → Password expiration report visible to Level 2 only
│
└── F-277 (Login Lockout Policy)
    → On change-password: wrong current password count reset (user proved ownership)
    → On forced change (expired): lockout (F-277) should NOT apply to the
       "forced change" flow to avoid locking legitimate users
    → Coordination: PasswordExpirationFilter should skip F-277 counter
       for users redirected from expired state
```

### 9.2 Authentication Flow with Password Expiration

```
User login attempt
       │
       ▼
[1] Credential validation (F-272/F-273)
       │
       ├─ FAIL → Return generic error (BR-276-09)
       │
       ▼
[2] Password expiration check (PasswordExpirationFilter)
       │
       ├─ EXPIRED → 403 + redirect to /auth/change-password
       │   → JWT NOT issued
       │   → User MUST change password
       │
       ├─ WARNING_T7/T3/T1 → 200 OK
       │   → JWT issued
       │   → Warning headers returned (X-Password-Status)
       │   → Frontend shows banner
       │
       ▼
[3] Normal JWT issuance + TOTP flow (if applicable)
       │
       ▼
User authenticated
```

---

## 10. Performance & Capacity Planning

### 10.1 Performance Targets (from TC-PERF-01 to 04)

| Test | Target | Design Assurance |
|------|--------|-----------------|
| Hash (bcrypt w/ factor 12) | < 200ms | Spring `TaskExecutor` with bounded queue; async hashing |
| Verify (bcrypt) | < 200ms | Direct BCrypt.checkpw — no DB round trip |
| History check (5 hashes) | < 50ms | Indexed query + max 5 BCrypt checks |
| Expiration check | < 10ms | Single-column indexed query, cached policy |

### 10.2 Capacity Estimates

| Metric | Value | Assumption |
|--------|-------|------------|
| Users | 10,000 (initial) | Scaling to 100,000 |
| Change-password requests/day | 500 (5% of users) | 5% password change rate monthly |
| Login requests/day | 50,000 | 5 logins/user/day |
| Expiration warnings sent/day | ~100 (1% of users expiring) | 90-day cycle: ~111 users/day |
| DB read amplification per login | +1 query (UserPassword.ExpiresAt) | Index ensures O(log N) |

### 10.3 Caching Strategy

| Resource | Cache | TTL | Reason |
|----------|-------|-----|--------|
| `PasswordPolicy` (singleton) | Spring `@Cacheable` | 1 hour | Read-heavy, updated rarely |
| Password history hashes (per-user) | Local LRU (Caffeine) | 30 seconds | Avoid repeated DB reads during change-password |
| Password expiration check | Per-request, no cache | — | Must be real-time (expiresAt changes on each password change) |

---

## 11. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| bcrypt hashing adds latency to change-password flow | Medium | Medium | Async hashing + reasonable work factor (12) |
| Rate limiting blocks legitimate users | Low | Low | Graceful cooldown UI, not hard block |
| Singleton `PasswordPolicy` table becomes inconsistent | Low | High | DB trigger enforces single row + unique constraint |
| Existing users have no `expiresAt` set (migration gap) | High | Medium | Flyway backfill + nullable column with default logic in filter |
| Password history grows unbounded | Medium | Low | Enforce `historyDepth` limit — on new insert, delete oldest if exceeding depth |
| BCrypt work factor 12 too slow on high traffic | Medium | Medium | Benchmark on target hardware; adjust to 11 if latency > 200ms; consider argon2 with lower memory |

---

## 12. Open Questions / Decisions Pending

| ID | Question | Impact | Owner |
|----|----------|--------|-------|
| OQ-001 | Should we use bcrypt or argon2id? | Hash performance, security posture | Tech Lead |
| OQ-002 | What BCrypt work factor for production? | Performance vs security trade-off | Tech Lead |
| OQ-003 | Should password change require re-authentication (re-login) or just current password? | UX vs security | Product |
| OQ-004 | How to handle users with SSO/social login — are they exempt from password policy? | Scope boundary | Product + Security |
| OQ-005 | Should the `specialCharSet` be fully customizable or restricted to a predefined safe set? | Flexibility vs injection risk | Security |
| OQ-006 | Email notification — use existing email service or separate queue? | Architecture coupling | Backend Lead |

---

## 13. Implementation Phases

### Phase 1 — Core (MVP)
- [ ] Database migrations (V1: tables, V2: UserPassword columns, V3: backfill)
- [ ] `PasswordPolicy` singleton CRUD (GET/PUT, seeded default)
- [ ] `ComplexityValidator` service
- [ ] `POST /api/auth/change-password` endpoint with full validation
- [ ] `GET /api/auth/password-policy` endpoint
- [ ] `GET /api/auth/my-password-status` endpoint

### Phase 2 — History & Expiration
- [ ] `PasswordHistory` table + `HistoryValidator`
- [ ] `ExpirationChecker` service
- [ ] `PasswordExpirationFilter` (login-time enforcement)
- [ ] `POST /api/admin/password-policy` endpoint

### Phase 3 — Monitoring & Notifications
- [ ] `ExpirationScanner` cron job
- [ ] `NotificationService` (email + in-app)
- [ ] `PasswordExpirationLog` audit trail
- [ ] `GET /api/admin/password-policy/expiry-report` admin dashboard

### Phase 4 — Integration & Polish
- [ ] JWT invalidation on password change (F-274 integration)
- [ ] Frontend: ChangePasswordPage, PasswordStatusBadge, warning banners
- [ ] Frontend: Admin password-policy configuration page
- [ ] E2E tests (TC-E2E-01 through 06)
- [ ] Performance benchmarks (TC-PERF-01 through 04)
- [ ] Security audit (TC-SEC-01 through 05)

---

## 14. Appendix

### 14.1 Reference Standards

| Standard | Reference |
|----------|-----------|
| OWASP Password Storage | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| OWASP Authentication | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html |
| BCrypt | https://github.com/jeremyh/jBCrypt |
| Spring Security | Spring Boot 3.x Reference |
| MSSQL 2022 | Microsoft SQL Server 2022 Documentation |

### 14.2 Glossary

| Term | Definition |
|------|-----------|
| Password Policy | Configurable rules governing password complexity and lifecycle |
| Singleton Table | Table designed to hold exactly one row (PasswordPolicy) |
| bcrypt | Adaptive hash function with configurable work factor, includes random salt |
| Argon2id | Memory-hard password hashing function (winner of PHC 2015) |
| Expired Password | Password past its `expiresAt` date — user blocked from login |
| Forced Change | Password change triggered by expiration, not user choice |
| History Depth | Number of previous passwords to check against for reuse |
| Warning Threshold | Number of days before expiration when notification is sent |
| pwhash_version | JWT claim tracking password change for token invalidation |

---

*End of System Architecture Design — F-276 v1.0*
