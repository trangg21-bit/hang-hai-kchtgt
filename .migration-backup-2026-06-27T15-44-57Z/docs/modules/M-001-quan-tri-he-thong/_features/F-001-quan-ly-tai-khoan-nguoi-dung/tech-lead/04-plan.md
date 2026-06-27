# Tech Lead Plan: F-001 — Quản lý tài khoản người dùng

## 1. Implementation Tasks

### Backend Tasks (Estimated: 3–4 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `UserAccount.java` | `src/main/java/vn/eg/haihang/model/entity/UserAccount.java` | Low |
| 1.2 | Entity: `Role.java` | `src/main/java/vn/eg/haihang/model/entity/Role.java` | Low |
| 1.3 | Entity: `UserRole.java` | `src/main/java/vn/eg/haihang/model/entity/UserRole.java` | Low |
| 1.4 | Entity: `PasswordResetToken.java` | `src/main/java/vn/eg/haihang/model/entity/PasswordResetToken.java` | Low |
| 1.5 | Repository: `UserRepository.java` | `src/main/java/vn/eg/haihang/repository/UserRepository.java` | Medium |
| 1.6 | Repository: `RoleRepository.java` | `src/main/java/vn/eg/haihang/repository/RoleRepository.java` | Low |
| 1.7 | Repository: `UserRoleRepository.java` | `src/main/java/vn/eg/haihang/repository/UserRoleRepository.java` | Medium |
| 1.8 | Repository: `PasswordResetTokenRepository.java` | `src/main/java/vn/eg/haihang/repository/PasswordResetTokenRepository.java` | Low |
| 1.9 | DTO: `UserCreateDTO`, `UserUpdateDTO`, `UserResponseDTO` | `src/main/java/vn/eg/haihang/dto/` | Low |
| 1.10 | Service: `UserService.java` | `src/main/java/vn/eg/haihang/service/UserService.java` | High |
| 1.11 | Service: `UserDetailsService (Spring Security)` | `src/main/java/vn/eg/haihang/security/UserDetailsServiceImpl.java` | Medium |
| 1.12 | Service: `PasswordResetService.java` | `src/main/java/vn/eg/haihang/service/PasswordResetService.java` | Medium |
| 1.13 | Service: `TotpService.java` | `src/main/java/vn/eg/haihang/service/TotpService.java` | Medium |
| 1.14 | Controller: `UserController.java` | `src/main/java/vn/eg/haihang/controller/UserController.java` | High |
| 1.15 | Controller: `AuthController.java` | `src/main/java/vn/eg/haihang/controller/AuthController.java` | High |
| 1.16 | Security: `JwtAuthenticationFilter.java` | `src/main/java/vn/eg/haihang/security/JwtAuthenticationFilter.java` | High |
| 1.17 | Security: `SecurityConfig.java` | `src/main/java/vn/eg/haihang/config/SecurityConfig.java` | High |
| 1.18 | Exception: `GlobalExceptionHandler.java` | `src/main/java/vn/eg/haihang/exception/GlobalExceptionHandler.java` | Medium |
| 1.19 | Event: `UserAuditEventListener.java` | `src/main/java/vn/eg/haihang/event/UserAuditEventListener.java` | Medium |
| 1.20 | Config: `application.yml` (JWT, password policy, rate limit) | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 2–3 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `userApi.ts` | `src/services/api/userApi.ts` | Medium |
| 2.2 | API client: `authApi.ts` | `src/services/api/authApi.ts` | Medium |
| 2.3 | Type definitions: `userTypes.ts` | `src/types/userTypes.ts` | Low |
| 2.4 | Hook: `useUsers.ts` (pagination, filtering) | `src/hooks/useUsers.ts` | Medium |
| 2.5 | Page: `UserListPage.tsx` | `src/pages/admin/UserListPage.tsx` | High |
| 2.6 | Page: `UserDetailPage.tsx` | `src/pages/admin/UserDetailPage.tsx` | Medium |
| 2.7 | Page: `UserCreatePage.tsx` | `src/pages/admin/UserCreatePage.tsx` | Medium |
| 2.8 | Page: `UserEditPage.tsx` | `src/pages/admin/UserEditPage.tsx` | Medium |
| 2.9 | Page: `ProfilePage.tsx` | `src/pages/ProfilePage.tsx` | Medium |
| 2.10 | Component: `UserTable.tsx` | `src/components/admin/UserTable.tsx` | Medium |
| 2.11 | Component: `UserForm.tsx` | `src/components/admin/UserForm.tsx` | Medium |
| 2.12 | Component: `RoleAssignmentModal.tsx` | `src/components/admin/RoleAssignmentModal.tsx` | Medium |
| 2.13 | Component: `PasswordChangeModal.tsx` | `src/components/admin/PasswordChangeModal.tsx` | Low |
| 2.14 | Component: `TotpSetupModal.tsx` | `src/components/admin/TotpSetupModal.tsx` | Medium |
| 2.15 | Auth: `authContext.tsx` | `src/contexts/authContext.tsx` | High |
| 2.16 | Routing: add admin routes in `App.tsx` | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/users` | `UserController.listUsers()` | system-admin |
| GET | `/api/v1/users/{id}` | `UserController.getUserById()` | system-admin |
| POST | `/api/v1/users` | `UserController.createUser()` | system-admin |
| PUT | `/api/v1/users/{id}` | `UserController.updateUser()` | system-admin |
| PATCH | `/api/v1/users/{id}/status` | `UserController.updateStatus()` | system-admin |
| DELETE | `/api/v1/users/{id}` | `UserController.softDeleteUser()` | system-admin |
| GET | `/api/v1/users/search` | `UserController.searchUsers()` | system-admin |
| GET | `/api/v1/users/me` | `UserController.getCurrentUser()` | JWT |
| PUT | `/api/v1/users/me` | `UserController.updateMe()` | JWT |
| GET | `/api/v1/users/{id}/roles` | `UserController.getUserRoles()` | system-admin |
| POST | `/api/v1/users/{id}/roles` | `UserController.assignRole()` | system-admin |
| DELETE | `/api/v1/users/{id}/roles/{roleId}` | `UserController.revokeRole()` | system-admin |
| GET | `/api/v1/roles` | `UserController.listRoles()` | system-admin |
| POST | `/api/v1/users/{id}/reset-password` | `UserController.resetPassword()` | system-admin |
| POST | `/api/v1/auth/forgot-password` | `AuthController.forgotPassword()` | Public |
| POST | `/api/v1/auth/reset-password` | `AuthController.resetPassword()` | Public (token) |
| POST | `/api/v1/auth/change-password` | `AuthController.changePassword()` | JWT |
| GET | `/api/v1/auth/password-policy` | `AuthController.getPasswordPolicy()` | Public |
| POST | `/api/v1/auth/totp/setup` | `AuthController.setupTotp()` | JWT |
| POST | `/api/v1/auth/totp/verify` | `AuthController.verifyTotp()` | Public (temp_token) |
| DELETE | `/api/v1/auth/totp/disable` | `AuthController.disableTotp()` | JWT + password |

---

## 3. Component Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── UserListPage.tsx          ← Dashboard table với filter, pagination
│   │   ├── UserCreatePage.tsx        ← Form tạo người dùng
│   │   ├── UserEditPage.tsx          ← Form chỉnh sửa
│   │   └── UserDetailPage.tsx        ← Chi tiết + tab vai trò
│   └── ProfilePage.tsx               ← Thông tin cá nhân + đổi mật khẩu + TOTP
├── components/
│   ├── admin/
│   │   ├── UserTable.tsx             ← Bảng phân trang Ant Design
│   │   ├── UserForm.tsx              ← Form validate (username, email, password)
│   │   ├── RoleAssignmentModal.tsx   ← Modal gán/bỏ vai trò
│   │   ├── PasswordChangeModal.tsx   ← Modal đổi mật khẩu
│   │   └── TotpSetupModal.tsx        ← Modal scan QR + verify TOTP
│   └── auth/
│       └── LoginForm.tsx             ← Form đăng nhập (nếu cần)
├── hooks/
│   ├── useUsers.ts                   ← React Query hook (list, get, create, update)
│   └── useAuth.ts                    ← Hook kiểm tra quyền
├── services/
│   └── api/
│       ├── userApi.ts                ← axios instance + user endpoints
│       └── authApi.ts                ← axios instance + auth endpoints
├── types/
│   └── userTypes.ts                  ← User, Role, UserRole, PasswordResetToken interfaces
├── contexts/
│   └── authContext.tsx               ← Auth context (current user, token, logout)
└── App.tsx                           ← Router thêm routes admin/users/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-001_init_user_accounts.sql
```sql
-- User Accounts table
CREATE TABLE user_accounts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(200),
    phone NVARCHAR(20),
    avatar_url NVARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    login_attempts INT DEFAULT 0,
    locked_until DATETIME2 NULL,
    last_login_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

-- Indexes
CREATE UNIQUE INDEX idx_user_accounts_username ON user_accounts(username);
CREATE UNIQUE INDEX idx_user_accounts_email ON user_accounts(email);
CREATE INDEX idx_user_accounts_status ON user_accounts(status);

-- Audit triggers
CREATE TRIGGER trg_user_accounts_updated
ON user_accounts
AFTER UPDATE
AS
BEGIN
    UPDATE user_accounts SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO
```

### V2__F-001_init_roles.sql
```sql
-- Roles table
CREATE TABLE roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description NVARCHAR(500),
    permissions NVARCHAR(MAX) NULL,  -- JSON: [{"resource":"users","action":"read"}]
    is_system BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE UNIQUE INDEX idx_roles_code ON roles(code);

-- Seed: Default roles
INSERT INTO roles (name, code, description, permissions, is_system) VALUES
('Super Admin', 'SYSTEM_ADMIN', 'Toàn quyền hệ thống', '{"resource":"*","action":"*"}', 1),
('Admin', 'ADMIN', 'Quản lý phân hệ', '{"resource":"*","action":"read,write,delete,approve"}', 1),
('Chuyen vien', 'CHUYEN_VIEN', 'Chuyên viên nghiệp vụ', '{"resource":"*","action":"read,write"}', 1),
('Lanh dao', 'LANH_DAO', 'Lãnh đạo', '{"resource":"*","action":"read"}', 1),
('Can bo', 'CAN_BO', 'Cán bộ', '{"resource":"*","action":"read,write"}', 1),
('User', 'USER', 'Người dùng chung', '{"resource":"*","action":"read"}', 1);
```

### V3__F-001_init_user_roles.sql
```sql
-- User-Role junction table
CREATE TABLE user_roles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL FOREIGN KEY REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by BIGINT FOREIGN KEY REFERENCES user_accounts(id),
    assigned_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    expires_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_user_roles_user_role ON user_roles(user_id, role_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

### V4__F-001_init_password_reset_tokens.sql
```sql
-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL FOREIGN KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
    token NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL
);
GO

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + Repository | Low | Standard JPA entities, straightforward CRUD |
| Service Layer | Medium-High | Password policy, rate limiting, multi-step create flow |
| Security (JWT + 2FA) | High | JWT token lifecycle, TOTP QR generation, temp_token flow |
| Frontend (User CRUD) | Medium | Table with filters, form validation, role assignment modal |
| Frontend (Profile + 2FA) | Medium | QR code render, token verification flow |
| **Overall** | **High** | Security-sensitive, JWT + 2FA adds significant complexity |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–3) | Entities, Repositories, DTOs, V1–V4 migrations | DB schema ready, basic CRUD working |
| Sprint 2 (Days 4–6) | UserService, UserController, SecurityConfig, JwtFilter | Auth working, JWT token generation |
| Sprint 3 (Days 7–8) | PasswordResetService, TotpService, Auth endpoints | Forgot password + TOTP 2FA working |
| Sprint 4 (Days 9–11) | Frontend: UserListPage, UserTable, UserForm, APIs | Admin CRUD UI complete |
| Sprint 5 (Days 12–13) | Frontend: Profile page, RoleAssignmentModal, PasswordChangeModal | Profile + role management UI |
| Sprint 6 (Days 14) | Integration testing, E2E tests, fix bugs | Feature ready for QA |
