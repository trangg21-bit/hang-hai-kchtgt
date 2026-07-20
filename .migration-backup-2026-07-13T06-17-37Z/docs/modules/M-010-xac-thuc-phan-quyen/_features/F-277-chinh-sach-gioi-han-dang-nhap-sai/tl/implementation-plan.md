# Technical Implementation Plan: F-277 — Chính sách giới hạn đăng nhập sai

> **Feature**: F-277 | **Module**: M-010-xac-thuc-phan-quyen | **Stage**: in_development
> **Authored by**: Tech-lead | **Date**: 2026-06-23
> **Source**: SA feature-design.md + feature-brief.md

---

## 1. Overview & Scope

This plan translates the SA design into actionable implementation tasks with component breakdown, package structure, interface contracts, and concurrency strategy for the Login Attempt Limit Policy feature.

### 1.1 Design Decisions

| Decision | Rationale |
|---|---|
| **Redis cache-aside for LockoutPolicy** | Policy changes must take effect immediately without service restart (BR-277-10). Redis gives sub-millisecond reads with cache-evict on updates. Default TTL: 60s fallback. |
| **Scan-based auto-unlock (5-min interval)** | Simple, deterministic, no external message queue dependency. Accepts ±5min precision (Q2 acknowledged). Alternative: RabbitMQ delayed exchange for per-account precision (future). |
| **Pessimistic locking on User row** | Concurrent login attempts from same user could race on `loginFailCount` increment. `SELECT ... FOR UPDATE` on the User row prevents lost updates (Q4). |
| **@Transactional(REQUIRES_NEW) for audit logs** | LoginAttemptLog must survive main transaction rollback. Separate transaction ensures audit trail integrity. |
| **Async login attempt recording** | Non-blocking write to LoginAttempt — does not add latency to login response time. |

### 1.2 Open Questions & Resolutions

| # | Question | Resolution |
|---|---|---|
| Q1 | Separate TOTP counter vs password counter? | **Unified counter** — feature-brief explicitly states "cả mật khẩu và TOTP sai đều tính vào failCount". No separate counter. |
| Q2 | Auto-unlock 5-min precision? | **Accept 5-min interval** for MVP. Add `@EventListener(ApplicationReadyEvent)` for catch-up on startup. Future: delayed message queue. |
| Q3 | LoginAttempt retention? | **90 days** in active table, then partitioned/archived to `login_attempts_archive`. Monthly partition on `occurred_at`. |
| Q4 | Concurrent race condition on failCount? | **Pessimistic row lock** (`SELECT FOR UPDATE`) during `recordFailure()`. Prevents lost updates from parallel requests. |
| Q5 | JWT invalidation scope? | **Full user JWT invalidation** — all tokens for the user are blacklisted via F-274 Redis token store. Revokes active sessions. |
| Q6 | Admin data scoping? | **Custom `@PreAuthorize` expression** with `SecurityContext` tenant-unit resolution. `system-admin`: all users; `admin`: unit-scoped. |

---

## 2. Component Breakdown

### 2.1 Architecture Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        ReactJS Frontend                         │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │ LoginPage     │  │ LockoutBanner │  │ AdminLockoutConsole  │ │
│  │ (auth/login)  │  │ (warning/blocked)│ │ (users/[id]/lockout)│ │
│  └──────┬───────┘  └───────┬────────┘  └──────────┬───────────┘ │
│         │                  │                       │             │
└─────────┼──────────────────┼───────────────────────┼─────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot Backend                          │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │  Auth Controller  │     │  AccountAdminController          │  │
│  │  PolicyAdminController │  │  AuditLogController              │  │
│  └──────┬───────────┘     └──────────┬───────────────────────┘  │
│         │                            │                           │
│  ┌──────▼────────────────────────────▼────────────────────────┐  │
│  │              Core Service Layer                            │  │
│  │  ┌────────────────────────────────────────────────────┐    │  │
│  │  │  LockoutService (central business logic)           │    │  │
│  │  │  - checkLockout(username) → LockoutStatus          │    │  │
│  │  │  - recordFailure(user, reason) → LockoutResult     │    │  │
│  │  │  - recordSuccess(user)                               │    │  │
│  │  │  - unlockAccount(userId, admin, reason)            │    │  │
│  │  │  - autoUnlockExpired() → int count                 │    │  │
│  │  └────────────────────────────────────────────────────┘    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │  │
│  │  │ TOTPValidator│  │JwtTokenService│  │ AuditLogService  │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │ AutoUnlockScheduler  │  │  Event Listeners                 │  │
│  │ (@Scheduled 5min)    │  │  - AccountLockedEvent→F-274      │  │
│  │ (catch-up on start)  │  │  - AccountUnlockedEvent→notify   │  │
│  └──────────────────────┘  └──────────────────────────────────┘  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │            Repository Layer (Spring Data JPA)              │  │
│  │  UserRepository  │  LoginAttemptRepository  │               │  │
│  │  LockoutPolicyRepository  │  LoginAttemptLogRepository      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │  Redis Cache Layer   │  │  MSSQL 2022 Database             │  │
│  │  lockout:policy      │  │  - users (login_fail_count,      │  │
│  │  lockout:status:{id} │  │    locked_until)                 │  │
│  │  (TTL 60s)           │  │  - login_attempts (monthly part.)│  │
│  │                      │  │  - login_attempt_logs (immutable)│  │
│  │                      │  │  - lockout_policies (singleton)  │  │
│  └──────────────────────┘  └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibility Matrix

| Component | Kind | Responsibility | Dependent On |
|---|---|---|---|
| `AuthController` | REST Controller | Login endpoint integration (POST /auth/login, /auth/login/totp) | LockoutService, JwtTokenService, TOTPValidator |
| `AccountAdminController` | REST Controller | Admin unlock + lockout status endpoints | LockoutService, UserRepository |
| `PolicyAdminController` | REST Controller | Lockout policy CRUD (system-admin only) | LockoutPolicyRepository, CacheManager |
| `AuditLogController` | REST Controller | Login attempt log queries (admin, system-admin) | LoginAttemptLogRepository |
| `LockoutService` | Core Service | All lockout business logic — the **single source of truth** | UserRepository, LoginAttemptRepository, LockoutPolicyRepository, CacheManager, ApplicationEventPublisher |
| `AutoUnlockScheduler` | Scheduled Component | Periodic scan for expired locks + startup catch-up | LockoutService |
| `TOTPValidator` | Utility | TOTP verification (RFC 6238) — integrated with lockout | LockoutService.recordFailure() |
| `JwtTokenService` | Service | JWT creation + revocation (blacklist via Redis) | LockoutService events |
| `AccountLockedEventListener` | @EventListener | React to AccountLockedEvent → blacklist user JWTs | F-274 token store |
| `RedisCacheConfig` | Configuration | Redis cache manager setup, lockoutPolicy cache setup | Spring Cache abstraction |

---

## 3. Package Structure

```
vn.etc.hanghai.auth/
├── controller/
│   ├── AuthController.java                     # POST /auth/login, POST /auth/login/totp
│   ├── AccountAdminController.java              # PATCH /auth/accounts/{id}/unlock, GET /auth/accounts/{id}/lockout-status
│   ├── PolicyAdminController.java               # GET/PUT /auth/lockout/policy, GET /auth/lockout/stats
│   └── AuditLogController.java                  # GET /auth/attempt-logs (with filters)
│
├── service/
│   ├── LockoutService.java                      # ★ CORE: checkLockout, recordFailure, recordSuccess, unlockAccount, autoUnlockExpired
│   ├── TOTPValidator.java                       # TOTP 2FA verification
│   ├── JwtTokenService.java                     # JWT creation + revocation (F-274 integration)
│   └── AuditLogService.java                     # Thin wrapper for LoginAttemptLog writes
│
├── scheduler/
│   └── AutoUnlockScheduler.java                 # @Scheduled(fixedDelay=300000), ApplicationReadyEvent catch-up
│
├── repository/
│   ├── UserRepository.java                      # Extends M-001 UserRepo — findByUsernameOrEmail, findByLockedUntilNotNullAndLockedUntilBefore
│   ├── LoginAttemptRepository.java              # countFailuresAfter(), save(), findByUserId()
│   ├── LoginAttemptLogRepository.java           # findAllBySpec(), findByUserId(), save()
│   └── LockoutPolicyRepository.java             # findById(1L) — singleton access
│
├── entity/
│   ├── UserLockoutExtension.java                # @Entity or JPA lifecycle hook for loginFailCount, lockedUntil
│   ├── LoginAttempt.java                        # Login attempt record (success/failure)
│   ├── LoginAttemptLog.java                     # Immutable audit log (account_locked/unlocked/warning)
│   └── LockoutPolicy.java                       # Singleton policy configuration
│
├── dto/
│   ├── request/
│   │   ├── LoginRequestDTO.java                 # username, password, totpCode (optional), ipAddress, userAgent
│   │   ├── UnlockRequestDTO.java                # reason, note (optional)
│   │   ├── PolicyUpdateDTO.java                 # maxFailedAttempts, lockoutDurationMinutes, windowMinutes, isEnabled
│   │   └── LogQueryDTO.java                     # userId, eventType, from, to, username (filter params)
│   ├── response/
│   │   ├── LoginResponseDTO.java                # token, user info + error/warning/lockout fields
│   │   ├── LockoutStatusDTO.java                # status(LOCKED/WARNING/OK), lockedUntil, remainingMinutes, failCount
│   │   ├── UnlockResponseDTO.java               # success, userId, username, previousStatus, newStatus, lockedUntil, unlockedAt
│   │   ├── PolicyResponseDTO.java               # maxFailedAttempts, lockoutDurationMinutes, windowMinutes, isEnabled, updatedBy
│   │   ├── LogEntryDTO.java                     # id, userId, username, eventType, triggeredBy, details, occurredAt
│   │   └── LockoutStatsDTO.java                 # totalLocked, totalUnlocked, activeLockouts, topLockedUsers
│   └── enums/
│       ├── LockoutStatus.java                   # LOCKED | WARNING | OK | UNRESTRICTED
│       ├── LockoutResult.java                   # locked | warning | continue
│       └── UnlockResult.java                    # success | not_locked | not_found
│
├── event/
│   ├── AccountLockedEvent.java                  # Spring application event — carries userId
│   └── AccountUnlockedEvent.java                # Spring application event — carries userId, adminUsername
│
├── security/
│   ├── LockoutCheckFilter.java                  # Spring Security filter — runs BEFORE auth, calls checkLockout()
│   ├── LockoutAuthorizationManager.java         # Custom access-decision for admin unlock endpoint (unit-scoped)
│   └── Constants.java                           # Lockout error codes, audit trigger prefixes
│
├── cache/
│   ├── RedisCacheConfig.java                    # CacheManager, RedisTemplate, lockoutPolicy cache setup
│   └── LockoutCacheKeys.java                    # Static cache key constants
│
├── listener/
│   └── AccountLockedEventListener.java          # @EventListener(AccountLockedEvent) → invalidate user JWTs (F-274)
│
├── exception/
│   ├── AccountLockedException.java              # Thrown when account is locked
│   ├── LockoutPolicyNotFoundException.java      # Policy singleton not found (id=1)
│   └── GlobalLockoutExceptionHandler.java       # @RestControllerAdvice — maps exceptions to proper HTTP + JSON responses
│
└── async/
    └── AsyncLoginAttemptWriter.java             # @Async method to write LoginAttempt records (non-blocking)
```

---

## 4. Interface Contracts

### 4.1 LockoutService — Core Interface

```java
/**
 * Central lockout business logic service.
 * All lockout decisions flow through this single class.
 */
public interface LockoutService {

    /**
     * BR-277-05: Check if account is locked before any auth attempt.
     * Returns LockoutStatus — LOCKED, WARNING, OK, or UNRESTRICTED.
     *
     * @param usernameOrEmail lookup key (searches both columns)
     * @return LockoutStatus with lockedUntil and failCount details
     */
    LockoutStatus checkLockout(String usernameOrEmail);

    /**
     * BR-277-01, BR-277-03, BR-277-04: Record a failed login attempt.
     * Atomically increments failCount, evaluates threshold, locks if exceeded.
     * Uses pessimistic row lock to prevent concurrent race conditions.
     *
     * @param user          the authenticated-but-failed user entity
     * @param failureReason why it failed (invalid_credentials, invalid_totp)
     * @return LockoutResult — locked, warning, or continue
     */
    LockoutResult recordFailure(User user, String failureReason);

    /**
     * BR-277-03: Reset failCount on successful login.
     *
     * @param user the successfully authenticated user
     */
    void recordSuccess(User user);

    /**
     * BR-277-06: Admin-initiated manual unlock.
     *
     * @param userId         target user ID
     * @param adminUsername  the admin performing the unlock
     * @param reason         human-readable reason
     * @return UnlockResult with success state
     */
    UnlockResult unlockAccount(Long userId, String adminUsername, String reason);

    /**
     * Auto-unlock entry point for scheduler.
     *
     * @return number of accounts auto-unlocked
     */
    int autoUnlockExpired();

    /**
     * Get current lockout policy (cached).
     */
    LockoutPolicy getPolicy();
}
```

### 4.2 AuthController Contract

```java
@RestController
@RequestMapping("/api/v1/auth")
public interface AuthController {

    /**
     * POST /api/v1/auth/login
     * Unified login endpoint — accepts username/email + password + optional TOTP.
     * Lockout check runs BEFORE credential validation (BR-277-05).
     *
     * Request:  { username, password, totpCode?, ipAddress, userAgent }
     * Response: { token, user } OR { error, message, warning?, lockedUntil?, remainingMinutes?, failCount?, remainingAttempts? }
     * Status:   200 (success) | 401 (invalid credentials) | 403 (account locked)
     */
    ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request);

    /**
     * POST /api/v1/auth/login/totp
     * Step-2 TOTP verification (after password match in step 1).
     * TOTP failure also counts toward failCount (BR-277-01).
     *
     * Request:  { sessionToken, totpCode }
     * Response: { token, user } OR { error, message, warning?, ... }
     * Status:   200 (success) | 401 (invalid TOTP) | 403 (account locked)
     */
    ResponseEntity<LoginResponseDTO> verifyTotp(@RequestBody TotpVerifyDTO request);
}
```

### 4.3 AccountAdminController Contract

```java
@RestController
@RequestMapping("/api/v1/auth/accounts")
@PreAuthorize("hasAnyRole('admin', 'system-admin')")
public interface AccountAdminController {

    /**
     * PATCH /api/v1/auth/accounts/{userId}/unlock
     * Admin unlock — system-admin: all users. admin: unit-scoped users only.
     *
     * Request:  { reason?, note? }
     * Response: { success, userId, username, previousStatus, newStatus, lockedUntil, loginFailCount, unlockedAt, unlockedBy }
     * Status:   200 (success) | 404 (user not found) | 403 (not authorized for this unit)
     */
    ResponseEntity<UnlockResponseDTO> unlockAccount(
            @PathVariable Long userId,
            @RequestBody(required = false) UnlockRequestDTO request);

    /**
     * GET /api/v1/auth/accounts/{userId}/lockout-status
     * View lockout status of a specific user.
     *
     * Response: { userId, username, isLocked, lockedUntil, remainingMinutes, loginFailCount, maxFailedAttempts }
     * Status:   200 (OK) | 404 (not found)
     */
    ResponseEntity<LockoutStatusDTO> getLockoutStatus(@PathVariable Long userId);
}
```

### 4.4 PolicyAdminController Contract

```java
@RestController
@RequestMapping("/api/v1/auth/lockout")
public interface PolicyAdminController {

    /**
     * GET /api/v1/auth/lockout/policy
     * View current lockout policy.
     * Auth: system-admin only.
     *
     * Response: { maxFailedAttempts, lockoutDurationMinutes, windowMinutes, isEnabled, updatedBy, updatedAt }
     * Status:   200 (OK)
     */
    ResponseEntity<PolicyResponseDTO> getPolicy();

    /**
     * PUT /api/v1/auth/lockout/policy
     * Update lockout policy — takes effect immediately (Redis cache eviction).
     * Auth: system-admin only.
     *
     * Request:  { maxFailedAttempts?, lockoutDurationMinutes?, windowMinutes?, isEnabled? }
     * Response: { ...updated fields, updatedBy, updatedAt }
     * Status:   200 (OK) | 400 (validation error)
     */
    ResponseEntity<PolicyResponseDTO> updatePolicy(@RequestBody PolicyUpdateDTO update);

    /**
     * GET /api/v1/auth/lockout/stats
     * Dashboard statistics for lockout events.
     * Auth: admin + system-admin.
     *
     * Response: { totalLocked, totalUnlocked, activeLockouts, recentLockoutsCount, topLockedUsers }
     * Status:   200 (OK)
     */
    ResponseEntity<LockoutStatsDTO> getLockoutStats();
}
```

### 4.5 AuditLogController Contract

```java
@RestController
@RequestMapping("/api/v1/auth/attempt-logs")
@PreAuthorize("hasAnyRole('admin', 'system-admin')")
public interface AuditLogController {

    /**
     * GET /api/v1/auth/attempt-logs
     * Paginated login attempt log list with filters.
     *
     * Query params: userId, eventType, from (ISO-date), to (ISO-date), username, page, size
     * Response: { content: [LogEntryDTO...], totalElements, page, size, totalPages }
     * Status:   200 (OK)
     */
    ResponseEntity<Page<LogEntryDTO>> listLogs(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) LocalDateTime from,
            @RequestParam(required = false) LocalDateTime to,
            @RequestParam(required = false) String username,
            Pageable pageable);

    /**
     * GET /api/v1/auth/attempt-logs/{id}
     * Detail view of a single log entry.
     *
     * Response: LogEntryDTO (full details, including JSON details field)
     * Status:   200 (OK) | 404 (not found)
     */
    ResponseEntity<LogEntryDTO> getLog(@PathVariable Long id);
}
```

---

## 5. LockoutService State Machine

### 5.1 State Diagram

```
                    ┌──────────────┐
                    │  PENDING     │ ← Login attempt received
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │ checkLockout │ ← BR-277-05: is account already locked?
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        LOCKED?       EXISTS?      NOT-LOCKED
              │            │            │
         ┌────▼───┐   ┌───▼─────┐  ┌───▼──────────┐
         │LOCKED  │   │PENDING  │  │ recordFailure│
         │ state  │   │ state  │  │ or recordSuccess│
         └────────┘   └───┬─────┘  └───┬───────────┘
                          │            │
                  ┌───────▼──────┐  ┌───┴───────────┐
                  │ Allow        │  │ FAIL?          │
                  │ account      │  │               │
                  │ creation     │  │ ◄─────────────┤
                  └──────────────┘  │               │
                                    │    ┌──────────▼──────────┐
                                    │    │ failCount >= max?   │
                                    │    └──────────┬──────────┘
                                    │               │
                                    │        ┌──────┴──────┐
                                    │        │             │
                                    │     YES│             │NO
                                    │     ┌──▼──┐    ┌────▼─────┐
                                    │     │LOCKED│    │ WARNING? │
                                    │     │state │    └────┬─────┘
                                    │     └───────┘         │
                                    │                    ┌───┴───┐
                                    │              threshold-1? │
                                    │              ┌───┬───┐    │
                                    │             YES NO     │  │
                                    │        ┌─────▼───┐ ┌──▼───┐
                                    │        │WARNING  │ │ OK   │
                                    │        │state    │ │ state│
                                    │        └─────────┘ └──────┘
                                    │
                              SUCCES?
                                    │
                              ┌─────▼──────┐
                              │  RESET     │ ← failCount → 0 (BR-277-03)
                              │  state     │
                              └────────────┘
```

### 5.2 State Transitions Table

| Current State | Event | Next State | Transition Condition | Action |
|---|---|---|---|---|
| PENDING | checkLockout → lockedUntil > now | LOCKED | BR-277-05 | Return ACCOUNT_LOCKED error |
| PENDING | checkLockout → account exists | PENDING | Normal flow | Proceed to credential check |
| PENDING | checkLockout → account null | UNRESTRICTED | New user registration | Allow account creation (F-271) |
| PENDING | recordFailure → window expired | PENDING | BR-277-04: gap > windowMinutes | Reset failCount to 1 |
| PENDING | recordFailure → failCount < max | WARNING | BR-277-08: at threshold-1 or threshold-2 | Increment failCount, return warning |
| PENDING | recordFailure → failCount >= max | LOCKED | BR-277-01: threshold reached | Set lockedUntil, return LOCKED |
| LOCKED | admin unlock | PENDING | BR-277-06 | Reset failCount=0, lockedUntil=null |
| LOCKED | auto-unlock timer | PENDING | BR-277-02: lockedUntil <= now | Reset failCount=0, lockedUntil=null |
| WARNING | recordSuccess | RESET | BR-277-03 | Reset failCount=0 |
| RESET | PENDING | — | Normal | Clear state, ready for next attempt |

### 5.3 State Properties

```java
public enum LockoutState {
    /** Account is locked — no auth attempts accepted */
    LOCKED {
        @Override public boolean allowsLogin() { return false; }
        @Override public boolean showsWarning() { return false; }
        @Override public int remainingAttempts() { return 0; }
    },
    /** Account approaching lock — warning may be shown */
    WARNING {
        @Override public boolean allowsLogin() { return true; }
        @Override public boolean showsWarning() { return true; }
        @Override public int remainingAttempts() { return maxAttempts - failCount; }
    },
    /** Account clear — no restrictions */
    OK {
        @Override public boolean allowsLogin() { return true; }
        @Override public boolean showsWarning() { return false; }
        @Override public int remainingAttempts() { return maxAttempts - failCount; }
    },
    /** Unrestricted — policy disabled or account not found */
    UNRESTRICTED {
        @Override public boolean allowsLogin() { return true; }
        @Override public boolean showsWarning() { return false; }
        @Override public int remainingAttempts() { return maxAttempts; }
    };

    public abstract boolean allowsLogin();
    public abstract boolean showsWarning();
    public abstract int remainingAttempts();
}
```

---

## 6. Redis Cache-Aside Pattern for LockoutPolicy

### 6.1 Design

```
┌──────────────────────────────────────────────────────┐
│                  LockoutPolicy Cache Flow             │
│                                                       │
│  1. read policy:                                     │
│     ┌─────────┐   hit   ┌──────────┐                │
│     │  Redis  │ ──────► │ Return   │ ──► continue   │
│     │ (cache) │         │ cached   │                │
│     └────┬────┘         │ policy   │                │
│          │ miss          └──────────┘                │
│          ▼                                           │
│     ┌──────────┐   load   ┌──────────┐             │
│     │  MSSQL   │ ──────► │ Put in   │ ──► return  │
│     │  (id=1)  │         │ Redis    │             │
│     └──────────┘         └──────────┘             │
│                                                       │
│  2. write policy (PUT /auth/lockout/policy):         │
│     ┌──────────┐   persist   ┌──────────┐           │
│     │  MSSQL   │ ──────►     │ Evict    │ ──► next │
│     │  (id=1)  │             │ Redis    │     read │
│     └──────────┘             │ (cache    │         │
│                              │  miss →   │         │
│                              │  fresh    │         │
│                              │  data)    │         │
│                              └──────────┘           │
│                                                       │
│  3. TTL fallback: 60s — ensures stale data auto-     │
│     recovers if cache eviction is missed.            │
└──────────────────────────────────────────────────────┘
```

### 6.2 Implementation

```java
@Configuration
@EnableCaching
public class RedisCacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofSeconds(60))       // TTL 60s fallback
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .withInitialCacheConfigurations(Map.of(
                "lockoutPolicy",
                RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofSeconds(60))
            ))
            .build();
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class LockoutPolicyServiceImpl implements LockoutPolicyService {

    private final LockoutPolicyRepository policyRepo;
    private final CacheManager cacheManager;

    /** Cache key constant */
    private static final String CACHE_NAME = "lockoutPolicy";
    private static final String CACHE_KEY = "singleton";

    /**
     * Load policy with cache-aside pattern.
     * Redis hit → return cached.
     * Redis miss → load from DB, populate cache, return.
     */
    @Cacheable(value = CACHE_NAME, key = CACHE_KEY, unless = "#result == null")
    public LockoutPolicy getPolicy() {
        return policyRepo.findById(1L)
                .orElseThrow(() -> new LockoutPolicyNotFoundException("LockoutPolicy singleton not found"));
    }

    /**
     * Evict cache after policy update.
     * Next read will reload fresh data from DB (BR-277-10).
     */
    @CacheEvict(value = CACHE_NAME, key = CACHE_KEY)
    public void evictPolicyCache() {
        // No-op — eviction handled by Spring Cache
    }
}
```

### 6.3 Concurrency Guarantees

| Concern | Mechanism |
|---|---|
| **Stale reads during update** | `@CacheEvict` on policy update — next read misses cache → fresh DB load. TTL 60s is fallback, not the primary invalidation path. |
| **Multiple instances reading DB simultaneously** | First miss loads from DB and populates cache. Subsequent hits within TTL are served from Redis. |
| **Policy change not reflected** | Admin API calls `evictPolicyCache()` after DB write. If evict fails, max staleness is 60s (TTL). |
| **Race between update + read** | Spring CacheManager is thread-safe. `@CacheEvict` is synchronous — update completes before next read can use stale value. |

---

## 7. Auto-Unlock Scheduler

### 7.1 Design

```
┌────────────────────────────────────────────────────────┐
│              AutoUnlockScheduler                        │
│                                                         │
│  @Scheduled(fixedDelay = 300000)  // 5 minutes         │
│                                                         │
│  1. Query: SELECT * FROM users                         │
│     WHERE locked_until IS NOT NULL                      │
│       AND locked_until <= GETUTCDATETIME()              │
│     ORDER BY locked_until ASC                           │
│     (uses index: ix_users_locked_unlock_scan)           │
│                                                         │
│  2. For each expired user:                              │
│     a. SET login_fail_count = 0                         │
│     b. SET locked_until = NULL                          │
│     c. INSERT login_attempt_logs                         │
│        (eventType=account_unlocked, triggeredBy=auto)   │
│                                                         │
│ 3. Log batch summary to audit log                       │
│                                                         │
│ ─── Startup Catch-up ──────────────────────────────────│
│                                                         │
│  @EventListener(ApplicationReadyEvent.class)            │
│  Runs once after app starts — catches up users whose   │
│  lockout expired while server was down.                │
│                                                         │
│  ┌──────────┐   ┌───────────┐   ┌───────────────────┐  │
│  │ Server   │   │ Server    │   │ 5-min job fires   │  │
│  │ starts   │──►│ catches   │──►│  normal schedule  │  │
│  │          │   │ up (1x)   │   │  (recurring)      │  │
│  └──────────┘   └───────────┘   └───────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 7.2 Implementation

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class AutoUnlockScheduler {

    private final LockoutService lockoutService;
    private final LoginAttemptLogRepository loginAttemptLogRepo;

    /**
     * Runs every 5 minutes. Finds all users whose lockout has expired
     * and auto-unlocks them.
     */
    @Scheduled(fixedDelay = 300000, initialDelay = 300000)
    @Transactional
    public void executeAutoUnlock() {
        log.debug("AutoUnlockScheduler: scanning for expired locks...");
        int unlockedCount = lockoutService.autoUnlockExpired();

        if (unlockedCount > 0) {
            log.info("AutoUnlockScheduler: unlocked {} accounts", unlockedCount);
            loginAttemptLogRepo.save(new LoginAttemptLog(
                null, null, null, null,
                "batch_auto_unlock",
                "auto",
                jsonDetails(Map.of("unlockedCount", unlockedCount)),
                null, LocalDateTime.now()
            ));
        } else {
            log.debug("AutoUnlockScheduler: no expired locks found");
        }
    }

    /**
     * On startup — catches up accounts locked while server was down.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void runInitialUnlock() {
        log.info("AutoUnlockScheduler: running initial unlock catch-up...");
        int count = lockoutService.autoUnlockExpired();
        log.info("AutoUnlockScheduler: initial unlock caught up {} accounts", count);
    }
}
```

### 7.3 Scheduling Parameters

| Parameter | Value | Rationale |
|---|---|---|
| `fixedDelay` | 300,000ms (5 min) | Balanced: not too frequent (DB load), not too slow (UX delay) |
| `initialDelay` | 300,000ms (5 min) | Aligns first run with subsequent runs |
| Startup catch-up | `ApplicationReadyEvent` | Ensures no account stays locked longer than necessary after deployment |
| Max batch size | Per transaction | Spring `@Transactional` handles batch; large batches split by transaction boundary |

---

## 8. Admin Unlock Endpoint — Full Flow

### 8.1 Request Flow

```
Admin (system-admin / unit-admin)
        │
        │  PATCH /api/v1/auth/accounts/{userId}/unlock
        │  { "reason": "User verified via hotline", "note": "..." }
        │  Authorization: Bearer <JWT with admin/system-admin role>
        │
        ▼
┌─────────────────────────────┐
│  AccountAdminController     │
│  - Extract userId from path │
│  - Extract admin identity   │
│    from SecurityContext     │
│  - Validate unit-scope      │
│    (admin only)             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  LockoutService             │
│  unlockAccount(userId,     │
│    adminUsername, reason)   │
│                             │
│  1. Load User by ID         │
│  2. Check: is account       │
│     actually locked?        │
│     (lockedUntil > now?)    │
│  3. If not locked →         │
│     return not_locked       │
│  4. Reset:                  │
│     - loginFailCount = 0    │
│     - lockedUntil = NULL    │
│  5. Save User               │
│  6. Write LoginAttemptLog   │
│     (REQUIRES_NEW tx)       │
│  7. Publish                 │
│     AccountUnlockedEvent    │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  AccountUnlockedEventListener│
│  (optional)                 │
│  - Clear Redis cache for    │
│    this user's session      │
│  - Future: send notification│
└──────────┬──────────────────┘
           │
           ▼
  HTTP 200 + UnlockResponseDTO
```

### 8.2 Unit-Scoped Authorization

```java
// AccountAdminController.java — authorization logic
@PatchMapping("/accounts/{userId}/unlock")
@PreAuthorize("@lockoutAuth.canUnlock(authentication, #userId)")
public ResponseEntity<UnlockResponseDTO> unlockAccount(...) {
    // Implementation...
}

// lockoutAuth.spel — SpEL authorization bean
@Component("lockoutAuth")
public class LockoutAuthorization {

    /**
     * system-admin: can unlock any account.
     * admin: can only unlock accounts within their unit/tenant scope.
     */
    public boolean canUnlock(Authentication auth, Long userId) {
        if (auth.hasRole("SYSTEM_ADMIN")) return true;

        // admin: resolve unit scope from SecurityContext
        String unitId = SecurityContextUtil.resolveCurrentUnitId(auth);
        boolean isInRange = userRepository.existsByUserIdAndUnitId(userId, unitId);
        if (!isInRange) {
            log.warn("Admin {} denied unlock of user {} — outside unit scope",
                     auth.getName(), userId);
        }
        return isInRange;
    }
}
```

---

## 9. Concurrent Login Handling

### 9.1 Problem Statement

When a user submits multiple login attempts in rapid succession (e.g., double-click, browser reconnect, multiple tabs), the `loginFailCount` increment is subject to **lost-update race conditions**:

```
Time  Thread A               Thread B
──  ──────────────────────  ──────────────────────
T1  SELECT loginFailCount   —
T2                          SELECT loginFailCount
T3  (e.g., count=3)         (e.g., count=3)
T4  count = 3 + 1 = 4       —
T5                          count = 3 + 1 = 4
T6  UPDATE users SET        —
     loginFailCount = 4
T7                          UPDATE users SET
     loginFailCount = 4  ← LOST UPDATE! Should be 5.
```

### 9.2 Solution: Pessimistic Row Lock

```java
/**
 * recordFailure with pessimistic locking to prevent concurrent
 * lost-update race conditions on the User row.
 *
 * Uses: SELECT ... WHERE id = :userId FOR UPDATE
 * Database: MSSQL supports SELECT ... WITH (UPDLOCK, ROWLOCK)
 */
@Transactional
public LockoutResult recordFailure(User user, String failureReason) {
    // Step 1: Pessimistic lock the User row
    User lockedUser = userRepo.findByIdWithPessimisticLock(user.getId());
    // Generated SQL: SELECT * FROM users WHERE id = ? WITH (UPDLOCK, ROWLOCK)

    LockoutPolicy policy = getPolicy();

    // Step 2: Check window reset (BR-277-04)
    if (isWindowExpired(lockedUser)) {
        lockedUser.setLoginFailCount(1);
    } else {
        lockedUser.setLoginFailCount(lockedUser.getLoginFailCount() + 1);
    }

    // Step 3: Evaluate threshold (BR-277-01)
    if (lockedUser.getLoginFailCount() >= policy.getMaxFailedAttempts()) {
        return lockAccount(lockedUser, policy, "max_attempts_reached");
    }

    // Step 4: Warning at thresholds (BR-277-08)
    String warning = evaluateWarning(lockedUser.getLoginFailCount(), policy);

    userRepo.save(lockedUser);
    return LockoutResult.warning(warning, lockedUser.getLoginFailCount());
}
```

**MSSQL pessimistic lock query (UserRepository):**

```java
public interface UserRepository extends JpaRepository<User, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithPessimisticLock(@Param("id") Long id);

    // Or native:
    @Query(value = "SELECT * FROM users WITH (UPDLOCK, ROWLOCK) WHERE id = @id", nativeQuery = true)
    User findByIdWithPessimisticLockNative(@Param("id") Long id);

    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.username) = LOWER(:username) OR LOWER(u.email) = LOWER(:email))")
    Optional<User> findByUsernameOrEmail(@Param("username") String username,
                                          @Param("email") String email);
}
```

### 9.3 Concurrency Strategy Summary

| Scenario | Strategy | Detail |
|---|---|---|
| Concurrent login attempts (same user) | Pessimistic row lock | `SELECT FOR UPDATE` on User row during `recordFailure()` — prevents lost updates |
| Concurrent admin unlock + login | Transaction isolation + row lock | Admin unlock acquires `UPDLOCK` on User; login attempt blocked until unlock tx commits |
| Concurrent policy updates | Redis cache evict + optimistic | `@CacheEvict` after DB write; no row lock needed (policy is singleton, rarely updated) |
| Concurrent auto-unlock scans | Serializable isolation | 5-min interval + `@Transactional` — only one scheduler runs at a time (Spring `@Scheduled` is single-threaded by default) |
| High-volume login (1000+ TPS) | Async audit logging | LoginAttempt writes are `@Async` — don't block response path |
| Distributed lockout across multiple instances | Redis distributed cache | Shared Redis cache for LockoutPolicy; User row lock is DB-level (single primary) |

### 9.4 Distributed System Considerations

```
┌─────────┐    ┌─────────┐
│ Instance│    │ Instance│
│   A     │    │   B     │
└────┬────┘    └────┬────┘
     │              │
     │  ┌───────────┴───────────┐
     │  │   Shared Redis         │
     │  │   lockoutPolicy cache  │
     │  │   (sub-ms reads)       │
     │  └───────────────────────┘
     │              │
     │  ┌───────────┴───────────┐
     │  │   MSSQL Primary        │
     │  │   (UPDLOCK row locks)  │
     │  │   (serializes writes)  │
     │  └───────────────────────┘
```

- **Cache reads** (LockoutPolicy): shared Redis → all instances see same policy.
- **User row locks**: DB-level `UPDLOCK` serializes concurrent writes even across instances.
- **Lock status reads**: `User.lockedUntil` is DB-backed — always reads fresh data.
- **No distributed lock needed**: DB primary key + row locking handles all contention.

---

## 10. Implementation Task Breakdown

### 10.1 Sprint 1 — Foundation (Priority: P0)

| # | Task | Component | Estimate |
|---|---|---|---|
| T1 | DB Migration script execution | MSSQL | 1d |
| T2 | Entity classes: LoginAttempt, LoginAttemptLog, LockoutPolicy | entity/ | 1d |
| T3 | User entity extension (loginFailCount, lockedUntil fields) | entity/ (M-001) | 0.5d |
| T4 | Repository interfaces: 4 repositories | repository/ | 1d |
| T5 | DTOs: request + response classes | dto/ | 1d |
| T6 | Redis cache config + LockoutPolicyService | cache/, service/ | 0.5d |

### 10.2 Sprint 2 — Core Logic (Priority: P0)

| # | Task | Component | Estimate |
|---|---|---|---|
| T7 | LockoutService: checkLockout() | service/ | 1d |
| T8 | LockoutService: recordFailure() with pessimistic lock | service/ | 1.5d |
| T9 | LockoutService: recordSuccess() | service/ | 0.5d |
| T10 | LockoutService: unlockAccount() | service/ | 1d |
| T11 | LockoutService: autoUnlockExpired() | service/ | 0.5d |
| T12 | State machine enums + result types | dto/enums/ | 0.5d |

### 10.3 Sprint 3 — Integration & Controllers (Priority: P1)

| # | Task | Component | Estimate |
|---|---|---|---|
| T13 | AuthController integration with LockoutService | controller/ | 1.5d |
| T14 | AccountAdminController (unlock + status) | controller/ | 1d |
| T15 | PolicyAdminController (GET/PUT policy) | controller/ | 1d |
| T16 | AuditLogController (log queries) | controller/ | 1d |
| T17 | LockoutCheckFilter (pre-authentication check) | security/ | 1d |
| T18 | TOTPValidator integration (TOTP failure counts) | service/ | 0.5d |

### 10.4 Sprint 4 — Supporting Features (Priority: P2)

| # | Task | Component | Estimate |
|---|---|---|---|
| T19 | AutoUnlockScheduler + startup catch-up | scheduler/ | 0.5d |
| T20 | AccountLockedEventListener (JWT invalidation) | listener/ | 0.5d |
| T21 | GlobalLockoutExceptionHandler | exception/ | 0.5d |
| T22 | AsyncLoginAttemptWriter | async/ | 0.5d |
| T23 | Unit-scoped authorization (lockoutAuth) | security/ | 0.5d |
| T24 | LockoutStats endpoint | controller/ | 0.5d |

### 10.5 Sprint 5 — Testing & Hardening (Priority: P1)

| # | Task | Component | Estimate |
|---|---|---|---|
| T25 | Unit tests: LockoutService state transitions | service/ | 2d |
| T26 | Unit tests: windowMinutes logic, threshold warnings | service/ | 1d |
| T27 | Integration tests: full login flow (success + failure + lockout) | service/ | 1.5d |
| T28 | Integration tests: admin unlock flow | service/ | 0.5d |
| T29 | Concurrent login test (race condition verification) | service/ | 1d |
| T30 | E2E tests: frontend lockout display | frontend/ | 1d |
| T31 | Performance test: 1000+ concurrent logins | service/ | 0.5d |
| T32 | Security test: timing attack, role bypass | security/ | 0.5d |

**Total Estimate: ~28 working days (~5.5 weeks for 1 developer, or ~2 weeks for a 2-person team)**

---

## 11. Testing Matrix

### 11.1 Unit Tests (LockoutService)

| Test ID | Scenario | Expected |
|---|---|---|
| UT-01 | checkLockout → account not found | `UNRESTRICTED` |
| UT-02 | checkLockout → lockedUntil > now | `LOCKED` with remainingMinutes |
| UT-03 | checkLockout → lockedUntil <= now (expired) | `OK` (auto-transitioned) |
| UT-04 | checkLockout → policy disabled | `UNRESTRICTED` |
| UT-05 | recordFailure → first failure (count=1) | `WARNING` = null, count=1 |
| UT-06 | recordFailure → threshold-2 (count=3) | `WARNING` = "2 remaining" |
| UT-07 | recordFailure → threshold-1 (count=4) | `WARNING` = "1 remaining" |
| UT-08 | recordFailure → threshold (count=5) | `LOCKED` with lockedUntil = now+30min |
| UT-09 | recordFailure → window expired → reset | count=1 (not count=4) |
| UT-10 | recordSuccess → resets count to 0 | count=0 |
| UT-11 | unlockAccount → locked user | `success`, audit log written |
| UT-12 | unlockAccount → already unlocked | `not_locked` |
| UT-13 | autoUnlockExpired → expired users | count > 0, logs written |
| UT-14 | autoUnlockExpired → no expired | count = 0 |

### 11.2 Integration Tests

| Test ID | Scenario | Flow |
|---|---|---|
| IT-01 | 5 consecutive failures → account locked | POST /auth/login x5 (wrong pwd) → 403 + ACCOUNT_LOCKED |
| IT-02 | Lockout persists across session | Lock account → clear cookie → retry → still 403 |
| IT-03 | Admin unlock → login succeeds | Lock → admin unlock → POST /auth/login (correct pwd) → 200 |
| IT-04 | Correct password while locked → rejected | Lock account → POST /auth/login (correct pwd) → 403 |
| IT-05 | WindowMinutes reset → 16-min gap | Fail T=0, T=16min → count resets to 1 |
| IT-06 | Policy change takes effect immediately | Update policy (max=3) → next failure at count=3 locks |
| IT-07 | TOTP failure counts toward lockout | Password OK + TOTP wrong → recordFailure called |
| IT-08 | LoginAttemptLog immutable | Try UPDATE/DELETE on log → SQL error (trigger blocks) |

### 11.3 Concurrency Tests

| Test ID | Scenario | Expected |
|---|---|---|
| CT-01 | 10 concurrent login failures (same user) | count = 10 (or max, whichever first), no lost updates |
| CT-02 | 5 failures + 1 unlock (concurrent) | unlock wins, count = 0 |
| CT-03 | 1000 concurrent login attempts (different users) | All succeed, < 2s response, no lockout errors |

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| High DB load from LoginAttempt inserts at peak | Medium | High | Async @Async writes, monthly partitioning, 90-day retention |
| Redis outage → policy fallback to DB only | Low | Medium | Redis TTL 60s fallback; DB read still functional (no cache dependency) |
| Lockout blocks legitimate users (friendly fraud) | Medium | Medium | Admin unlock endpoint available; clear messaging; 30-min window is short |
| Pessimistic lock causes login latency under high concurrency | Low | Medium | DB index on PK ensures fast lock acquisition; lock held only within single transaction |
| Auto-unlock 5-min precision insufficient | Medium | Low | Accept for MVP; startup catch-up minimizes impact; future: delayed message queue |
| MSSQL trigger blocks unexpected updates to LockoutPolicy | Low | Low | Trigger is a safety net; normal updates go through application layer |

---

## 13. Acceptance Criteria Verification

| # | Criterion | Verification Method | Status |
|---|---|---|---|
| AC-1 | Warning at threshold-2 (3 failures) | UT-06 + IT-01 + E2E | Pending |
| AC-2 | Warning at threshold-1 (4 failures) | UT-07 + IT-01 + E2E | Pending |
| AC-3 | Account locked after 5 failures | UT-08 + IT-01 | Pending |
| AC-4 | Auto-unlock after 30 minutes | UT-13 + IT-01 (simulated time) | Pending |
| AC-5 | Admin can manually unlock | UT-11 + IT-02 + E2E | Pending |
| AC-6 | All login events recorded | IT-08 + unit test log write | Pending |
| AC-7 | FailCount resets on success | UT-10 + IT-03 | Pending |
| AC-8 | WindowMinutes resets after 15-min gap | UT-09 + IT-05 | Pending |
| AC-9 | Locked account rejects even correct credentials | IT-04 | Pending |
| AC-10 | Lockout applies to all roles | IT-01 (test with admin/system-admin roles) | Pending |
| AC-11 | Policy change takes effect immediately | IT-06 | Pending |
| AC-12 | Audit log immutable | IT-08 | Pending |

---

## 14. Migration & Rollback Plan

### 14.1 Forward Migration (DB)

1. Execute migration script from SA `feature-design.md` section 4
2. Verify all 4 tables created: `users` (extended), `login_attempts`, `login_attempt_logs`, `lockout_policies`
3. Verify default policy row inserted (id=1, maxFailedAttempts=5, lockoutDurationMinutes=30, windowMinutes=15, isEnabled=true)
4. Verify triggers active: `trg_login_attempt_logs_no_mod`, `trg_lockout_policies_singleton`

### 14.2 Rollback Plan

| Scenario | Rollback Action |
|---|---|
| Migration fails | Script is idempotent (`IF NOT EXISTS` guards). Safe to re-run. |
| Feature causes auth outage | Disable LockoutService: set `LockoutPolicy.isEnabled = false` → all checks return `UNRESTRICTED` |
| DB data corruption | Audit log is append-only (immutable trigger). LoginAttempt can be truncated and re-populated if needed. |
| Redis cache corruption | TTL (60s) auto-evicts. No persistent risk. |

---

## 15. Frontend Task Notes (ReactJS)

| Task | Component | Notes |
|---|---|---|
| FFE-01 | `LoginLockoutBanner` | Shows danger alert when ACCOUNT_LOCKED response received |
| FFE-02 | `LoginWarningBanner` | Shows warning alert at threshold-1 and threshold-2 |
| FFE-03 | Login form: disable submit on LOCKED | Disable input fields, show countdown timer |
| FFE-04 | Admin: LockoutStatusCard | Shows current lock state + unlock button (system-admin only) |
| FFE-05 | Admin: LockoutLogViewer | Paginated table of audit logs with filters (date range, event type, user) |
| FFE-06 | Admin: LockoutPolicyEditor | Inline form to adjust maxFailedAttempts, lockoutDurationMinutes, windowMinutes |

---

*End of Implementation Plan — F-277 Tech-lead Handoff*
