---
id: F-004
name: Quan ly tai khoan admin
slug: quan-ly-tai-khoan-admin
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-004 — Quản lý tài khoản admin

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 AdminAccount

```java
@Entity
@Table(name = "admin_accounts", indexes = {
    @Index(name = "idx_admin_accounts_username", columnList = "username", unique = true),
    @Index(name = "idx_admin_accounts_email", columnList = "email", unique = true),
    @Index(name = "idx_admin_accounts_admin_type", columnList = "admin_type"),
    @Index(name = "idx_admin_accounts_status", columnList = "status")
})
public class AdminAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "username", length = 100, nullable = false) private String username;
    @Column(name = "email", length = 255, nullable = false) private String email;
    @Column(name = "password_hash", length = 255, nullable = false) private String passwordHash;

    @Column(name = "admin_type", length = 30, nullable = false, columnDefinition = "VARCHAR(30)")
    private String adminType; // super | system | security

    @Column(name = "module_access", columnDefinition = "JSON")
    private String moduleAccess; // JSON: ["M-001", "M-002", ...]

    @Column(name = "status", length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | locked | suspended

    @Column(name = "mfa_enabled", columnDefinition = "BIT DEFAULT 1")
    private Boolean mfaEnabled = true;

    @Column(name = "mfa_secret", length = 100) private String mfaSecret; // TOTP base32 secret
    @Column(name = "lockout_count", columnDefinition = "INT DEFAULT 0")
    private Integer lockoutCount = 0;
    @Column(name = "locked_until") private LocalDateTime lockedUntil;
    @Column(name = "last_login_at") private LocalDateTime lastLoginAt;

    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (mfaEnabled == null) mfaEnabled = true;
    }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 AdminPermission

```java
@Entity
@Table(name = "admin_permissions", indexes = {
    @Index(name = "idx_admin_perm_admin_id", columnList = "admin_id"),
    @Index(name = "idx_admin_perm_module_id", columnList = "module_id")
})
public class AdminPermission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "admin_id", nullable = false)
    private AdminAccount admin;

    @Column(name = "module_id", length = 10, nullable = false) private String moduleId;

    @Column(name = "permissions", columnDefinition = "JSON", nullable = false)
    private String permissions; // JSON: ["read", "write", "delete", "approve"]

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "granted_by")
    private AdminAccount grantedBy;

    @Column(name = "granted_at") private LocalDateTime grantedAt;
    @Column(name = "expires_at") private LocalDateTime expiresAt;

    @PrePersist void onCreate() { grantedAt = LocalDateTime.now(); }
}
```

### 1.3 AdminAuditLog

```java
@Entity
@Table(name = "admin_audit_logs", indexes = {
    @Index(name = "idx_admin_audit_admin_id", columnList = "admin_id"),
    @Index(name = "idx_admin_audit_performed_at", columnList = "performed_at"),
    @Index(name = "idx_admin_audit_action", columnList = "action")
})
public class AdminAuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "admin_id", nullable = false)
    private AdminAccount admin;

    @Column(name = "action", length = 50, nullable = false) private String action;
    // create | update | delete | lock | unlock | login | permission_grant | permission_revoke

    @Column(name = "target", length = 200) private String target; // resource targeted
    @Column(name = "details", columnDefinition = "JSON") private String details; // full payload diff

    @Column(name = "ip_address", length = 45) private String ipAddress; // IPv4 or IPv6
    @Column(name = "user_agent", length = 500) private String userAgent;

    @Column(name = "performed_at") private LocalDateTime performedAt;
}
```

### 1.4 AdminRecoveryToken

```java
@Entity
@Table(name = "admin_recovery_tokens")
public class AdminRecoveryToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "admin_id", nullable = false)
    private AdminAccount admin;

    @Column(name = "token", length = 255, nullable = false) private String token;
    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
    @Column(name = "used_at") private LocalDateTime usedAt;
}
```

### 1.5 Relationship Diagram

```
AdminAccount 1──N AdminPermission N──1 Module (referential)
AdminAccount 1──N AdminAuditLog
AdminAccount 1──N AdminRecoveryToken
AdminAccount N──1 AdminAccount (granted_by, performed_by — self-ref)
AdminAccount 1──1 UserAccount (shared identity via external mapping)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.  
**CRITICAL:** All admin-account endpoints require `super-admin` role claim unless noted.

### Admin Account CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admins` | Danh sách tài khoản admin | super-admin |
| GET | `/api/v1/admins/{id}` | Chi tiết tài khoản admin | super-admin |
| POST | `/api/v1/admins` | Tạo tài khoản admin mới | super-admin |
| PUT | `/api/v1/admins/{id}` | Chỉnh sửa quyền admin | super-admin |
| DELETE | `/api/v1/admins/{id}` | Xóa tài khoản admin (2-step confirm) | super-admin |

### Admin Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/admins/login` | Đăng nhập admin (MFA required) | Public |
| POST | `/api/v1/admins/login/totp/verify` | Xác thực TOTP sau login | Public (temp_token) |
| POST | `/api/v1/admins/forgot-password` | Yêu cầu recovery token | Public |
| POST | `/api/v1/admins/reset-password` | Đặt lại mật khẩu với token | Public (token) |
| POST | `/api/v1/admins/change-password` | Đổi mật khẩu admin | JWT (admin) |

### Admin Lock/Unlock

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| PATCH | `/api/v1/admins/{id}/lock` | Khóa tài khoản admin | super-admin |
| PATCH | `/api/v1/admins/{id}/unlock` | Mở khóa (cần 2 admin approve) | super-admin (x2) |
| GET | `/api/v1/admins/lockout-log` | Lịch sử khóa/mở khóa | super-admin |

### Admin Permissions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admins/{id}/permissions` | Danh sách phân quyền | super-admin |
| POST | `/api/v1/admins/{id}/permissions` | Gán quyền admin (fine-grained) | super-admin |
| DELETE | `/api/v1/admins/{id}/permissions/{permissionId}` | Revoc quyền | super-admin |
| GET | `/api/v1/admins/{id}/modules` | Module được truy cập | super-admin |

### Admin Audit

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/admins/{id}/audit-log` | Lịch sử thay đổi admin | super-admin |
| GET | `/api/v1/admins/audit-log` | Toàn bộ audit log (all admins) | super-admin |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (Super Admin UI)
    │
    ├── AdminAuthController
    │       ├── AdminAuthService ──► BCrypt (password hash)
    │       ├── JwtTokenService ──► io.jsonwebtoken (JWT creation)
    │       └── MfaService ──► TOTP verification (google-authenticator lib)
    │
    ├── AdminController
    │       ├── AdminService ──► AdminRepository ──► MSSQL
    │       ├── AdminPermissionService ──► PermissionRepository
    │       └── AdminUnlockService (dual-approval workflow)
    │
    └── AdminAuditService ──► AdminAuditLogRepository ──► MSSQL
            │
            └── AuditLogInterceptor (Spring AOP) — auto-logs all admin mutations
```

**Key interactions:**
- `AdminAuthController` enforces mandatory MFA — login returns `temp_token`, must verify TOTP within 5 minutes
- `AdminUnlockService` implements 2-of-3 approval: requires approval from 2 different super-admins
- `AdminAuditService` auto-logs via `@Aspect` AOP interceptor on all `@AdminAudit` annotated methods
- `AdminPermissionService` uses JSON policy evaluation — checks module + permission arrays at runtime

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `AdminRepository`, `AdminPermissionRepository` — Spring Data JPA with custom queries |
| **DTO Pattern** | `AdminCreateDTO`, `AdminUpdateDTO`, `AdminLoginDTO`, `PermissionGrantDTO` |
| **Factory Pattern** | `TokenFactory` — generates JWT, temp_token, recovery_token with different TTLs |
| **Proxy Pattern** | `AuditLogProxy` — Spring AOP aspect auto-writes audit log before/after operations |
| **Builder Pattern** | `PermissionPolicyBuilder` — constructs runtime permission check from JSON policies |
| **Double-Approval Pattern** | `AdminUnlockService` — requires 2 independent approvals stored in temp table |
| **Observer Pattern** | `ApplicationEventPublisher` → `AdminLockedEventListener` → F-005 notification |

### 3.3 Super-Admin Protection

```java
// BR-018: Never delete the last super-admin
@Service
public class AdminService {
    @Transactional
    public void deleteAdmin(Long adminId) {
        AdminAccount admin = adminRepo.findById(adminId).orElseThrow();
        if ("super".equals(admin.getAdminType())) {
            long superAdminCount = adminRepo.countByAdminType("super");
            if (superAdminCount <= 1) {
                throw new SuperAdminProtectionException(
                    "Không thể xóa Super Admin cuối cùng");
            }
        }
        admin.setStatus("deleted");
        adminRepo.save(admin);
        auditLogService.log(admin, "delete", ...);
    }
}
```

### 3.4 Dual-Approval Unlock Flow

```
AdminService.unlockRequest(adminId, requesterId):
  1. Create UnlockApproval record (status=PENDING)
  2. Notify other super-admins (email + in-app notification)
  3. When 2nd approval received → status=APPROVED
  4. Atomic: unlock admin + set lockedUntil=null + write audit log
  5. If timeout (24h) → status=EXPIRED
```

### 3.5 Transaction Boundaries

- `@Transactional` on `AdminService.create()` — creates admin + MFA setup + initial history
- `@Transactional` on `AdminPermissionService.grantPermission()` — atomic grant + audit
- `@Transactional(readOnly = true)` on admin search/list queries
- `REQUIRES_NEW` on `AdminAuditService.log()` — audit log must persist even if main transaction rolls back

### 3.6 Security Architecture

```
JWT Claim Structure:
{
  "sub": "admin_id",
  "admin_type": "super|system|security",
  "modules": ["M-001", "M-002"],
  "perms": ["read", "write"],
  "iat": 1718611200,
  "exp": 1718614800  // 1 hour
}

Access Control:
- Super Admin: bypass all @PreAuthorize checks
- System Admin: check module_access + permissions JSON
- Security Admin: READ-only on audit modules, no business data access
```

### 3.7 Database Indexes & Performance

- Unique index on `(username)` and `(email)`
- Index on `(admin_type, status)` for filtered admin queries
- Composite index on `(admin_id, performed_at)` for audit log queries
- Full-text index on `(action, target)` for audit search
- Row-level isolation via `@Transactional` — prevent concurrent modifications

### 3.8 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-data-jpa` | ORM + native query |
| `spring-boot-starter-security` | Spring Security filter chain |
| `jjwt` | JWT token management |
| `commons-validator` | TOTP verification (RFC 6238) |
| `spring-boot-starter-aop` | Aspect-based audit logging |
| `spring-boot-starter-mail` | Email notifications for lock/unlock approvals |
