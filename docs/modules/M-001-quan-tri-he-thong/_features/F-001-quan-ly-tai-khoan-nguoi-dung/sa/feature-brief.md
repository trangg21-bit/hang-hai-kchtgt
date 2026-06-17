---
id: F-001
name: Quan ly tai khoan nguoi dung
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
stage: system-architect
status: completed
created: 2026-06-17T00:00:00Z
last-updated: 2026-06-17T04:00:00Z
---

# SA Stage: F-001 — Quản lý tài khoản người dùng

## 1. Entities (Spring Data JPA — MSSQL 2022)

### 1.1 UserAccount

```java
@Entity
@Table(name = "user_accounts", indexes = {
    @Index(name = "idx_user_accounts_email", columnList = "email", unique = true),
    @Index(name = "idx_user_accounts_username", columnList = "username", unique = true),
    @Index(name = "idx_user_accounts_status", columnList = "status"),
    @Index(name = "idx_user_accounts_role_id", columnList = "role_id")
})
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "username", length = 100, nullable = false) private String username;
    @Column(name = "email", length = 255, nullable = false) private String email;
    @Column(name = "password_hash", length = 255, nullable = false) private String passwordHash;
    @Column(name = "full_name", length = 200) private String fullName;
    @Column(name = "phone", length = 20) private String phone;
    @Column(name = "avatar_url", length = 500) private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "organization_id")
    private Unit organization;

    @Column(name = "status", length = 20, nullable = false, columnDefinition = "VARCHAR(20) DEFAULT 'active'")
    private String status; // active | inactive | locked

    @Column(name = "login_attempts", columnDefinition = "INT DEFAULT 0")
    private Integer loginAttempts = 0;

    @Column(name = "locked_until") private LocalDateTime lockedUntil;
    @Column(name = "last_login_at") private LocalDateTime lastLoginAt;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Column(name = "deleted_at") private LocalDateTime deletedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
```

### 1.2 Role

```java
@Entity
@Table(name = "roles", uniqueConstraints = @UniqueConstraint(columnNames = {"code"}))
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @Column(name = "name", length = 100, nullable = false) private String name;
    @Column(name = "code", length = 50, nullable = false) private String code;
    @Column(name = "description", length = 500) private String description;
    @Column(name = "permissions", columnDefinition = "JSON") private String permissions; // JSON: [{resource, action}]
    @Column(name = "is_system", columnDefinition = "BIT DEFAULT 0") private Boolean isSystem;
    @Column(name = "created_at") private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
```

### 1.3 UserRole (Many-to-Many junction)

```java
@Entity
@Table(name = "user_roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "role_id"})
})
public class UserRole {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "assigned_by")
    private UserAccount assignedBy;

    @Column(name = "assigned_at") private LocalDateTime assignedAt;
    @Column(name = "expires_at") private LocalDateTime expiresAt;

    @PrePersist void onCreate() { assignedAt = LocalDateTime.now(); }
}
```

### 1.4 PasswordResetToken

```java
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id") private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @Column(name = "token", length = 255, nullable = false) private String token;
    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
    @Column(name = "used_at") private LocalDateTime usedAt;
}
```

### 1.5 Relationship Diagram

```
UserAccount 1──N UserRole N──1 Role
UserAccount N──1 Unit (organization)
UserAccount 1──N PasswordResetToken
UserAccount 1──N GroupMember (through F-002)
```

## 2. API Endpoints

All endpoints prefixed with `/api/v1/`. Authentication via JWT Bearer token.  
Admin-only operations require `system-admin` or `admin` role claim in JWT.

### User Account CRUD

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users` | Danh sách người dùng (phân trang, bộ lọc) | system-admin |
| GET | `/api/v1/users/{id}` | Chi tiết người dùng | system-admin |
| POST | `/api/v1/users` | Tạo tài khoản người dùng mới | system-admin |
| PUT | `/api/v1/users/{id}` | Chỉnh sửa thông tin người dùng | system-admin |
| PATCH | `/api/v1/users/{id}/status` | Khóa/mở khóa tài khoản | system-admin |
| DELETE | `/api/v1/users/{id}` | Xóa tài khoản (soft delete) | system-admin |

### User Search & Filters

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users/search?query=&role=&status=` | Tìm kiếm người dùng | system-admin |
| GET | `/api/v1/users?role={code}&status={status}&page=&size=` | Bộ lọc danh sách | system-admin |
| GET | `/api/v1/users/me` | Thông tin người dùng hiện tại | JWT (mọi role) |
| PUT | `/api/v1/users/me` | Chỉnh sửa thông tin cá nhân | JWT (mọi role) |

### Role Assignment

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/users/{id}/roles` | Danh sách vai trò của người dùng | system-admin |
| POST | `/api/v1/users/{id}/roles` | Gán vai trò cho người dùng | system-admin |
| DELETE | `/api/v1/users/{id}/roles/{roleId}` | Revoc vai trò | system-admin |
| GET | `/api/v1/roles` | Danh sách tất cả vai trò | system-admin |

### Password Management

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/users/{id}/reset-password` | Admin reset mật khẩu người dùng | system-admin |
| POST | `/api/v1/auth/forgot-password` | Yêu cầu gửi token reset | Public |
| POST | `/api/v1/auth/reset-password` | Xác nhận token + đặt mật khẩu mới | Public (token) |
| POST | `/api/v1/auth/change-password` | Đổi mật khẩu | JWT |

### Password Policy & Security

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/v1/auth/password-policy` | Chính sách mật khẩu hiện tại | Public |
| POST | `/api/v1/auth/totp/setup` | Kích hoạt TOTP 2FA | JWT |
| POST | `/api/v1/auth/totp/verify` | Xác nhận TOTP | Public (temp_token) |
| DELETE | `/api/v1/auth/totp/disable` | Tắt TOTP | JWT + current_password |

## 3. Architecture Notes

### 3.1 Component Interactions

```
ReactJS (Admin UI)
    │
    ├── Spring Security JWT Filter ──► Authorization
    │                                       │
    ▼                                       ▼
UserController                    UserDetailsService
    │                                       │
    ├── UserService ──► UserRepository ──► MSSQL (JPA/Hibernate)
    │
    ├── PasswordEncoder (BCrypt)
    ├── RateLimiter (Redis / local cache)
    └── AuditLogger ──► F-005 AccessLog
```

**Key interactions:**
- `UserController` delegates to `UserService` for all business logic
- `UserDetailsService` integrates with Spring Security `AuthenticationManager` for JWT token generation
- `PasswordEncoder` (BCrypt) handles all password hashing — never store plaintext
- `RateLimiter` prevents brute-force on login/registration (50 req/15min)
- Audit events published to F-005 (`AccessLogService`) via Spring ApplicationEvent

### 3.2 Design Patterns

| Pattern | Application |
|---|---|
| **Repository Pattern** | `UserRepository`, `RoleRepository` — Spring Data JPA interfaces abstracting MSSQL access |
| **DTO Pattern** | `UserCreateDTO`, `UserUpdateDTO`, `UserResponseDTO` — decouple DB entities from API contracts |
| **Specification Pattern** | Dynamic query building for user search/filters (`JpaSpecificationExecutor`) |
| **Strategy Pattern** | `PasswordValidatorStrategy` — interchangeable validation rules (length, complexity, history) |
| **Facade Pattern** | `UserServiceFacade` — coordinates multi-step operations (create user + assign role + send welcome) |
| **Circuit Breaker** | `Resilience4j` on external auth providers (future SSO integration) |
| **CQRS (light)** | Read model via `UserReadService` (projection) separate from write model in `UserService` |

### 3.3 Spring Security Configuration

```
SecurityFilterChain:
  → UsernamePasswordAuthenticationFilter (login)
  → JwtAuthenticationFilter (Bearer token validation)
  → FilterSecurityInterceptor (method-level @PreAuthorize)
  → ExceptionTranslationFilter (access denied / auth exception)
```

**Method-level security annotations:**
- `@PreAuthorize("hasRole('SYSTEM_ADMIN')")` — admin-only endpoints
- `@PreAuthorize("#id == authentication.principal.id or hasRole('SYSTEM_ADMIN')")` — self-edit
- `@PostAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('CAN_BO')")` — post-action check

### 3.4 Transaction Management

- `@Transactional` on `UserService` create/update/delete methods
- `REQUIRED` propagation default — all user operations atomic
- Rollback on constraint violation (unique email/username) or business rule violation (active references)

### 3.5 Error Handling

Global exception handler (`@RestControllerAdvice`) returns:
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Email đã tồn tại" } }
```

Standard codes: `VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, `CONFLICT`, `AUTHENTICATION_REQUIRED`, `AUTHORIZATION_DENIED`, `ACCOUNT_LOCKED`.

### 3.6 Database Indexes & Performance

- Composite index on `(status, role_id)` for filtered queries
- Full-text index on `(username, email, full_name)` for search
- Pagination via `Pageable` (MSSQL `OFFSET-FETCH`) — max page size 100

### 3.7 Dependencies

| Dependency | Purpose |
|---|---|
| `spring-boot-starter-security` | Authentication & authorization |
| `spring-boot-starter-data-jpa` | ORM with MSSQL dialect |
| `jjwt` (io.jsonwebtoken) | JWT token creation/validation |
| `spring-boot-starter-validation` | Bean validation (@Valid, @NotBlank) |
| `resilience4j-spring-boot3` | Circuit breaker for future integrations |
