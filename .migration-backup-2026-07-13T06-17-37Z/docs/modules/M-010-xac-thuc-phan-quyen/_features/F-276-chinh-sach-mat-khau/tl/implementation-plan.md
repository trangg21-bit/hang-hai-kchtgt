# F-276 -- Chinh sach mat khau: Technical Implementation Plan

> **Feature:** F-276  **Module:** M-010  **Status:** -> in_development
> **Author:** Tech Lead
> **Date:** 2026-06-23
> **Version:** 1.0

---

## 0. Purpose and Scope

This document is the **Tech Lead implementation blueprint** for F-276. It translates the SA
architectural-design decisions into actionable component breakdowns, concrete package structure,
interface contracts, and implementation notes aligned with the existing `com.hanghai.kchtg` codebase.

**What this is:** Code-level planning - packages, classes, methods, interfaces, contracts, data flow, and phase-by-phase task list.
**What this is NOT:** Business requirements (see `feature-brief.md`) or system architecture (see `sa/feature-design.md`).

---

## 1. Decision Log (Resolved from SA section 12)

| SA ID | Open Question | TL Decision | Rationale |
|-------|-------------|-------------|-----------|
| OQ-001 | bcrypt vs argon2id | **bcrypt (BCryptPasswordEncoder)** | Project already uses BCryptPasswordEncoder in SecurityConfig.java (line 86). Introducing argon2id requires a new dependency (io.github.a6hark:argon2-jvm) and a migration strategy for existing hashes. bcrypt w/ factor 12 meets the <200ms target (TC-PERF-01) and satisfies OWASP recommendations. argon2id can be adopted in a future hardening task. |
| OQ-002 | BCrypt work factor | **12** (default Spring Boot) | TC-PERF-01 target: <200ms per hash. Benchmark on staging hardware; if >200ms, reduce to 11. Work factor is configurable via `spring.security.bcrypt-log rounds` -- no code change needed to adjust. |
| OQ-003 | Password change requires re-auth? | **Current password only** | Existing User.password column stores the BCrypt hash directly. We extend User entity with expiresAt / lastChangedAt columns. No separate UserPassword table -- this simplifies the data model and avoids a JOIN on every login. (See section 2.3 for entity design.) |
| OQ-004 | SSO/social login exemption | **Exempt** -- password policy applies only to users authenticated via username/password | The PasswordExpirationFilter skips users with password = null (SSO users). This is a safe default. |
| OQ-005 | specialCharSet customization | **Predefined safe set** -- admin can extend but cannot disable the core set | Default: !@#$%^&*()-_=+. Admin may add more chars via config but cannot supply characters with SQL/injection risk. Validation at admin endpoint rejects chars that could break the regex. |
| OQ-006 | Email notification strategy | **Re-use existing email infrastructure** -- do NOT create a separate service | The SA references NotificationService. For Phase 3, implement NotificationService as a thin layer over whatever email mechanism M-010 already has (or a simple ApplicationEventPublisher-based async approach). If no email service exists yet, use in-app only for Phase 3 and add email later. |

---

## 2. Entity and Data Model Design

### 2.1 Design Principle: Extend User, Do Not Split

The SA proposes a separate UserPassword table. However, the existing codebase has `com.hanghai.kchtg.user.entity.User` with a `password` column. **Adding a separate UserPassword table introduces unnecessary complexity** (JOIN on every login, dual-write on change, orphan risk). Instead:

**Extend `User` entity** with 4 new columns:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `passwordHashVersion` | INT | YES | 0 | Monotonic version for JWT invalidation (F-274 integration). Incremented on every password change. |
| `expiresAt` | DATETIME2 | YES | NULL | Set at creation/last change = NOW + maxAgeDays. Backfill for existing users. |
| `lastChangedAt` | DATETIME2 | YES | NULL | Set at creation/last change. Used for expiration calculation. |
| `passwordStrengthScore` | TINYINT | YES | NULL | 0-100 score based on complexity. Updated on each change. |

### 2.2 New Entities (3 tables)

```
+----------------------+        +-------------------------+        +-------------------------+
|  PasswordPolicy      |        |  PasswordHistory        |        |  PasswordExpirationLog  |
+----------------------+        +-------------------------+        +-------------------------+
| id        UUID PK    |        | id        UUID PK       |        | id        UUID PK       |
| minLength   INT      |        | userId    UUID FK->User |        | userId    UUID FK->User |
| requireUpper  BIT    |        | passwordHash NVARCHAR   |        | expiredAt DATETIME2     |
| requireLower  BIT    |        | createdAt DATETIME2     |        | status    NVARCHAR(20)  |
| requireDigit  BIT    |        +-------------------------+       | notifiedVia NVARCHAR(20)|
| requireSpecial BIT   |        +-------------------------+       | createdAt DATETIME2     |
| specialSet  NVARCHAR |        | BaseEntity (shared)     |       +-------------------------+
| maxAgeDays  INT      |        +-------------------------+
| historyDepth  INT    |
| blockUserPw   BIT    |
| createdAt DATETIME2  |
| updatedAt DATETIME2  |
+----------------------+
```

### 2.3 JPA Entity Classes

```
com.hanghai.kchtg.user.entity.User               (EXTEND - add 4 columns)
com.hanghai.kchtg.password.entity.PasswordPolicy  (NEW)
com.hanghai.kchtg.password.entity.PasswordHistory (NEW)
com.hanghai.kchtg.password.entity.PasswordExpirationLog (NEW)
```

### 2.4 Flyway Migration Plan

| # | Script | Description |
|---|--------|-------------|
| V1 | create_password_policy.sql | CREATE TABLE PasswordPolicy + seed + singleton trigger |
| V2 | create_password_history.sql | CREATE TABLE PasswordHistory + index |
| V3 | create_password_expiration_log.sql | CREATE TABLE PasswordExpirationLog + index |
| V4 | add_password_columns_to_user.sql | Add passwordHashVersion, expiresAt, lastChangedAt, passwordStrengthScore to app_users |
| V5 | backfill_expiration_dates.sql | Backfill expiresAt and lastChangedAt for existing users (90-day default) |
| V6 | add_password_indexes.sql | Index on app_users(expiresAt); index on PasswordHistory(userId, createdAt DESC) |

---

## 3. Package Structure

All new code goes under `com.hanghai.kchtg.password.*`:

```
src/main/java/com/hanghai/kchtg/
+-- password/
|   +-- config/
|   |   +-- PasswordPolicyProperties.java        # @ConfigurationProperties(prefix = app.password-policy)
|   |   +-- PasswordSecurityConfig.java          # BCrypt bean override (if needed), rate limiter config
|   |
|   +-- entity/
|   |   +-- PasswordPolicy.java                  # JPA @Entity, singleton
|   |   +-- PasswordHistory.java                 # JPA @Entity
|   |   +-- PasswordExpirationLog.java           # JPA @Entity
|   |
|   +-- repository/
|   |   +-- PasswordPolicyRepository.java        # JpaCrudRepository<PasswordPolicy, UUID>
|   |   +-- PasswordHistoryRepository.java       # Custom: findTopNByUserIdOrderByCreatedAtDesc
|   |   +-- PasswordExpirationLogRepository.java # findByUserIdAndStatus
|   |   +-- UserPasswordRepository.java          # Custom: findExpiredUsers, findExpiringSoonUsers
|   |
|   +-- service/
|   |   +-- PasswordPolicyService.java           # Singleton CRUD, @Cacheable(passwordPolicy)
|   |   +-- PasswordChangeService.java           # Orchestrate full change-password flow (transactional)
|   |   +-- ComplexityValidator.java             # Rule-based complexity validation
|   |   +-- HistoryValidator.java                # Hash comparison against last N hashes
|   |   +-- ExpirationChecker.java               # Compute PasswordStatus from expiresAt
|   |   +-- PasswordHashService.java             # hash() / verify() wrapper around BCryptPasswordEncoder
|   |
|   +-- monitor/
|   |   +-- ExpirationScanner.java               # @Scheduled daily cron
|   |   +-- WarningProcessor.java                # T-7/T-3/T-1 notification dispatch
|   |   +-- ForcedChangeTrigger.java             # Expired user detection + logging
|   |
|   +-- filter/
|   |   +-- PasswordExpirationFilter.java        # OncePerRequestFilter, order HIGH_PRECEDENCE + 10
|   |
|   +-- controller/
|   |   +-- PasswordPolicyController.java        # GET/PUT /api/admin/password-policy
|   |   +-- AuthPasswordController.java          # POST change-password, GET my-password-status
|   |
|   +-- dto/
|   |   +-- ChangePasswordRequest.java
|   |   +-- ChangePasswordResponse.java
|   |   +-- PasswordPolicyResponse.java
|   |   +-- PasswordPolicyUpdateRequest.java
|   |   +-- PasswordStatusResponse.java
|   |   +-- ExpiryReportResponse.java
|   |
|   +-- exception/
|   |   +-- PasswordExpiredException.java
|   |   +-- PasswordComplexityException.java
|   |   +-- PasswordHistoryException.java
|   |   +-- GlobalPasswordExceptionHandler.java  # @RestControllerAdvice
|   |
|   +-- security/
|       +-- JwtPasswordVersionValidator.java     # Validates pwhashVersion claim against DB
|
src/main/java/com/hanghai/kchtg/user/entity/
+-- User.java  (MODIFY - add 4 new columns)
```

---

## 4. Interface Contracts

### 4.1 ComplexityValidator

```java
package com.hanghai.kchtg.password.service;

public interface ComplexityValidator {
    /**
     * Validates password against the current policy.
     * All violations collected - no early return.
     */
    ComplexityResult validate(String password, UserContext userContext, PasswordPolicy policy);
}

public record ComplexityResult(boolean valid, List<ComplexityViolation> violations) {}
public record ComplexityViolation(String code, String message) {}
public record UserContext(String username, String email) {}
```

**Validation order (deterministic):**
1. Absolute minimum length (8) -> `TOO_SHORT_CRITICAL`
2. Policy minimum length -> `TOO_SHORT`
3. Uppercase requirement -> `MISSING_UPPERCASE`
4. Lowercase requirement -> `MISSING_LOWERCASE`
5. Digit requirement -> `MISSING_DIGIT`
6. Special char requirement -> `MISSING_SPECIAL_CHAR`
7. Personal info block -> `CONTAINS_PERSONAL_INFO`

**Performance:** Pure in-memory, no DB, <5ms.

### 4.2 HistoryValidator

```java
package com.hanghai.kchtg.password.service;

public interface HistoryValidator {
    /**
     * Checks if the given password hash matches any of the last N stored hashes.
     * Uses BCrypt.checkpw for constant-time comparison.
     */
    boolean isPasswordInHistory(String userId, String candidateHash, int depth);
}
```

**Algorithm:**
1. `PasswordHistoryRepository.findTopNByUserIdOrderByCreatedAtDesc(userId, depth)`
2. For each stored hash: `BCryptPasswordEncoder.matches(candidateHash, storedHash)`
3. Early-return on first match

**Performance target:** <50ms for depth=5, factor=12.

### 4.3 ExpirationChecker

```java
package com.hanghai.kchtg.password.service;

public interface ExpirationChecker {
    PasswordStatus check(OffsetDateTime expiresAt, Instant now);
    PasswordStatusStatus compute(User user, Instant now);
}

public enum PasswordStatus {
    ACTIVE,        // > 7 days
    WARNING_T7,    // <= 7 days, > 3
    WARNING_T3,    // <= 3 days, > 1
    WARNING_T1,    // <= 1 day, > 0
    EXPIRED        // <= 0 days
}

public record PasswordStatusStatus(
    PasswordStatus status,
    int daysRemaining,
    OffsetDateTime expiresAt,
    List<ExpirationWarning> warnings
) {}
```

### 4.4 PasswordHashService

```java
package com.hanghai.kchtg.password.service;

public interface PasswordHashService {
    String hash(String password);
    boolean verify(String password, String storedHash);
}
```

**Implementation:** Thin wrapper around Spring BCryptPasswordEncoder bean. Isolates the hash algorithm for future argon2 migration.

### 4.5 PasswordChangeService

```java
package com.hanghai.kchtg.password.service;

public interface PasswordChangeService {
    PasswordChangeResult changePassword(String userId, String currentPassword, String newPassword);
}

public record PasswordChangeResult(
    boolean success,
    @Nullable String error,
    @Nullable String errorDetail
) {}
```

### 4.6 PasswordPolicyService

```java
package com.hanghai.kchtg.password.service;

public interface PasswordPolicyService {
    PasswordPolicy getPolicy();
    PasswordPolicy updatePolicy(PasswordPolicyUpdateRequest request);
    PasswordPolicyResponse getPolicyResponse();
}
```

**Caching:** `@Cacheable(passwordPolicy)` with 1-hour TTL. Cache eviction on update.

### 4.7 ExpirationScanner (Cron)

```java
@Component
public class ExpirationScanner {
    @Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Bangkok")
    public void scanAndProcess() { ... }
}
```

---

## 5. Password Validation Pipeline

```
                    POST /api/auth/change-password
                              |
                              v
              +-------------------------------+
              |   AuthPasswordController        |
              |   @PreAuthorize(isAuthenticated())
              +-------------------------------+
                              |
                              v
              +-------------------------------+
              |   RateLimiter (5/15min/user)    |  <-- Applied BEFORE validation
              +-------------------------------+
                              |
                              v
              +-------------------------------+
              |   PasswordChangeService         |
              |   @Transactional                |
              +-------------------------------+
                              |
        +---------------------+---------------------+
        v                     v                     v
+---------------+   +-----------------+   +------------------+
|  Current PW   |   |  Complexity     |   |  History         |
|  Verification |   |  Validation     |   |  Validation      |
|               |   |                 |   |                  |
| BCrypt.check  |   | ComplexityVal   |   | HistoryVal       |
| matches()     |   | .validate()     |   | .isInHistory()   |
+-------+-------+   +--------+--------+   +--------+---------+
        |                    |                     |
        v                    v                     v
   If fail ->          Collect violations     If match ->
   Generic error      list                  Generic error
   (BR-276-09)        (detailed, safe)      (reuse detected)
        |                    |                     |
        +--------------------+---------------------+
                              |
                     All pass?
                              |
                    +---------v----------+
                    |  Update Flow        |
                    |                     |
                    |  1. Insert old hash |
                    |     into History    |
                    |  2. Update user:    |
                    |     - passwordHash  |
                    |     - expiresAt     |
                    |     - lastChangedAt |
                    |     - hashVersion++ |
                    |  3. Log changed     |
                    |  4. Invalidate JWT  |
                    +--------------------+
```

### 5.1 Detailed Pseudocode

```java
@Transactional
public PasswordChangeResult changePassword(String userId,
                                           String currentPassword,
                                           String newPassword) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // 1. Verify current password
    if (!passwordHashService.verify(currentPassword, user.getPassword())) {
        return new PasswordChangeResult(false, "authentication_failed",
            "Doi mat khau khong thanh cong");  // BR-276-09
    }

    // 2. Load policy (cached)
    PasswordPolicy policy = passwordPolicyService.getPolicy();

    // 3. Validate complexity (detailed errors allowed - auth confirmed)
    UserContext ctx = new UserContext(user.getUsername(), user.getEmail());
    ComplexityResult cr = complexityValidator.validate(newPassword, ctx, policy);
    if (!cr.valid()) {
        return new PasswordChangeResult(false, "complexity_violation",
            cr.violations().stream().map(ComplexityViolation::message)
                .collect(Collectors.joining(", ")));
    }

    // 4. Check duplicate with current password
    String newHash = passwordHashService.hash(newPassword);
    if (newHash.equals(user.getPassword())) {
        return new PasswordChangeResult(false, "password_duplicate",
            "Mat khau moi khong duoc trung mat khau hien tai");
    }

    // 5. Check history
    if (historyValidator.isPasswordInHistory(userId.toString(), newHash, policy.getHistoryDepth())) {
        return new PasswordChangeResult(false, "password_reused",
            "Mat khau da duoc su dung gan day");
    }

    // 6. Apply change (transactional)
    user.setPassword(newHash);
    LocalDateTime now = LocalDateTime.now();
    user.setLastChangedAt(now);
    user.setExpiresAt(now.plusDays(policy.getMaxAgeDays()));
    user.setPasswordHashVersion(
        Objects.requireNonNullElse(user.getPasswordHashVersion(), 0) + 1);

    // 7. Store old hash in history
    PasswordHistory history = new PasswordHistory();
    history.setUserId(UUID.fromString(userId));
    history.setPasswordHash(user.getPassword());  // OLD hash
    history.setCreatedAt(now);
    passwordHistoryRepository.save(history);

    // 8. Trim history to depth
    trimHistory(userId, policy.getHistoryDepth());

    // 9. Log change
    PasswordExpirationLog logEntry = new PasswordExpirationLog();
    logEntry.setUserId(UUID.fromString(userId));
    logEntry.setExpiredAt(now);
    logEntry.setStatus("changed");
    logEntry.setNotifiedVia("none");
    logEntry.setCreatedAt(now);
    passwordExpirationLogRepository.save(logEntry);

    userRepository.save(user);

    return new PasswordChangeResult(true, null, null);
}
```

---

## 6. Hash Algorithm Decision

### Decision: BCrypt (Spring BCryptPasswordEncoder)

**Why bcrypt over argon2id:**

| Criterion | bcrypt | argon2id |
|-----------|--------|----------|
| **Existing dependency** | Already in Spring Security (spring-security-crypto) | Requires io.github.a6hark:argon2-jvm |
| **Existing code** | SecurityConfig.java line 86 already uses it | Zero integration |
| **Migration complexity** | N/A - existing hashes are already bcrypt | Requires hybrid migration (read bcrypt, write argon2, rehash on next login) |
| **Security** | Strong, widely audited, OWASP-approved | Stronger (memory-hard), PHC winner |
| **Performance** | ~10-15ms per check at factor 12 | ~5-10ms at low memory, higher memory usage |
| **Team familiarity** | All backend devs know BCrypt | New algorithm to learn |
| **Tuning** | Single parameter (work factor) | Three parameters (memory, iterations, parallelism) |

**Migration path to argon2id (future):**
1. Implement `PasswordHashService` with a pluggable `HashStrategy` interface
2. Currently delegate to BCryptPasswordEncoder
3. When argon2 is ready, add `Argon2Strategy` and toggle via config
4. Hybrid verification: BCrypt.checkpw(plaintext, hash) if bcrypt, Argon2.verify(plaintext, hash) if argon2
5. On successful hybrid verify -> rehash with new algorithm (password-upgrade pattern)

---

## 7. Login-Time Enforcement (PasswordExpirationFilter)

### Placement in Filter Chain

```
UsernamePasswordAuthenticationFilter (Spring)
    v  <- authenticates, sets SecurityContextHolder
JwtAuthFilter (existing)
    v  <- validates JWT, sets SecurityContextHolder
-> PasswordExpirationFilter (NEW, order = HIGHEST_PRECEDENCE + 10)
    v  <- checks expiresAt, blocks if EXPIRED
All other filters...
```

### Key Behavior

| Condition | Action | HTTP Status |
|-----------|--------|-------------|
| Password EXPIRED | Block, return error JSON with redirect URL | 403 |
| Password WARNING_T7/T3/T1 | Allow, add X-Password-Status + X-Days-Remaining headers | 200 |
| Password ACTIVE | Pass through | 200 |
| User passwordHashVersion != JWT claim | Reject (token revoked by password change) | 401 |
| Request to /api/auth/change-password | Skip check | 200 |
| Request to /api/auth/login | Skip check (check happens after auth) | 200 |

---

## 8. Admin Config Endpoint Details

### PUT /api/admin/password-policy

**Request (partial update - only provided fields):**

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

**Server-side validation:**

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| minLength | 8 | 64 | Below 8 -> CRITICAL rejection |
| maxAgeDays | 1 | 365 | |
| historyDepth | 0 | 50 | 0 = no history check |
| specialCharSet | 4 chars | 128 chars | Must not contain SQL-injection-risk chars |
| requireX fields | - | - | At least one must be true |

**Response:**

```json
{
  "status": "success",
  "message": "Chinh sach mat khau da duoc cap nhat",
  "updatedFields": ["maxAgeDays", "historyDepth"],
  "policy": { /* full updated policy */ }
}
```

**Cache invalidation:** On successful update -> `@CacheEvict("passwordPolicy")`.

---

## 9. Expiration Monitoring (Cron) - Implementation Details

### 9.1 Scheduler Setup

```java
@Configuration
@EnableScheduling
public class SchedulerConfig {
    // Existing file - just ensure @EnableScheduling is present
}
```

### 9.2 ExpirationScanner Implementation

```java
@Component
public class ExpirationScanner {
    private final UserPasswordRepository userPasswordRepo;
    private final WarningProcessor warningProcessor;
    private final ForcedChangeTrigger forcedChangeTrigger;
    private final PasswordPolicyService policyService;

    @Scheduled(cron = "0 0 2 * * ?", zone = "Asia/Bangkok")
    public void scanAndProcess() {
        log.info("Starting password expiration scan...");
        List<ExpiringUserDto> expiringSoon = userPasswordRepo.findExpiringSoon();
        for (ExpiringUserDto user : expiringSoon) {
            warningProcessor.process(user);
        }
        List<ExpiredUserDto> expired = userPasswordRepo.findExpired();
        for (ExpiredUserDto user : expired) {
            forcedChangeTrigger.trigger(user);
        }
        log.info("Scan done. Warnings: {}, Expired: {}", expiringSoon.size(), expired.size());
    }
}
```

### 9.3 Repository Queries

```java
public interface UserPasswordRepository {
    @Query("""
        SELECT new com.hanghai.kchtg.password.monitor.ExpiringUserDto(
            u.id, u.username, u.email, u.expiresAt,
            DATEDIFF(day, CURRENT_TIMESTAMP, u.expiresAt))
        FROM User u
        WHERE u.expiresAt IS NOT NULL
          AND u.expiresAt BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + 7 DAYS
          AND u.status = ACTIVE
        """)
    List<ExpiringUserDto> findExpiringSoon();

    @Query("""
        SELECT new com.hanghai.kchtg.password.monitor.ExpiredUserDto(
            u.id, u.username, u.email, u.expiresAt)
        FROM User u
        WHERE u.expiresAt IS NOT NULL
          AND u.expiresAt < CURRENT_TIMESTAMP
          AND u.status = ACTIVE
        """)
    List<ExpiredUserDto> findExpired();
}
```

### 9.4 WarningProcessor

Tracks which thresholds have been sent per user via PasswordExpirationLog:

```java
@Component
public class WarningProcessor {
    private final PasswordExpirationLogRepository logRepo;
    private final NotificationService notificationService;

    public void process(ExpiringUserDto user) {
        String threshold = switch ((int) user.daysRemaining()) {
            case 1 -> "warning_t1";
            case 2, 3 -> "warning_t3";
            default -> "warning_t7";
        };
        boolean alreadyNotified = logRepo.existsByUserIdAndStatus(user.userId, threshold);
        if (!alreadyNotified) {
            PasswordExpirationLog logEntry = new PasswordExpirationLog();
            logEntry.setUserId(user.userId);
            logEntry.setExpiredAt(user.expiresAt);
            logEntry.setStatus(threshold);
            logEntry.setNotifiedVia(user.emailVerified ? "email" : "in-app");
            logRepo.save(logEntry);
            notificationService.sendWarning(user, threshold, user.expiresAt);
        }
    }
}
```

---

## 10. F-274 Integration: JWT Invalidation

### 10.1 New JWT Claim

Add `pwhashVersion` claim to JWT payload:

```java
// JwtUtil.java - existing file, modify generateToken:
public String generateToken(String username, String role, int passwordHashVersion) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("pwhashVersion", passwordHashVersion);  // NEW
    claims.put("role", role);
    // ... existing claims
}
```

### 10.2 JwtPasswordVersionValidator

```java
@Component
public class JwtPasswordVersionValidator {
    private final UserRepository userRepository;

    public boolean isTokenValid(String userId, int jwtVersion) {
        User user = userRepository.findById(UUID.fromString(userId)).orElse(null);
        if (user == null) return false;
        int dbVersion = Objects.requireNonNullElse(user.getPasswordHashVersion(), 0);
        return dbVersion >= jwtVersion;  // token valid if its version <= current
    }
}
```

**Integration point:** In JwtAuthFilter, after JWT validation succeeds -> call JwtPasswordVersionValidator.isTokenValid(userId, jwtVersion). If false -> return 401 "Token revoked".

---

## 11. F-277 Integration Notes

When a user password is expired and they are redirected to the change-password flow, the lockout counter (F-277) should **NOT** be incremented.

In `PasswordExpirationFilter`, when returning 403 for expired password:
```java
request.setAttribute("password_expired", true);
```

In `AuthController.login()`, check this attribute before incrementing lockout counter:
```java
if (Boolean.TRUE.equals(request.getAttribute("password_expired"))) {
    // Skip lockout counter for expired-password users
    log.info("Password expired user bypassing lockout check");
}
```

---

## 12. Frontend Integration Notes

### 12.1 React Components

| Component | Route | API Called | Notes |
|-----------|-------|------------|-------|
| ChangePasswordPage | /auth/change-password | POST /api/auth/change-password | Redirect target for expired users. Show inline policy rules as checklist. |
| PasswordStatusBadge | Inline (header/nav) | GET /api/auth/my-password-status | Shows expiration status icon + tooltip. |
| PolicyAdminPage | /admin/password-policy | GET/PUT /api/admin/password-policy | Admin-only. Form with all policy params. |
| ExpiryReportPage | /admin/password-policy/expiry-report | GET /api/admin/password-policy/expiry-report | Admin-only. Paginated table. |

### 12.2 TypeScript Type Definitions

```typescript
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
  specialCharSet: string;
  maxAgeDays: number;
  historyDepth: number;
  blockUsernameInPassword: boolean;
  warningThresholds: number[];
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface PasswordStatusResponse {
  expiresAt: string;
  daysRemaining: number;
  status: 'active' | 'warning_t7' | 'warning_t3' | 'warning_t1' | 'expired';
  warnings: ExpirationWarning[];
  lastChangedAt: string;
  changePasswordUrl: string;
}
```

---

## 13. Unit Test Matrix (Backend)

| Test ID | Service | Input | Expected |
|---------|---------|-------|----------|
| CU-01 | ComplexityValidator | "Ab1!xxxx" + policy(default) | valid = true |
| CU-02 | ComplexityValidator | "short" (5 chars) | violations = [TOO_SHORT_CRITICAL] |
| CU-03 | ComplexityValidator | "ALLUPPER1!" | violations = [MISSING_LOWERCASE] |
| CU-04 | ComplexityValidator | "alllower1!" | violations = [MISSING_UPPERCASE] |
| CU-05 | ComplexityValidator | "AllLetters!" | violations = [MISSING_DIGIT] |
| CU-06 | ComplexityValidator | "AllLetters1" | violations = [MISSING_SPECIAL_CHAR] |
| CU-07 | ComplexityValidator | "Ab1!nguyen" + user "nguyen" | violations = [CONTAINS_PERSONAL_INFO] |
| CU-08 | ComplexityValidator | "Ab1!n" + user "nguyen" | valid = true (substring < 4 chars) |
| CU-09 | HistoryValidator | New hash matches history[0] | true |
| CU-10 | HistoryValidator | New hash does not match any | false |
| CU-11 | ExpirationChecker | expiresAt = now + 30d | ACTIVE, daysRemaining = 30 |
| CU-12 | ExpirationChecker | expiresAt = now + 5d | WARNING_T7, daysRemaining = 5 |
| CU-13 | ExpirationChecker | expiresAt = now + 2d | WARNING_T3, daysRemaining = 2 |
| CU-14 | ExpirationChecker | expiresAt = now + 0.5d | WARNING_T1, daysRemaining = 0 |
| CU-15 | ExpirationChecker | expiresAt = now - 1d | EXPIRED, daysRemaining = -1 |
| CU-16 | PasswordHashService | "test" -> hash -> verify("test", hash) | true |
| CU-17 | PasswordHashService | "test" -> hash -> verify("wrong", hash) | false |
| CU-18 | PasswordHashService | Same input hashed twice -> hashes differ | true (different salts) |
| CU-19 | PasswordChangeService | Wrong current password | error = authentication_failed |
| CU-20 | PasswordChangeService | Good current + bad new | error = complexity_violation |
| CU-21 | PasswordChangeService | Good current + history match | error = password_reused |
| CU-22 | PasswordChangeService | All pass | success = true, history record inserted |
| CU-23 | PasswordPolicyService | getPolicy() | Returns singleton, cached |
| CU-24 | PasswordPolicyService | updatePolicy() | Upserts singleton, evicts cache |

---

## 14. Integration Test Matrix

| Test ID | Endpoint | Setup | Action | Expected |
|---------|----------|-------|--------|----------|
| CI-01 | POST /api/auth/change-password | User exists, password "OldPass1!" | Change to "NewPass1@" (valid) | 200 OK |
| CI-02 | POST /api/auth/change-password | Same | Current password wrong | 401, generic error |
| CI-03 | POST /api/auth/change-password | Same | New password too short | 422, complexity violations |
| CI-04 | POST /api/auth/change-password | Same, history = 5 entries | New = one of old 5 | 409, reuse error |
| CI-05 | GET /api/auth/password-policy | No auth required | GET | 200, policy fields |
| CI-06 | PUT /api/admin/password-policy | Admin role | Update maxAgeDays | 200, updated |
| CI-07 | PUT /api/admin/password-policy | User role (not admin) | PUT | 403 |
| CI-08 | GET /api/auth/my-password-status | Auth user, password active | GET | 200, ACTIVE |
| CI-09 | GET /api/auth/my-password-status | Auth user, password expiring T-3 | GET | 200, WARNING_T3 |
| CI-10 | POST /api/auth/login | User password expired | Login | 403, password_expired |

---

## 15. Security Test Matrix

| Test ID | Scenario | Expected |
|---------|----------|----------|
| CS-01 | Password in DB/logs/API response | Never plaintext - always BCrypt hash |
| CS-02 | SQL Injection via password field | Parameterized queries only |
| CS-03 | Timing attack on hash compare | BCrypt.checkpw is constant-time |
| CS-04 | Rate limit on change-password | 6th attempt within 15 min -> 429 |
| CS-05 | Error message does not leak auth failure | Generic "Doi mat khau khong thanh cong" |

---

## 16. Implementation Phases and Task List

### Phase 1 - Core (MVP) - Estimated: 3-4 days

| # | Task | Component | Depends On |
|---|------|-----------|------------|
| 1.1 | Flyway V1-V3: Create tables + seed + triggers | DB Migration | - |
| 1.2 | Add 4 columns to User entity + backfill migration (V4-V5) | User.java | 1.1 |
| 1.3 | PasswordPolicy JPA Entity + Repository | entity/, repository/ | 1.1 |
| 1.4 | PasswordPolicyService with @Cacheable | service/ | 1.3 |
| 1.5 | PasswordHashService wrapper around BCryptPasswordEncoder | service/ | - |
| 1.6 | ComplexityValidator + unit tests | service/ | 1.3 |
| 1.7 | PasswordPolicyResponse DTO | dto/ | 1.3 |
| 1.8 | GET /api/auth/password-policy endpoint | controller/ | 1.4, 1.7 |
| 1.9 | ChangePasswordRequest / ChangePasswordResponse DTOs | dto/ | - |
| 1.10 | GET /api/auth/my-password-status endpoint | controller/ | 1.6 |

### Phase 2 - History and Expiration - Estimated: 3-4 days

| # | Task | Component | Depends On |
|---|------|-----------|------------|
| 2.1 | PasswordHistory entity + Repository + V2 migration | entity/, repository/ | Phase 1 DB migrations |
| 2.2 | HistoryValidator service + unit tests | service/ | 2.1 |
| 2.3 | ExpirationChecker service + enum PasswordStatus | service/ | - |
| 2.4 | PasswordExpirationFilter - login-time enforcement | filter/ | 2.3, SecurityConfig |
| 2.5 | PasswordChangeService - full transactional flow | service/ | 1.5, 1.6, 2.2, 2.3 |
| 2.6 | POST /api/auth/change-password endpoint | controller/ | 2.5, DTOs |
| 2.7 | PasswordExpiredException + GlobalExceptionHandler | exception/ | 2.5 |
| 2.8 | Integration tests for change-password flow | tests/ | 2.6 |

### Phase 3 - Monitoring and Notifications - Estimated: 3-4 days

| # | Task | Component | Depends On |
|---|------|-----------|------------|
| 3.1 | PasswordExpirationLog entity + Repository | entity/, repository/ | DB migrations |
| 3.2 | ExpirationScanner cron job | monitor/ | 3.1, UserPasswordRepository |
| 3.3 | WarningProcessor - threshold tracking + dispatch | monitor/ | 3.1, 3.2 |
| 3.4 | ForcedChangeTrigger - expired user logging | monitor/ | 3.1, 3.2 |
| 3.5 | NotificationService interface + in-app implementation | service/ | 3.3 |
| 3.6 | PUT /api/admin/password-policy endpoint | controller/ | 1.4 |
| 3.7 | ExpiryReportResponse DTO + paginated admin report | dto/, controller/ | 3.2 |
| 3.8 | Admin endpoints: GET /api/admin/password-policy/expiry-report | controller/ | 3.6, 3.7 |

### Phase 4 - Integration and Polish - Estimated: 2-3 days

| # | Task | Component | Depends On |
|---|------|-----------|------------|
| 4.1 | pwhashVersion claim in JWT (JwtUtil) | security/ | Phase 1-3 |
| 4.2 | JwtPasswordVersionValidator + JwtAuthFilter update | security/, filter/ | 4.1 |
| 4.3 | F-277 coordination (skip lockout on expired-password change) | filter/, AuthController | 4.2, F-277 exists |
| 4.4 | PasswordPolicyProperties - externalized config | config/ | Phase 1 |
| 4.5 | Rate limiting implementation (Redis token bucket or Spring RateLimiter) | config/, controller | Phase 1 |
| 4.6 | Performance benchmarks (TC-PERF-01 through 04) | tests/ | Phase 2 |
| 4.7 | Security audit (TC-SEC-01 through 05) | tests/ | Phase 2 |
| 4.8 | E2E tests (TC-E2E-01 through 06) | tests/ | Phase 2 |
| 4.9 | Frontend: ChangePasswordPage, PasswordStatusBadge | React frontend | Phase 1-2 endpoints |
| 4.10 | Frontend: Admin policy config page + expiry report | React frontend | Phase 3 endpoints |

---

## 17. Configuration (application.yml)

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

spring:
  security:
    bcrypt-log-rounds: 12

  cache:
    type: simple
    simple:
      ttl: 3600000
```

---

## 18. Risk and Mitigation Summary

| Risk | Mitigation |
|------|-----------|
| Existing users have no expiresAt (migration gap) | V5 backfill migration; PasswordExpirationFilter treats null as ACTIVE |
| bcrypt at factor 12 too slow on production hardware | Configurable bcrypt-log-rounds; set to 11 if benchmark exceeds 200ms |
| Singleton PasswordPolicy table inconsistency | DB trigger (TR_PasswordPolicy_SingletonGuard) + unique constraint |
| Password history grows unbounded | trimHistory() in PasswordChangeService enforces historyDepth cap |
| Rate limiting blocks legitimate users | UI shows countdown; limit is per-user, not global |
| JWT invalidation at scale | pwhashVersion claim approach is O(1) per request - no blacklist needed |

---

## 19. File Checklist (Create/Modify)

### Create (33 files)

1. src/main/java/com/hanghai/kchtg/password/entity/PasswordPolicy.java
2. src/main/java/com/hanghai/kchtg/password/entity/PasswordHistory.java
3. src/main/java/com/hanghai/kchtg/password/entity/PasswordExpirationLog.java
4. src/main/java/com/hanghai/kchtg/password/repository/PasswordPolicyRepository.java
5. src/main/java/com/hanghai/kchtg/password/repository/PasswordHistoryRepository.java
6. src/main/java/com/hanghai/kchtg/password/repository/PasswordExpirationLogRepository.java
7. src/main/java/com/hanghai/kchtg/password/repository/UserPasswordRepository.java
8. src/main/java/com/hanghai/kchtg/password/service/PasswordPolicyService.java
9. src/main/java/com/hanghai/kchtg/password/service/PasswordChangeService.java
10. src/main/java/com/hanghai/kchtg/password/service/ComplexityValidator.java
11. src/main/java/com/hanghai/kchtg/password/service/HistoryValidator.java
12. src/main/java/com/hanghai/kchtg/password/service/ExpirationChecker.java
13. src/main/java/com/hanghai/kchtg/password/service/PasswordHashService.java
14. src/main/java/com/hanghai/kchtg/password/service/NotificationService.java
15. src/main/java/com/hanghai/kchtg/password/monitor/ExpirationScanner.java
16. src/main/java/com/hanghai/kchtg/password/monitor/WarningProcessor.java
17. src/main/java/com/hanghai/kchtg/password/monitor/ForcedChangeTrigger.java
18. src/main/java/com/hanghai/kchtg/password/filter/PasswordExpirationFilter.java
19. src/main/java/com/hanghai/kchtg/password/controller/PasswordPolicyController.java
20. src/main/java/com/hanghai/kchtg/password/controller/AuthPasswordController.java
21. src/main/java/com/hanghai/kchtg/password/dto/ChangePasswordRequest.java
22. src/main/java/com/hanghai/kchtg/password/dto/ChangePasswordResponse.java
23. src/main/java/com/hanghai/kchtg/password/dto/PasswordPolicyResponse.java
24. src/main/java/com/hanghai/kchtg/password/dto/PasswordPolicyUpdateRequest.java
25. src/main/java/com/hanghai/kchtg/password/dto/PasswordStatusResponse.java
26. src/main/java/com/hanghai/kchtg/password/dto/ExpiryReportResponse.java
27. src/main/java/com/hanghai/kchtg/password/exception/PasswordExpiredException.java
28. src/main/java/com/hanghai/kchtg/password/exception/PasswordComplexityException.java
29. src/main/java/com/hanghai/kchtg/password/exception/PasswordHistoryException.java
30. src/main/java/com/hanghai/kchtg/password/exception/GlobalPasswordExceptionHandler.java
31. src/main/java/com/hanghai/kchtg/password/security/JwtPasswordVersionValidator.java
32. src/main/java/com/hanghai/kchtg/password/config/PasswordPolicyProperties.java
33. src/main/java/com/hanghai/kchtg/password/config/PasswordSecurityConfig.java

### Modify (5 files)

1. src/main/java/com/hanghai/kchtg/user/entity/User.java - add 4 columns
2. src/main/java/com/hanghai/kchtg/security/JwtUtil.java - add pwhashVersion claim
3. src/main/java/com/hanghai/kchtg/security/JwtAuthFilter.java - add version check
4. src/main/java/com/hanghai/kchtg/config/SecurityConfig.java - add filter registration + permit password-policy endpoints
5. src/main/java/com/hanghai/kchtg/user/controller/AuthController.java - add F-277 skip logic

### Flyway Scripts (6 files)

1. src/main/resources/db/migration/V1__create_password_policy.sql
2. src/main/resources/db/migration/V2__create_password_history.sql
3. src/main/resources/db/migration/V3__create_password_expiration_log.sql
4. src/main/resources/db/migration/V4__add_password_columns_to_user.sql
5. src/main/resources/db/migration/V5__backfill_expiration_dates.sql
6. src/main/resources/db/migration/V6__add_password_indexes.sql

---

*End of Technical Implementation Plan - F-276 v1.0 (Tech Lead)*
