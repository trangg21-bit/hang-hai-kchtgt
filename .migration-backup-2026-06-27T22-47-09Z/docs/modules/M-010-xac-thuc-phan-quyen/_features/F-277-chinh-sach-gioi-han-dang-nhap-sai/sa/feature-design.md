---
id: F-277
name: Chính sách giới hạn đăng nhập sai
slug: chinh-sach-gioi-han-dang-nhap-sai
module-id: M-010
stage: system-architect
status: in_development
created: 2026-06-23T00:00:00Z
last-updated: 2026-06-23T08:21:13Z
---
# SA Stage: F-277 — Chính sách giới hạn đăng nhập sai

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 LoginAttempt

Ghi nhận **từng lần thử đăng nhập** (thành công hoặc thất bại), làm dữ liệu nguồn cho việc đếm fail count và audit trail.

```java
@Entity
@Table(name = "login_attempts", indexes = {
    @Index(name = "idx_login_attempts_user_id", columnList = "user_id"),
    @Index(name = "idx_login_attempts_username", columnList = "username"),
    @Index(name = "idx_login_attempts_result", columnList = "result"),
    @Index(name = "idx_login_attempts_occurred_at", columnList = "occurred_at")
})
public class LoginAttempt {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "user_id") private Long userId;        // null cho lần đầu (chưa có account)
    @Column(name = "username", length = 150, nullable = false) private String username;
    @Column(name = "email", length = 255, nullable = false) private String email;

    @Column(name = "ip_address", length = 45) private String ipAddress;  // IPv4 or IPv6
    @Column(name = "user_agent", length = 500) private String userAgent;

    @Column(name = "result", length = 10, nullable = false, columnDefinition = "VARCHAR(10)")
    private String result;  // success | failure

    @Column(name = "failure_reason", length = 100) private String failureReason;
    // invalid_credentials | invalid_totp | account_locked | invalid_2fa

    @Column(name = "auth_type", length = 30) private String authType;
    // password_only | password_and_totp | totp_only

    @Column(name = "occurred_at") private LocalDateTime occurredAt;

    @PrePersist void onCreate() {
        occurredAt = LocalDateTime.now();
    }
}
```

**Indexes rationale:**
- `idx_login_attempts_username` — lookup nhanh khi check fail count (BR-277-04: theo username/email)
- `idx_login_attempts_user_id` — join với User table khi cần metadata
- `idx_login_attempts_result` — filter nhanh success/failure cho thống kê
- `idx_login_attempts_occurred_at` — range queries cho windowMinutes check (BR-277-04)

### 1.2 LoginAttemptLog

Nhật ký **chuyên biệt cho audit khóa/mở khóa**, mở rộng của LoginAttempt. Bảng **immutable** — không cho phép UPDATE/DELETE.

```java
@Entity
@Table(name = "login_attempt_logs", indexes = {
    @Index(name = "idx_login_attempt_log_user_id", columnList = "user_id"),
    @Index(name = "idx_login_attempt_log_event_type", columnList = "event_type"),
    @Index(name = "idx_login_attempt_log_occurred_at", columnList = "occurred_at"),
    @Index(name = "idx_login_attempt_log_login_attempt_id", columnList = "login_attempt_id")
})
public class LoginAttemptLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "login_attempt_id") private Long loginAttemptId;
    // FK đến LoginAttempt (nullable cho manual unlock)

    @Column(name = "user_id") private Long userId;
    @Column(name = "username", length = 150) private String username;

    @Column(name = "event_type", length = 30, nullable = false, columnDefinition = "VARCHAR(30)")
    private String eventType;  // account_locked | account_unlocked | threshold_warning

    @Column(name = "triggered_by", length = 100) private String triggeredBy;
    // system | admin:{admin_id} | auto (auto-unlock timer)

    @Column(name = "details", columnDefinition = "JSON") private String details;
    // {"reason":"5 consecutive failures","lockDurationMinutes":30,"failCount":5}
    // hoặc {"reason":"manual unlock by admin","adminId":42,"adminUsername":"admin01"}

    @Column(name = "ip_address", length = 45) private String ipAddress;
    @Column(name = "occurred_at") private LocalDateTime occurredAt;

    @PrePersist void onCreate() {
        occurredAt = LocalDateTime.now();
    }
}
```

**Immutable guarantee (BR-277-07):**
- Không có `@PreUpdate` lifecycle method
- Không có service method nào thực hiện UPDATE/DELETE trên bảng này
- Database-level constraint: thêm trigger ` trg_login_attempt_logs_no_mod` ngăn UPDATE/DELETE
- LoginAttemptLog là **append-only audit table**

### 1.3 LockoutPolicy

Cấu hình **chính sách lockout hệ thống**, lưu cài đặt toàn cục có thể điều chỉnh runtime.

```java
@Entity
@Table(name = "lockout_policies")
public class LockoutPolicy {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "max_failed_attempts", nullable = false, columnDefinition = "INT DEFAULT 5")
    private Integer maxFailedAttempts = 5;  // BR-277-01

    @Column(name = "lockout_duration_minutes", nullable = false, columnDefinition = "INT DEFAULT 30")
    private Integer lockoutDurationMinutes = 30;  // BR-277-02

    @Column(name = "window_minutes", nullable = false, columnDefinition = "INT DEFAULT 15")
    private Integer windowMinutes = 15;  // BR-277-04

    @Column(name = "is_enabled", columnDefinition = "BIT DEFAULT 1")
    private Boolean isEnabled = true;

    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "updated_by", length = 100) private String updatedBy;
    // admin username hoặc "system"

    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isEnabled == null) isEnabled = true;
    }
    @PreUpdate void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

**Design note:** Chỉ có **1 bản ghi** — `id = 1` là bản ghi duy nhất. Admin điều chỉnh qua API `PUT /api/v1/auth/lockout/policy`. Không cần lookup — load từ cache (Redis hoặc in-memory) khi khởi động, invalidate khi có thay đổi.

### 1.4 User (extension — bổ sung từ M-001/F-001)

Bảng User hiện có (từ M-001) cần **bổ sung 2 field** cho lockout tracking:

```sql
-- Migration: bổ sung field vào bảng users (hoặc app_users / tenant_users)
ALTER TABLE users ADD COLUMN login_fail_count INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME2 NULL;
```

```java
// Extension trong entity User (M-001)
@Column(name = "login_fail_count", columnDefinition = "INT DEFAULT 0")
private Integer loginFailCount = 0;

@Column(name = "locked_until")
private LocalDateTime lockedUntil;  // null = không bị khóa
```

### 1.5 Relationship Diagram

```
User 1──N LoginAttempt    (userId — foreign key)
User 1──N LoginAttemptLog (userId — foreign key)
LoginAttempt 1──1 LoginAttemptLog (loginAttemptId — optional FK, nullable cho manual unlock)
LockoutPolicy 1──1 (singleton row — id = 1)
```

---

## 2. API Endpoints

All endpoints prefixed with `/api/v1/auth/`. Authentication via JWT Bearer token.

### 2.1 Authentication (Login Flow — tích hợp F-277 logic)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Đăng nhập (credentials + TOTP nếu có) | Public |
| POST | `/api/v1/auth/login/totp` | Xác thực TOTP bước 2 (sau password match) | Public (session token) |

**Response extensions cho lockout (BR-277-05, BR-277-08):**

```json
// Khi tài khoản bị khóa (BR-277-05)
{
  "error": "ACCOUNT_LOCKED",
  "message": "Tài khoản đã bị khóa. Vui lòng thử lại sau 30 phút hoặc liên hệ quản trị viên",
  "lockedUntil": "2026-06-23T01:30:00Z",
  "remainingMinutes": 28
}

// Khi còn 1 lần sai trước khi khóa (BR-277-08, threshold 4)
{
  "error": "INVALID_CREDENTIALS",
  "message": "Sai thông tin đăng nhập",
  "warning": "Bạn còn 1 lần đăng nhập sai trước khi tài khoản bị khóa",
  "remainingAttempts": 1,
  "failCount": 4,
  "maxFailedAttempts": 5
}

// Khi còn 2 lần sai trước khi khóa (BR-277-08, threshold 3)
{
  "error": "INVALID_CREDENTIALS",
  "message": "Sai thông tin đăng nhập",
  "warning": "Bạn còn 2 lần đăng nhập sai trước khi tài khoản bị khóa",
  "remainingAttempts": 2,
  "failCount": 3,
  "maxFailedAttempts": 5
}
```

### 2.2 Admin — Account Unlock

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| PATCH | `/api/v1/auth/accounts/{userId}/unlock` | Mở khóa tài khoản | admin / system-admin |
| GET | `/api/v1/auth/accounts/{userId}/lockout-status` | Xem trạng thái khóa của tài khoản | admin / system-admin |

**Admin unlock request:**

```json
// PATCH /api/v1/auth/accounts/{userId}/unlock — Request body
{
  "reason": "Yêu cầu từ người dùng đã xác minh",
  "note": "Admin xác minh danh tính qua hotline"
}
// Nếu không có body → mặc định "Manual unlock by admin"
```

**Admin unlock response:**

```json
{
  "success": true,
  "userId": 142,
  "username": "nguyen.van.a",
  "previousStatus": "locked",
  "newStatus": "active",
  "lockedUntil": null,
  "loginFailCount": 0,
  "unlockedAt": "2026-06-23T00:45:00Z",
  "unlockedBy": "admin:admin01"
}
```

### 2.3 Admin — Login Attempt Log (BR-277-06)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/auth/attempt-logs` | Danh nhật ký khóa/mở khóa (phân trang) | admin / system-admin |
| GET | `/api/v1/auth/attempt-logs/{id}` | Chi tiết 1 entry | admin / system-admin |
| GET | `/api/v1/auth/attempt-logs?userId=&eventType=&from=&to=&username=` | Bộ lọc đa chiều | admin / system-admin |
| GET | `/api/v1/auth/attempt-logs?userId={userId}` | Nhật ký khóa của 1 user cụ thể | admin (own unit), system-admin (all) |

### 2.4 Admin — Lockout Policy Management (BR-277-10)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/auth/lockout/policy` | Xem chính sách lockout hiện tại | system-admin |
| PUT | `/api/v1/auth/lockout/policy` | Cập nhật chính sách lockout | system-admin |
| GET | `/api/v1/auth/lockout/stats` | Thống kê khóa/mở khóa (dashboard) | admin / system-admin |

**Lockout policy update request:**

```json
// PUT /api/v1/auth/lockout/policy — Request body
{
  "maxFailedAttempts": 5,
  "lockoutDurationMinutes": 30,
  "windowMinutes": 15,
  "isEnabled": true
}
// System-admin chỉ điều chỉnh được, admin không có quyền (BR-277-10)
```

---

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS Login Page
    │
    ├── AuthController (POST /auth/login, POST /auth/login/totp)
    │       ├── AuthService ──► UserAuthService (credentials) ──► BCrypt
    │       ├── LockoutService ──► checkLockout() ──► LockoutPolicy (cached)
    │       │       ├── read User.loginFailCount + User.lockedUntil
    │       │       ├── evaluate fail count vs maxFailedAttempts
    │       │       ├── evaluate windowMinutes (BR-277-04)
    │       │       └── return: LOCKED / WARNING / OK
    │       ├── TOTPValidator ──► google-authenticator lib (RFC 6238)
    │       └── JwtTokenService ──► io.jsonwebtoken (JWT creation)
    │
    ├── AccountAdminController (admin unlock)
    │       ├── AccountAdminService ──► UserRepository
    │       │       ├── reset loginFailCount = 0
    │       │       ├── set lockedUntil = null
    │       │       └── write LoginAttemptLog (eventType=account_unlocked)
    │       └── AuditLogService ──► LoginAttemptLogRepository ──► MSSQL
    │
    ├── PolicyAdminController (lockout policy config)
    │       ├── PolicyAdminService ──► LockoutPolicyRepository
    │       │       ├── UPDATE lockout_policies SET ...
    │       │       └── Invalidate Redis cache key "lockout:policy:singleton"
    │       └── AuditLogService ──► LoginAttemptLogRepository
    │
    └── AutoUnlockScheduler (@Scheduled)
            └── find Users WHERE lockedUntil <= NOW() AND lockedUntil IS NOT NULL
                └── reset lock + write LoginAttemptLog (eventType=account_unlocked, triggeredBy=auto)
```

**Key interactions:**

- `LockoutService` là **core business logic** — được gọi từ cả `AuthController` (login flow) và `TOTPValidator` (TOTP step)
- `LockoutPolicy` được load từ cache Redis (TTL 1 phút) hoặc in-memory khi khởi động — thay đổi qua API cập nhật cache ngay lập tức (BR-277-10: không cần restart service)
- `AutoUnlockScheduler` chạy mỗi 5 phút — tìm user có `lockedUntil <= NOW()` và tự động mở khóa
- `LoginAttemptLog` ghi bằng `@Transactional(propagation = REQUIRES_NEW)` — audit log phải survive main transaction rollback
- Login attempt recording (LoginAttempt) được ghi **async** qua `@Async` để không ảnh hưởng response latency

### 3.2 Core Service: LockoutService

```java
@Service
@RequiredArgsConstructor
public class LockoutService {

    private final UserRepository userRepo;
    private final LoginAttemptRepository loginAttemptRepo;
    private final LoginAttemptLogRepository loginAttemptLogRepo;
    private final LockoutPolicyRepository policyRepo;
    private final CacheManager cacheManager;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * BR-277-05: Kiểm tra tài khoản có bị khóa không.
     * Gọi trước bất kỳ auth attempt nào.
     */
    public LockoutStatus checkLockout(String usernameOrEmail) {
        LockoutPolicy policy = getPolicy();
        if (!policy.getIsEnabled()) return LockoutStatus.UNRESTRICTED;

        User user = userRepo.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElse(null);
        if (user == null) return LockoutStatus.UNRESTRICTED; // account chưa tồn tại

        // BR-277-05: lockedUntil > now → locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            return LockoutStatus.LOCKED(
                user.getLockedUntil(),
                user.getLoginFailCount()
            );
        }

        // BR-277-04: Reset nếu windowMinutes đã trôi qua
        if (isWindowExpired(user)) {
            resetFailCount(user);
        }

        return LockoutStatus.UNRESTRICTED;
    }

    /**
     * BR-277-01, BR-277-03, BR-277-04: Xử lý failed attempt.
     * @return LockoutResult với state machine transition info
     */
    @Transactional
    public LockoutResult recordFailure(User user, String failureReason) {
        LockoutPolicy policy = getPolicy();

        // BR-277-04: Check window reset
        if (isWindowExpired(user)) {
            user.setLoginFailCount(1);
        } else {
            user.setLoginFailCount(user.getLoginFailCount() + 1);
        }

        // BR-277-01: Check threshold
        if (user.getLoginFailCount() >= policy.getMaxFailedAttempts()) {
            return lockAccount(user, policy, "max_attempts_reached");
        }

        // BR-277-08: Warning at threshold -1 and -2
        int warningThreshold = policy.getMaxFailedAttempts() - 1;
        int warningThreshold2 = policy.getMaxFailedAttempts() - 2;
        String warning = null;
        if (user.getLoginFailCount() == warningThreshold) {
            warning = "Bạn còn 1 lần đăng nhập sai trước khi tài khoản bị khóa";
        } else if (user.getLoginFailCount() == warningThreshold2) {
            warning = "Bạn còn 2 lần đăng nhập sai trước khi tài khoản bị khóa";
        }

        userRepo.save(user);
        return LockoutResult.warning(warning, user.getLoginFailCount());
    }

    /**
     * BR-277-03: Reset fail count trên đăng nhập thành công.
     */
    @Transactional
    public void recordSuccess(User user) {
        user.setLoginFailCount(0);
        userRepo.save(user);
    }

    /**
     * BR-277-06: Admin unlock.
     */
    @Transactional
    public UnlockResult unlockAccount(Long userId, String adminUsername, String reason) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Chỉ unlock nếu đang bị khóa
        if (user.getLockedUntil() == null || user.getLockedUntil().isBefore(LocalDateTime.now())) {
            return UnlockResult.notLocked(user);
        }

        user.setLoginFailCount(0);
        user.setLockedUntil(null);
        userRepo.save(user);

        // BR-277-07: Audit log
        loginAttemptLogRepo.save(new LoginAttemptLog(
            null, null, userId, user.getUsername(),
            "account_unlocked",
            "admin:" + adminUsername,
            jsonDetails(Map.of("reason", reason, "adminUsername", adminUsername)),
            null, LocalDateTime.now()
        ));

        // Invalidate session (F-274 integration)
        eventPublisher.publishEvent(new AccountUnlockedEvent(userId, adminUsername));

        return UnlockResult.success(user, adminUsername, reason);
    }

    /**
     * Auto-unlock scheduler entry point.
     */
    @Transactional
    public int autoUnlockExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<User> expiredUsers = userRepo.findByLockedUntilNotNullAndLockedUntilBefore(now);

        for (User user : expiredUsers) {
            user.setLoginFailCount(0);
            user.setLockedUntil(null);
            userRepo.save(user);

            loginAttemptLogRepo.save(new LoginAttemptLog(
                null, null, user.getId(), user.getUsername(),
                "account_unlocked",
                "auto",
                jsonDetails(Map.of("reason", "auto_unlock_after_duration",
                                   "lockDurationMinutes", getPolicy().getLockoutDurationMinutes())),
                null, now
            ));
        }

        return expiredUsers.size();
    }

    private boolean isWindowExpired(User user) {
        LockoutPolicy policy = getPolicy();
        // Query: last failure within windowMinutes
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(policy.getWindowMinutes());
        long recentFailures = loginAttemptRepo.countFailuresAfter(user.getId(), windowStart);
        return recentFailures == 0;
    }

    private LockoutResult lockAccount(User user, LockoutPolicy policy, String reason) {
        LocalDateTime lockedUntil = LocalDateTime.now().plusMinutes(policy.getLockoutDurationMinutes());
        user.setLockedUntil(lockedUntil);
        userRepo.save(user);

        // BR-277-07: Audit log
        loginAttemptLogRepo.save(new LoginAttemptLog(
            null, null, user.getId(), user.getUsername(),
            "account_locked",
            "system",
            jsonDetails(Map.of(
                "reason", reason,
                "failCount", user.getLoginFailCount(),
                "lockDurationMinutes", policy.getLockoutDurationMinutes(),
                "maxFailedAttempts", policy.getMaxFailedAttempts()
            )),
            null, LocalDateTime.now()
        ));

        // F-274: Invalidate all active JWT sessions
        eventPublisher.publishEvent(new AccountLockedEvent(user.getId()));

        return LockoutResult.locked(lockedUntil, policy.getLockoutDurationMinutes());
    }

    private LockoutPolicy getPolicy() {
        // Cache-first: Redis → DB (singleton row id=1)
        return cacheManager.getCache("lockoutPolicy")
                .get("singleton", LockoutPolicy.class)
                .orElseGet(() -> {
                    LockoutPolicy p = policyRepo.findById(1L).orElseThrow();
                    cacheManager.getCache("lockoutPolicy").put("singleton", p);
                    return p;
                });
    }
}
```

### 3.3 Auto-Unlock Scheduler Design

```java
@Component
@RequiredArgsConstructor
public class AutoUnlockScheduler {

    private final LockoutService lockoutService;
    private final LoginAttemptLogRepository loginAttemptLogRepo;

    /**
     * Chạy mỗi 5 phút — tìm và unlock các tài khoản đã hết thời gian khóa.
     * Cơ chế đơn giản: scan-based (single-hop, không cần DAG — BR-277-02 là time-based).
     */
    @Scheduled(fixedDelay = 300000) // 5 phút
    @Transactional
    public void executeAutoUnlock() {
        int unlockedCount = lockoutService.autoUnlockExpired();

        if (unlockedCount > 0) {
            // Log cho operations dashboard
            loginAttemptLogRepo.save(new LoginAttemptLog(
                null, null, null, null,
                "batch_auto_unlock",
                "auto",
                jsonDetails(Map.of("unlockedCount", unlockedCount)),
                null, LocalDateTime.now()
            ));
        }
    }

    /**
     * Optional: one-shot on startup for servers that have been down.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void runInitialUnlock() {
        log.info("Running initial auto-unlock on startup...");
        int count = lockoutService.autoUnlockExpired();
        log.info("Auto-unlocked {} accounts on startup", count);
    }
}
```

**Alternative: event-driven unlock (future optimization):**

Nếu cần chính xác hơn (không wait 5 phút), có thêm một `Scheduled` job chạy ngay tại `lockedUntil` timestamp bằng cách:
- Khi lock account, schedule một `ScheduledTask` vào thời điểm `lockedUntil`
- Task đó tự động thực hiện unlock + viết audit log
- Ưu điểm: chính xác đến giây; nhược điểm: phức tạp hơn, cần task persistence

### 3.4 Login Flow State Machine

```
                    ┌───────────────────┐
                    │   Login Request    │
                    └─────────┬─────────┘
                              │
                   ┌──────────▼──────────┐
                   │  checkLockout()     │
                   │  BR-277-05 check    │
                   └──────────┬──────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         LOCKED?          VALID?          ACCOUNT?
              │               │             MISSING?
              │               │               │
        ┌─────▼─────┐   ┌────▼────┐    ┌─────▼──────┐
        │ REJECT    │   │Check    │    │ Allow       │
        │ ACCOUNT_  │   │Password │    │ creation    │
        │ LOCKED    │   │match   │    │ (F-271)     │
        └───────────┘   └────┬────┘    └─────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
         MATCH?          MISMATCH?      HAS_TOTP?
              │              │              │
        ┌─────▼─────┐  ┌───▼───────────┐   │
        │  record   │  │ recordFailure │   │
        │  Success  │  │ (BR-277-01,03)│   │
        │  (BR-277-03)│ └───┬───────────┘   │
        └─────┬─────┘     │                 │
              │           │            ┌────▼────┐
              │     ┌─────▼──────┐     │ Require │
              │     │ >= Max     │     │ TOTP    │
              │     │ Attempts?  │     │ Step    │
              │     └─────┬──────┘     └────┬────┘
              │           │                  │
         ┌────▼────┐  ┌──▼───┐          ┌───▼──────────┐
         │ Issue  │  │ Warning │         │ TOTP Verify  │
         │ JWT    │  │ (BR-277│         │ (BR-273-03)  │
         │ Token  │  │ -08)   │         └───┬──────────┘
         └────────┘  └────────┘             │
                                    ┌───────┼───────┐
                                    │       │       │
                               VALID?  INVALID?  ACCOUNT?
                                    │       │      LOCKED?
                              ┌─────▼────┐  ┌▼────────┐
                              │ record  │  │ record  │
                              │ Success │  │ Failure │
                              └─────┬────┘  └┬────────┘
                                    │       │
                               ┌──────▼──────┐
                               │ Issue JWT   │
                               │ Token       │
                               └─────────────┘
```

### 3.5 Design Patterns

| Pattern | Application |
|---|---|
| **Service Layer** | `LockoutService` — single responsibility, all lockout business logic isolated |
| **Repository Pattern** | `UserRepository`, `LoginAttemptRepository`, `LoginAttemptLogRepository`, `LockoutPolicyRepository` |
| **DTO Pattern** | `LoginRequestDTO`, `LoginResponseDTO`, `LockoutStatusDTO`, `UnlockRequestDTO`, `UnlockResponseDTO`, `PolicyConfigDTO` |
| **Cache-Aside Pattern** | `LockoutPolicy` cached in Redis — `@CacheEvict` on policy update (BR-277-10) |
| **Event-Driven Pattern** | `AccountLockedEvent` → F-274 session invalidation; `AccountUnlockedEvent` → notification (future) |
| **Specification Pattern** | `LoginAttemptLogSpecification` — composable filters for admin log queries |
| **Scheduled Task Pattern** | `AutoUnlockScheduler` — periodic scan for expired locks |
| **Immutable Log Pattern** | `LoginAttemptLog` — append-only, no update/delete (BR-277-07) |
| **State Machine Pattern** | Login attempt state: `PENDING → SUCCESS/FAILURE → LOCKED/WARNING → RESET` |

### 3.6 Transaction Boundaries

| Operation | Transaction Mode | Rationale |
|---|---|---|
| `recordFailure()` | `@Transactional` (REQUIRED) | Must atomically update failCount + evaluate lock threshold |
| `lockAccount()` | `@Transactional` (REQUIRED) | Atomic: set lockedUntil + write LoginAttemptLog |
| `recordSuccess()` | `@Transactional` (REQUIRED) | Atomic: reset failCount |
| `unlockAccount()` | `@Transactional` (REQUIRED) | Atomic: reset + audit log + event publish |
| `autoUnlockExpired()` | `@Transactional` (REQUIRED) | Batch reset + audit logs in single transaction |
| Login attempt recording | `@Async` + `@Transactional(propagation = REQUIRES_NEW)` | Non-blocking for login response; survives rollback |
| LoginAttemptLog writes | `@Transactional(propagation = REQUIRES_NEW)` | Audit log must persist even if main auth transaction fails |

### 3.7 Security Considerations

```
Credential Security:
├─ BCrypt with cost factor >= 12 (từ F-276)
├─ Constant-time comparison cho TOTP (ngăn timing attack)
├─ Generic error message: "Sai thông tin đăng nhập" (BR-277-02)
│   └─ Không phân biệt "email không tồn tại" vs "mật khẩu sai"
└─ LoginAttemptLog immutable: không cho phép modify/delete

Lockout Security:
├─ Check lockout BEFORE credential validation (BR-277-05)
│   └─ Prevents attacker from probing valid/invalid accounts
├─ Username-based lookup (không email-only)
│   └─ Prevents bypass via email alias switching
├─ WindowMinutes enforcement (BR-277-04)
│   └─ Dictionary attack spread across window → no lockout
└─ Same lockout for ALL roles (BR-277-09)
    └─ No role-based bypass
```

### 3.8 Database Indexes & Performance

**Tables and indexes:**

| Table | Indexes | Purpose |
|---|---|---|
| `login_attempts` | `idx_login_attempts_user_id` | JOIN + fail count aggregation |
| `login_attempts` | `idx_login_attempts_username` | Lookup by username/email |
| `login_attempts` | `idx_login_attempts_result` | Filter success/failure |
| `login_attempts` | `idx_login_attempts_occurred_at` | WindowMinutes range query |
| `login_attempt_logs` | `idx_login_attempt_log_user_id` | Admin log queries |
| `login_attempt_logs` | `idx_login_attempt_log_event_type` | Filter by event type |
| `login_attempt_logs` | `idx_login_attempt_log_occurred_at` | Date range queries |
| `login_attempt_logs` | `idx_login_attempt_log_login_attempt_id` | FK lookup |
| `users` | `(login_fail_count, locked_until)` composite | Fast lockout scan |

**Performance targets (from Testing Strategy):**
- Lockout check response: **< 50ms** (cached LockoutPolicy, indexed lookups)
- Concurrent login attempts: **1000+** (async logging, connection pool sizing)
- Auto-unlock scan: **< 2s** for 10K locked users (indexed scan)

**MSSQL partitioning recommendation:**
- `login_attempts` table: monthly partition on `occurred_at`
- `login_attempt_logs` table: quarterly partition on `occurred_at`
- Archive strategy: move data > 90 days to `login_attempts_archive` table

### 3.9 Integration Points with Other Features

| Feature | Integration Point | Direction |
|---|---|---|
| **F-272** (First login + TOTP setup) | `recordFailure()` called during password verification in F-272 login flow | F-277 consumes |
| **F-273** (Subsequent login + TOTP) | `checkLockout()` called before password verification; `recordFailure()` on both password and TOTP failure; `recordSuccess()` after 2FA pass | Bidirectional |
| **F-274** (JWT session management) | `AccountLockedEvent` triggers JWT blacklist; `AccountUnlockedEvent` allows new JWT issuance | F-274 reacts to F-277 |
| **F-275** (3-level authorization) | Admin unlock API uses F-275 role claims (`system-admin` full access, `admin` unit-scoped) | F-277 uses F-275 |
| **F-276** (Password policy) | `recordFailure()` also fires on password reset attempts (if in scope) | F-276 may call F-277 |

### 3.10 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + native query |
| `spring-boot-starter-security` | Spring Security filter chain |
| `jjwt` | JWT token management (F-274 integration) |
| `google-authenticator` (lib) | TOTP verification (F-273 integration) |
| `spring-boot-starter-cache` + `spring-boot-starter-data-redis` | Redis cache for LockoutPolicy |
| `spring-boot-starter-aop` | Aspect-based audit logging (optional) |
| `micrometer-registry-prometheus` | Metrics for lockout monitoring |

---

## 4. Migration Script (MSSQL)

```sql
-- =============================================
-- Migration: F-277 — Chính sách giới hạn đăng nhập sai
-- Date: 2026-06-23
-- =============================================

-- 1. Extend User table with lockout tracking fields
IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'login_fail_count')
BEGIN
    ALTER TABLE [dbo].[users]
    ADD [login_fail_count] INT NOT NULL DEFAULT 0;
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'locked_until')
BEGIN
    ALTER TABLE [dbo].[users]
    ADD [locked_until] DATETIME2 NULL;
END;

-- Index for fast lockout scan (auto-unlock scheduler)
IF NOT EXISTS (SELECT 1 FROM sys.indexes
    WHERE name = 'ix_users_locked_unlock_scan')
BEGIN
    CREATE NONCLUSTERED INDEX [ix_users_locked_unlock_scan]
    ON [dbo].[users] ([locked_until])
    WHERE [locked_until] IS NOT NULL;
END;

-- 2. Create LoginAttempt table
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'login_attempts')
BEGIN
    CREATE TABLE [dbo].[login_attempts] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [user_id] BIGINT NULL,
        [username] NVARCHAR(150) NOT NULL,
        [email] NVARCHAR(255) NOT NULL,
        [ip_address] NVARCHAR(45) NULL,
        [user_agent] NVARCHAR(500) NULL,
        [result] VARCHAR(10) NOT NULL,  -- success | failure
        [failure_reason] VARCHAR(100) NULL,
        [auth_type] VARCHAR(30) NULL,   -- password_only | password_and_totp | totp_only
        [occurred_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX [idx_login_attempts_user_id]
        ON [dbo].[login_attempts] ([user_id]);
    CREATE NONCLUSTERED INDEX [idx_login_attempts_username]
        ON [dbo].[login_attempts] ([username]);
    CREATE NONCLUSTERED INDEX [idx_login_attempts_result]
        ON [dbo].[login_attempts] ([result]);
    CREATE NONCLUSTERED INDEX [idx_login_attempts_occurred_at]
        ON [dbo].[login_attempts] ([occurred_at]);
END;

-- 3. Create LoginAttemptLog table (immutable audit)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'login_attempt_logs')
BEGIN
    CREATE TABLE [dbo].[login_attempt_logs] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [login_attempt_id] BIGINT NULL,
        [user_id] BIGINT NULL,
        [username] NVARCHAR(150) NULL,
        [event_type] VARCHAR(30) NOT NULL,  -- account_locked | account_unlocked | threshold_warning
        [triggered_by] VARCHAR(100) NULL,   -- system | admin:{id} | auto
        [details] NVARCHAR(MAX) NULL,       -- JSON
        [ip_address] NVARCHAR(45) NULL,
        [occurred_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX [idx_login_attempt_log_user_id]
        ON [dbo].[login_attempt_logs] ([user_id]);
    CREATE NONCLUSTERED INDEX [idx_login_attempt_log_event_type]
        ON [dbo].[login_attempt_logs] ([event_type]);
    CREATE NONCLUSTERED INDEX [idx_login_attempt_log_occurred_at]
        ON [dbo].[login_attempt_logs] ([occurred_at]);
    CREATE NONCLUSTERED INDEX [idx_login_attempt_log_login_attempt_id]
        ON [dbo].[login_attempt_logs] ([login_attempt_id]);

    -- Immutable: prevent UPDATE and DELETE
    CREATE TRIGGER [trg_login_attempt_logs_no_mod]
    ON [dbo].[login_attempt_logs]
    INSTEAD OF UPDATE, DELETE
    AS
    BEGIN
        RAISERROR ('LoginAttemptLog is immutable. Do not UPDATE or DELETE.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;

-- 4. Create LockoutPolicy table (singleton)
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'lockout_policies')
BEGIN
    CREATE TABLE [dbo].[lockout_policies] (
        [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
        [max_failed_attempts] INT NOT NULL DEFAULT 5,
        [lockout_duration_minutes] INT NOT NULL DEFAULT 30,
        [window_minutes] INT NOT NULL DEFAULT 15,
        [is_enabled] BIT NOT NULL DEFAULT 1,
        [updated_at] DATETIME2 NULL,
        [updated_by] NVARCHAR(100) NULL,
        [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- Insert default policy (singleton)
    INSERT INTO [dbo].[lockout_policies]
        ([max_failed_attempts], [lockout_duration_minutes], [window_minutes], [is_enabled], [created_at], [updated_at])
    VALUES
        (5, 30, 15, 1, SYSUTCDATETIME(), SYSUTCDATETIME());

    -- Ensure only one row exists (application-level + DB trigger)
    CREATE TRIGGER [trg_lockout_policies_singleton]
    ON [dbo].[lockout_policies]
    AFTER INSERT, UPDATE
    AS
    BEGIN
        DECLARE @count INT = (SELECT COUNT(*) FROM [dbo].[lockout_policies]);
        IF @count > 1
        BEGIN
            RAISERROR ('LockoutPolicy must have exactly one row.', 16, 1);
            ROLLBACK TRANSACTION;
        END
    END;
END;
```

---

## 5. Frontend Integration Notes

### 5.1 Login Page — Lockout Display

```typescript
// Response types for lockout-aware login
interface LoginResponse {
  // Standard success
  token?: string;
  user?: UserInfo;

  // Lockout states
  error?: 'ACCOUNT_LOCKED' | 'INVALID_CREDENTIALS';
  message?: string;        // User-facing message (Vietnamese)
  warning?: string;        // BR-277-08 warning at threshold
  lockedUntil?: string;    // ISO datetime
  remainingMinutes?: number;
  failCount?: number;
  maxFailedAttempts?: number;
  remainingAttempts?: number;
}

// UI components
const LoginLockoutBanner = ({ lockedUntil, remainingMinutes }: LockoutBannerProps) => (
  <Alert variant="danger">
    Tài khoản đã bị khóa. Vui lòng thử lại sau {remainingMinutes} phút hoặc liên hệ quản trị viên.
    {lockedUntil && <span> (Mở khóa lúc: {formatTime(lockedUntil)})</span>}
  </Alert>
);

const LoginWarningBanner = ({ warning, remainingAttempts }: WarningBannerProps) => (
  <Alert variant="warning">
    {warning} ({remainingAttempts} lần còn lại)
  </Alert>
);
```

### 5.2 Admin Console — Account Unlock

```typescript
// Admin page: /admin/users/[id]/lockout-status
// Shows lockout status card + unlock button (system-admin only)
const LockoutStatusCard = ({
  userId,
  lockedUntil,
  loginFailCount,
  maxFailedAttempts,
}: LockoutStatusProps) => {
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();
  const isAutoUnlocked = lockedUntil && new Date(lockedUntil) <= new Date();

  return (
    <Card>
      {isLocked && (
        <>
          <Alert variant="danger">
            Tài khoản đang bị khóa đến {formatTime(lockedUntil)}
          </Alert>
          <Button
            onClick={() => handleUnlock(userId)}
            variant="primary"
          >
            Mở khóa tài khoản
          </Button>
        </>
      )}
      {isAutoUnlocked && <Alert variant="success">Tài khoản đã tự mở khóa</Alert>}
      {!isLocked && !isAutoUnlocked && <Alert variant="success">Tài khoản hoạt động bình thường</Alert>}
    </Card>
  );
};
```

---

## 6. Verification Checklist (SA → Tech-Lead Handoff)

| # | Check | Status |
|---|---|---|
| 1 | Entities match feature-brief specification (LoginAttempt, LoginAttemptLog, LockoutPolicy, User extension) | ✅ |
| 2 | Business Rules BR-277-01 through BR-277-10 covered in code design | ✅ |
| 3 | Immutable audit trail for LoginAttemptLog (BR-277-07) | ✅ |
| 4 | Auto-unlock scheduling mechanism defined (BR-277-02) | ✅ |
| 5 | WindowMinutes logic (BR-277-04) — fail count reset if gap > 15min | ✅ |
| 6 | Threshold warnings at 3 and 4 failures (BR-277-08) | ✅ |
| 7 | Lockout applies before credential check (BR-277-05) | ✅ |
| 8 | Admin unlock with audit log (BR-277-06, BR-277-07) | ✅ |
| 9 | Policy configurable at runtime without restart (BR-277-10) | ✅ |
| 10 | Lockout applies to all roles (BR-277-09) | ✅ |
| 11 | MSSQL migration script included | ✅ |
| 12 | Integration with F-272, F-273, F-274, F-275 defined | ✅ |
| 13 | Frontend display for lockout warning/blocked states | ✅ |
| 14 | Performance target < 50ms for lockout check | ✅ |
| 15 | Security: constant-time TOTP comparison, generic error messages | ✅ |

---

## 7. Open Questions / Risks

| # | Question | Impact | Owner |
|---|---|---|---|
| Q1 | Should shared secret TOTP failures (F-273) have a **separate** counter from password failures? Feature-brief says "cả mật khẩu và TOTP sai đều tính vào failCount" — nhưng có nguy cơ user bị lock vì nhập sai TOTP nhiều lần. | Business logic | BA/Security |
| Q2 | Auto-unlock scheduler runs every 5 minutes — is this acceptable for all real-world scenarios? Alternative: use a delayed message queue (e.g., RabbitMQ delayed exchange) for per-account unlock timing. | UX precision | Architect |
| Q3 | LoginAttempt table will grow fast — what is the retention period? Feature-brief says "mọi sự kiện đăng nhập" đều ghi log. Recommend: keep LoginAttempt 90 days, archive to partition/table after. | Storage / Compliance | Ops |
| Q4 | BR-277-04 says "reset nếu lần sai cuối cách lần trước > 15 phút" — cần query `LoginAttempt` để kiểm tra thời gian fail gần nhất. Với concurrent requests, cần pessimistic/optimistic locking trên `User` row để tránh race condition. | Concurrency | Backend |
| Q5 | F-274 JWT invalidation khi account bị lock — cần định nghĩa rõ: invalidate toàn bộ JWT của user, hay chỉ revoke active session tokens? | Security | Security |
| Q6 | Admin unlock chỉ cho phép trong phạm vi đơn vị/phân hệ (BR roles). Cần xác định cơ chế phân chia data scope giữa `admin` và `system-admin` — dùng `@PreAuthorize` hay custom interceptor? | Authorization | Backend |
