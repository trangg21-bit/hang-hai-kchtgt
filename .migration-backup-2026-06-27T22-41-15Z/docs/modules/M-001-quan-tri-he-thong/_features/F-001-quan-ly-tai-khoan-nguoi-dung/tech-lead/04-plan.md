---
feature-id: F-001
stage: execution-planning
agent: engineering-technical-lead
verdict: Pass
waves: 3
last-updated: "2026-06-28T00:00:00Z"
---

# Tech Lead Plan: F-001 — Quản lý tài khoản người dùng (Updated with Approval Workflow)

## 1. Change Overview

This plan incorporates the approval workflow from the updated SA design (2026-06-28) and BA spec (BR-001-09 through BR-001-12). The approval workflow adds self-registration with admin approval before account activation — a significant new capability that requires new entities, services, controllers, frontend pages, and database migrations.

### What Changed
- **New entities**: `PendingApproval`, `ApprovalNotification`
- **New endpoints**: 7 approval-related API routes (pending list, approve, reject, pending-status, approve-role)
- **New services**: `ApprovalService`, `ApprovalNotificationService`, `NotificationEmailService`
- **New frontend pages**: `PendingApprovalPage` (admin), `SelfRegistrationPage` (public)
- **New database migration**: `V5__F-001_init_pending_approvals.sql`
- **New exception classes**: `SelfApprovalException`, `AccountPendingApprovalException`
- **New role**: `admin-operation` with CRUD + Approve + Lock/Unlock permissions
- **Anti-self-approval guard**: Admin cannot approve their own registration request
- **Transaction management**: Approve/reject operations are fully `@Transactional` with atomic multi-step operations

### Existing (Unchanged)
- Original 20 backend tasks (1.1–1.20): User CRUD, auth, password management, 2FA, security
- Original 16 frontend tasks (2.1–2.16): User list, create, edit, profile, forms, modals
- Original 24 API routes
- Original 4 database migrations (V1–V4)
- Original Waves 1–2 (Sprints 1–6): Core user management + auth + 2FA

## 2. Requirement-to-Execution Mapping

| Business Rule | Implementation | Task Reference |
|---|---|---|
| **BR-001-09**: Self-registration requires admin approval before activation | `PendingApproval` entity with `status=pending`; `POST /api/v1/users/pending` creates PendingApproval (not UserAccount) | 1.21, 1.25, 1.29, 2.18 |
| **BR-001-10**: Admin gets module-specific permissions (role: admin-operation) | `@PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")` on approval endpoints | 1.29 |
| **BR-001-11**: Admin approval → user activated + assigned role | `ApprovalService.approve()` within single `@Transactional`: creates UserAccount (status=active), creates UserRole, deletes PendingApproval | 1.26 |
| **BR-001-12**: Admin views/reviews pending list, rejects with reason | `GET /api/v1/users/pending` (admin list), `POST /api/v1/users/{id}/reject` with `rejection_reason` | 1.24, 1.25, 1.29, 2.17, 2.20, 2.21 |

## 3. Implementation Scope

### Backend Scope (com.hanghai.kchtg package)
- **Entities**: `PendingApproval`, `ApprovalNotification` (new); `UserAccount`, `Role`, `UserRole`, `PasswordResetToken` (existing)
- **Repositories**: `PendingApprovalRepository`, `ApprovalNotificationRepository` (new); existing repositories unchanged
- **Services**: `ApprovalService` (new — approve/reject with `@Transactional`), `ApprovalNotificationService` (new), `NotificationEmailService` (new — async via `@Async`); existing services unchanged
- **Controllers**: `ApprovalController` (new — 7 approval endpoints); existing controllers unchanged
- **Exceptions**: `SelfApprovalException`, `AccountPendingApprovalException` (new); `GlobalExceptionHandler` extended with new error codes
- **DTOs**: `PendingApprovalRequestDTO`, `PendingApprovalResponseDTO`, `ApprovalDecisionDTO` (new)
- **Security**: Spring Security `@PreAuthorize` annotations for approval endpoints
- **Database**: Migration `V5__F-001_init_pending_approvals.sql` (new tables + indexes)

### Frontend Scope (ReactJS)
- **Pages**: `PendingApprovalPage` (admin panel), `SelfRegistrationPage` (public registration form)
- **Components**: `ApprovalActionModal`, `PendingApprovalTable`
- **API clients**: `approvalService.ts` (follows existing `frontend/src/services/` convention)
- **Types**: New interfaces for `PendingApproval`, `ApprovalNotification`
- **Routing**: New admin and public routes in `frontend/src/App.tsx`

### Database Migration Scope
- **V1–V4**: Existing (unchanged)
- **V5**: New — `pending_approvals` table + `approval_notifications` table with all indexes

## 4. API Routes

### User Account CRUD

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

### Authentication & Security

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/auth/forgot-password` | `AuthController.forgotPassword()` | Public |
| POST | `/api/v1/auth/reset-password` | `AuthController.resetPassword()` | Public (token) |
| POST | `/api/v1/auth/change-password` | `AuthController.changePassword()` | JWT |
| GET | `/api/v1/auth/password-policy` | `AuthController.getPasswordPolicy()` | Public |
| POST | `/api/v1/auth/totp/setup` | `AuthController.setupTotp()` | JWT |
| POST | `/api/v1/auth/totp/verify` | `AuthController.verifyTotp()` | Public (temp_token) |
| DELETE | `/api/v1/auth/totp/disable` | `AuthController.disableTotp()` | JWT + password |

### Approval Workflow Routes (NEW)

| Method | Path | Handler | Auth |
|---|---|---|---|
| POST | `/api/v1/users/pending` | `ApprovalController.submitRegistration()` | Public (email/phone verification required) |
| GET | `/api/v1/users/pending` | `ApprovalController.listPending()` | admin-operation or system-admin |
| GET | `/api/v1/users/pending/{id}` | `ApprovalController.getPendingById()` | admin-operation or system-admin |
| POST | `/api/v1/users/{id}/approve` | `ApprovalController.approve()` | admin-operation or system-admin |
| POST | `/api/v1/users/{id}/reject` | `ApprovalController.reject()` | admin-operation or system-admin |
| GET | `/api/v1/users/{id}/pending-status` | `ApprovalController.getPendingStatus()` | JWT (self only) |
| PATCH | `/api/v1/users/{id}/approve-role` | `ApprovalController.assignRoleOnApprove()` | admin-operation or system-admin |

## 5. Component Structure

```
frontend/src/
├── pages/
│   ├── UsersPage.tsx                    ← Existing: user list (frontend/src/pages/UsersPage.tsx)
│   ├── admins/
│   │   ├── AdminList.tsx                ← Existing: admin list (frontend/src/pages/admins/AdminList.tsx)
│   │   ├── AdminForm.tsx                ← Existing: admin form (frontend/src/pages/admins/AdminForm.tsx)
│   │   └── PendingApprovalPage.tsx      ← NEW: admin panel: pending list + approve/reject
│   └── SelfRegistrationPage.tsx         ← NEW: public: self-registration form
├── components/
│   ├── DataTable.tsx                    ← Existing (frontend/src/components/DataTable.tsx)
│   ├── EmptyState.tsx                   ← Existing (frontend/src/components/EmptyState.tsx)
│   ├── LoadingSkeleton.tsx              ← Existing (frontend/src/components/LoadingSkeleton.tsx)
│   ├── SearchFilter.tsx                 ← Existing (frontend/src/components/SearchFilter.tsx)
│   ├── ToastNotification.tsx            ← Existing (frontend/src/components/ToastNotification.tsx)
│   ├── ConfirmModal.tsx                 ← Existing (frontend/src/components/ConfirmModal.tsx)
│   ├── AppLayout.tsx                    ← Existing (frontend/src/components/AppLayout.tsx)
│   └── PermissionGuard.tsx              ← Existing (frontend/src/components/PermissionGuard.tsx)
├── hooks/
│   ├── useUsers.ts                      ← Existing (frontend/src/hooks/useUsers.ts)
│   ├── usePermissions.ts                ← Existing (frontend/src/hooks/usePermissions.ts)
│   └── useRoles.ts                      ← Existing (frontend/src/hooks/useRoles.ts)
├── services/
│   ├── userService.ts                   ← Existing (frontend/src/services/userService.ts)
│   ├── adminService.ts                  ← Existing (frontend/src/services/adminService.ts)
│   ├── authApi.ts                       ← (new, follows frontend/src/services/ convention)
│   └── approvalService.ts               ← NEW: follows frontend/src/services/ convention (matching existing pattern)
├── types/
│   ├── user.ts                          ← Existing (frontend/src/types/user.ts)
│   ├── role.ts                          ← Existing (frontend/src/types/role.ts)
│   └── approval.ts                      ← NEW: PendingApproval, ApprovalNotification interfaces
├── store/
│   ├── authStore.ts                     ← Existing (frontend/src/store/authStore.ts)
│   └── permissionStore.ts               ← Existing (frontend/src/store/permissionStore.ts)
├── App.tsx                              ← Existing (frontend/src/App.tsx)
└── main.tsx                             ← Existing (frontend/src/main.tsx)
```

## 6. Database Schema (Flyway Migrations)

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

### V5__F-001_init_pending_approvals.sql (NEW)
```sql
-- Pending approvals table (approval workflow)
CREATE TABLE pending_approvals (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    full_name NVARCHAR(200),
    phone NVARCHAR(20),
    password_hash NVARCHAR(255) NOT NULL,
    requested_role_code VARCHAR(50) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by BIGINT NULL FOREIGN KEY REFERENCES user_accounts(id),
    rejection_reason NVARCHAR(500) NULL,
    approved_at DATETIME2 NULL,
    rejected_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE UNIQUE INDEX idx_pending_approvals_username ON pending_approvals(username);
CREATE UNIQUE INDEX idx_pending_approvals_email ON pending_approvals(email);
CREATE INDEX idx_pending_approvals_status ON pending_approvals(status);
CREATE INDEX idx_pending_approvals_status_created ON pending_approvals(status, created_at);

-- Approval notifications table
CREATE TABLE approval_notifications (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    pending_approval_id BIGINT NOT NULL FOREIGN KEY REFERENCES pending_approvals(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('USER', 'ADMIN')),
    recipient_email NVARCHAR(255),
    recipient_name NVARCHAR(200),
    notification_type VARCHAR(20) NOT NULL CHECK (notification_type IN ('APPROVAL_GRANTED', 'APPROVAL_REJECTED')),
    message NVARCHAR(MAX) NOT NULL,
    sent_at DATETIME2 NULL,
    sent BIT DEFAULT 0
);
GO

CREATE INDEX idx_approval_notifications_pending_id ON approval_notifications(pending_approval_id);
CREATE INDEX idx_approval_notifications_type ON approval_notifications(notification_type);
```

## 7. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + Repository | Low | Standard JPA entities, straightforward CRUD |
| Service Layer | Medium-High | Password policy, rate limiting, multi-step create flow |
| Security (JWT + 2FA) | High | JWT token lifecycle, TOTP QR generation, temp_token flow |
| Frontend (User CRUD) | Medium | Table with filters, form validation, role assignment modal |
| Frontend (Profile + 2FA) | Medium | QR code render, token verification flow |
| Approval Backend Service | High | Transactional multi-step operation (create user + role + notification + delete pending); anti-self-approval guard |
| Approval Frontend Admin Panel | High | Pending list table with approve/reject modal; role assignment dropdown |
| Self-Registration Form (Public) | Medium | Email/phone verification OTP flow; form validation; pending status check |
| Notification Service | Medium | Async email dispatch; notification record persistence; error handling for SMTP failures |
| **Overall** | **Very High** | Approval workflow adds significant cross-cutting complexity: new entities, new API layer, new admin UI, new async notification |

## 8. Sprint Breakdown (Original Waves 1–2)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–3) | Entities, Repositories, DTOs, V1–V4 migrations | DB schema ready, basic CRUD working |
| Sprint 2 (Days 4–6) | UserService, UserController, SecurityConfig, JwtFilter | Auth working, JWT token generation |
| Sprint 3 (Days 7–8) | PasswordResetService, TotpService, Auth endpoints | Forgot password + TOTP 2FA working |
| Sprint 4 (Days 9–11) | Frontend: UserListPage, UserTable, UserForm, APIs | Admin CRUD UI complete |
| Sprint 5 (Days 12–13) | Frontend: Profile page, RoleAssignmentModal, PasswordChangeModal | Profile + role management UI |
| Sprint 6 (Days 14) | Integration testing, E2E tests, fix bugs | Feature ready for QA |

## 9. Impacted Areas

### DevOps Triggers

| Area | DevOps Trigger | Action Required |
|---|---|---|
| Database schema change (V5) | NEW TABLES + INDEXES | Database migration review; MSSQL 2022 compatibility verified; deploy V5 migration with existing Flyway pipeline |
| New email service | SMTP configuration needed | Configure `spring.mail.*` properties (host, port, username, password, TLS) — requires env vars in `src/main/resources/application.yml` |
| Async email dispatch | `@Async` thread pool | Configure Spring async thread pool (`spring.task.execution.pool.*`) in application.yml |
| Rate limiting for self-registration | OTP verification before registration | Coordinate with M-010 (F-271) for email/phone verification endpoint integration |
| `admin-operation` role seeding | New role in roles table | Add seed data for `ADMIN_OPERATION` role in V2 migration or separate seed script |

### Designer Dependencies
- `PendingApprovalPage` admin UI design: Pending list table with approve/reject actions, role assignment dropdown
- `SelfRegistrationPage` public UI design: Registration form with email/phone verification, step-by-step flow
- `ApprovalActionModal` design: Approve (role selection) / Reject (reason input) modal components

## 10. Task Breakdown

### Backend Tasks (Estimated: 6–8 days total including approval)

**Package base**: `com.hanghai.kchtg` (all paths relative to this package, under `src/main/java/`)

#### Core Tasks (Waves 1–2, Unchanged)

| # | Task | File Path | Complexity | Dependency | Wave | Parallelizable | Risk |
|---|---|---|---|---|---|---|---|
| 1.1 | Entity: `UserAccount.java` | `com/hanghai/kchtg/user/entity/UserAccount.java` | Low | — | 1 | Yes | None |
| 1.2 | Entity: `Role.java` | `com/hanghai/kchtg/user/entity/Role.java` | Low | — | 1 | Yes | None |
| 1.3 | Entity: `UserRole.java` | `com/hanghai/kchtg/user/entity/UserRole.java` | Low | 1.2 | 1 | Yes | None |
| 1.4 | Entity: `PasswordResetToken.java` | `com/hanghai/kchtg/user/entity/PasswordResetToken.java` | Low | 1.1 | 1 | Yes | None |
| 1.5 | Repository: `UserRepository.java` | `com/hanghai/kchtg/user/repository/UserRepository.java` | Medium | 1.1 | 1 | Yes | None |
| 1.6 | Repository: `RoleRepository.java` | `com/hanghai/kchtg/user/repository/RoleRepository.java` | Low | 1.2 | 1 | Yes | None |
| 1.7 | Repository: `UserRoleRepository.java` | `com/hanghai/kchtg/user/repository/UserRoleRepository.java` | Medium | 1.3 | 1 | Yes | None |
| 1.8 | Repository: `PasswordResetTokenRepository.java` | `com/hanghai/kchtg/user/repository/PasswordResetTokenRepository.java` | Low | 1.4 | 1 | Yes | None |
| 1.9 | DTO: `UserCreateDTO`, `UserUpdateDTO`, `UserResponseDTO` | `com/hanghai/kchtg/user/dto/` | Low | 1.1 | 1 | Yes | None |
| 1.10 | Service: `UserService.java` | `com/hanghai/kchtg/user/service/UserService.java` | High | 1.5, 1.6, 1.7, 1.9 | 2 | No | Password policy validation, lockout logic |
| 1.11 | Service: `UserDetailsService (Spring Security)` | `com/hanghai/kchtg/security/UserDetailsServiceImpl.java` | Medium | 1.5 | 2 | No | JWT token generation |
| 1.12 | Service: `PasswordResetService.java` | `com/hanghai/kchtg/password/service/PasswordResetService.java` | Medium | 1.8 | 2 | No | Token expiration logic |
| 1.13 | Service: `TotpService.java` | `com/hanghai/kchtg/security/totp/service/TotpService.java` | Medium | 1.1 | 3 | No | QR code generation, OTP algorithm |
| 1.14 | Controller: `UserController.java` | `com/hanghai/kchtg/user/controller/UserController.java` | High | 1.10, 1.9 | 2 | No | Authorization logic |
| 1.15 | Controller: `AuthController.java` | `com/hanghai/kchtg/user/controller/AuthController.java` | High | 1.11, 1.12, 1.13 | 3 | No | Login, JWT, 2FA endpoints |
| 1.16 | Security: `JwtAuthenticationFilter.java` | `com/hanghai/kchtg/security/filter/JwtAuthenticationFilter.java` | High | — | 2 | No | JWT validation, token extraction |
| 1.17 | Security: `SecurityConfig.java` | `com/hanghai/kchtg/config/SecurityConfig.java` | High | 1.16 | 2 | No | Security filter chain, role-based access |
| 1.18 | Exception: `GlobalExceptionHandler.java` | `com/hanghai/kchtg/common/exception/GlobalExceptionHandler.java` | Medium | — | 2 | No | Error response standardization |
| 1.19 | Event: `AccessLogService.java` (audit log publishing) | `com/hanghai/kchtg/accesslog/service/AccessLogService.java` | Medium | 1.10 | 2 | No | Audit log publishing — **replaced non-existent UserAuditEventListener with existing AccessLogService** |
| 1.20 | Config: `application.yml` (JWT, password policy, rate limit) | `src/main/resources/application.yml` | Low | — | 1 | Yes | Configuration validation |

#### Approval Workflow Tasks (Wave 3, NEW)

| # | Task | File Path | Complexity | Dependency | Wave | Parallelizable | Risk |
|---|---|---|---|---|---|---|---|
| 1.21 | Entity: `PendingApproval.java` | `com/hanghai/kchtg/user/entity/PendingApproval.java` | Low | 1.1 (UserAccount ref) | 3 | Yes | None |
| 1.22 | Entity: `ApprovalNotification.java` | `com/hanghai/kchtg/user/entity/ApprovalNotification.java` | Low | 1.21 (PendingApproval ref) | 3 | Yes | None |
| 1.23 | Repository: `PendingApprovalRepository.java` | `com/hanghai/kchtg/user/repository/PendingApprovalRepository.java` | Medium | 1.21 | 3 | Yes | None |
| 1.24 | Repository: `ApprovalNotificationRepository.java` | `com/hanghai/kchtg/user/repository/ApprovalNotificationRepository.java` | Low | 1.22 | 3 | Yes | None |
| 1.25 | DTO: `PendingApprovalRequestDTO`, `PendingApprovalResponseDTO`, `ApprovalDecisionDTO` | `com/hanghai/kchtg/user/dto/` | Medium | 1.21, 1.22 | 3 | Yes | None |
| 1.26 | Service: `ApprovalService.java` (approve, reject, listPending, getPendingById) | `com/hanghai/kchtg/user/service/ApprovalService.java` | High | 1.23, 1.25, 1.10 | 3 | No | **Transactional multi-step operation; anti-self-approval guard; concurrent approval race condition** |
| 1.27 | Service: `ApprovalNotificationService.java` | `com/hanghai/kchtg/user/service/ApprovalNotificationService.java` | Medium | 1.24, 1.22 | 3 | Yes | None |
| 1.28 | Service: `NotificationEmailService.java` (async email via @Async or ApplicationEvent) | `com/hanghai/kchtg/user/service/NotificationEmailService.java` | Medium | 1.27 | 3 | Yes | SMTP configuration dependency |
| 1.29 | Controller: `ApprovalController.java` (all new approval endpoints) | `com/hanghai/kchtg/user/controller/ApprovalController.java` | High | 1.26, 1.17 | 3 | No | Security configuration for admin-operation role |
| 1.30 | Exception: `SelfApprovalException.java` | `com/hanghai/kchtg/user/exception/SelfApprovalException.java` | Low | — | 3 | Yes | None |
| 1.31 | Exception: `AccountPendingApprovalException.java` | `com/hanghai/kchtg/user/exception/AccountPendingApprovalException.java` | Low | — | 3 | Yes | None |

### Frontend Tasks (Estimated: 4–5 days total including approval)

**Base path**: `frontend/src/` (all paths relative to frontend project root)

#### Core Tasks (Waves 1–2, Unchanged)

| # | Task | File Path | Complexity | Dependency | Wave | Parallelizable | Risk |
|---|---|---|---|---|---|---|---|
| 2.1 | API client: `userService.ts` | `frontend/src/services/userService.ts` | Medium | 1.14 | 1 | Yes | None |
| 2.2 | API client: `authApi.ts` | `frontend/src/services/authApi.ts` | Medium | 1.15 | 1 | Yes | None |
| 2.3 | Type definitions: `user.ts` | `frontend/src/types/user.ts` | Low | 1.9 | 1 | Yes | None |
| 2.4 | Hook: `useUsers.ts` (pagination, filtering) | `frontend/src/hooks/useUsers.ts` | Medium | 2.1 | 1 | Yes | None |
| 2.5 | Page: `UsersPage.tsx` | `frontend/src/pages/UsersPage.tsx` | High | 2.1, 2.4 | 4 | No | Role-based action visibility |
| 2.6 | Page: `AdminListPage.tsx` (extends existing AdminList) | `frontend/src/pages/admins/AdminList.tsx` | Medium | 2.1 | 4 | No | None |
| 2.7 | Page: `AdminForm.tsx` | `frontend/src/pages/admins/AdminForm.tsx` | Medium | 2.1 | 4 | No | Form validation, password policy |
| 2.8 | Page: `UserDetailPage.tsx` | `frontend/src/pages/UserDetailPage.tsx` | Medium | 2.5 | 4 | No | None |
| 2.9 | Page: `ProfilePage.tsx` | `frontend/src/pages/ProfilePage.tsx` | Medium | 2.1 | 5 | No | Self-edit authorization |
| 2.10 | Component: `DataTable.tsx` (reuse existing) | `frontend/src/components/DataTable.tsx` | Low | — | 4 | Yes | Pagination, filtering, sticky header |
| 2.11 | Component: `UserForm.tsx` | `frontend/src/components/UserForm.tsx` | Medium | 2.3, 2.1 | 4 | Yes | Validation, error handling |
| 2.12 | Component: `RoleAssignmentModal.tsx` | `frontend/src/components/RoleAssignmentModal.tsx` | Medium | 2.3 | 4 | Yes | None |
| 2.13 | Component: `PasswordChangeModal.tsx` | `frontend/src/components/PasswordChangeModal.tsx` | Low | 2.2 | 5 | Yes | None |
| 2.14 | Component: `TotpSetupModal.tsx` | `frontend/src/components/TotpSetupModal.tsx` | Medium | 2.2 | 5 | Yes | QR code rendering, OTP input |
| 2.15 | Auth: `authStore.ts` | `frontend/src/store/authStore.ts` | High | 2.2 | 1 | No | Token management, role checking |
| 2.16 | Routing: add admin routes in `App.tsx` | `frontend/src/App.tsx` | Low | 2.5, 2.9 | 4 | Yes | Route guard for auth |

#### Approval Workflow Tasks (Wave 3, NEW)

| # | Task | File Path | Complexity | Dependency | Wave | Parallelizable | Risk |
|---|---|---|---|---|---|---|---|
| 2.17 | Page: `PendingApprovalPage.tsx` (admin panel for pending approval list + approve/reject actions) | `frontend/src/pages/admins/PendingApprovalPage.tsx` | High | 2.19, 2.21, 2.20 | 3 | No | **Admin UI design required; role assignment dropdown logic** |
| 2.18 | Page: `SelfRegistrationPage.tsx` (public form for self-registration with email/phone verification) | `frontend/src/pages/SelfRegistrationPage.tsx` | Medium | 2.19 | 3 | No | **Public UI design required; email/phone verification OTP flow** |
| 2.19 | API client: `approvalService.ts` | `frontend/src/services/approvalService.ts` | Medium | 1.29 | 3 | Yes | None |
| 2.20 | Component: `ApprovalActionModal.tsx` (approve with role assignment, reject with reason) | `frontend/src/components/ApprovalActionModal.tsx` | Medium | 2.19 | 3 | Yes | **Admin UI design required** |
| 2.21 | Component: `PendingApprovalTable.tsx` (table for pending list with approve/reject buttons) | `frontend/src/components/PendingApprovalTable.tsx` | Medium | 2.19, 2.3 | 3 | Yes | None |

## 11. Execution Sequence

### Wave 1: Core Foundation (Days 1–3)

| Sprint | Tasks | Deliverable | Owner Type |
|---|---|---|---|
| Sprint 1 (Days 1–3) | 1.1–1.8, 1.20, 2.1–2.4, 2.15, 2.16 | DB schema ready (V1–V4), basic entities/repositories, auth context, routing scaffolding | engineering-backend-developer, engineering-frontend-developer |

**Key deliverables**:
- UserAccount, Role, UserRole, PasswordResetToken entities + repositories
- V1–V4 Flyway migrations applied
- JWT authentication context + routing
- DTO foundations + API client scaffolding

**Parallel dispatch**: Tasks 1.1–1.8 (backend) + 2.1–2.4, 2.15, 2.16 (frontend) can be dispatched in parallel.

### Wave 2: Core User Management (Days 4–11)

| Sprint | Tasks | Deliverable | Owner Type |
|---|---|---|---|
| Sprint 2 (Days 4–6) | 1.9–1.11, 1.14, 1.16, 1.17, 1.18, 1.19 | User CRUD backend, JWT security filter chain, exception handling, audit events | engineering-backend-developer |
| Sprint 3 (Days 7–8) | 1.12–1.13, 1.15 | Password reset + TOTP 2FA backend | engineering-backend-developer |
| Sprint 4 (Days 9–11) | 2.5–2.12, 2.16 | Admin CRUD UI: user list, create, edit, detail, forms, modals, role assignment | engineering-frontend-developer |

**Key deliverables**:
- User management API (CRUD, lock/unlock, reset password)
- JWT auth + Spring Security configuration
- Admin user management UI with pagination, filtering, role assignment
- Password reset + TOTP 2FA backend

**Parallel dispatch**: Sprint 2 + Sprint 3 can run partially in parallel (Sprint 4 depends on Sprint 2 API availability).

### Wave 3: Approval Workflow (Days 15–22)

| Sprint | Tasks | Deliverable | Owner Type |
|---|---|---|---|
| Sprint 7 (Days 15–17) | 1.21–1.25, V5 migration | Approval DB schema ready, entities, repositories, DTOs | engineering-backend-developer |
| Sprint 8 (Days 18–20) | 1.26–1.29, 1.30–1.31 | Approval API backend working: approve/reject endpoints with transactions + anti-self-approval guard | engineering-backend-developer |
| Sprint 9 (Days 21–22) | 2.17–2.21 | Approval admin panel + self-registration form complete | engineering-frontend-developer |

**Key deliverables**:
- `pending_approvals` + `approval_notifications` tables deployed via Flyway V5
- Approval service with atomic `@Transactional` approve/reject operations
- Anti-self-approval guard
- Admin panel for reviewing pending approvals with approve/reject actions
- Public self-registration form with email/phone verification

**Parallel dispatch**: Sprint 7 (entities/repos) + 2.19 (approvalService.ts) can run in parallel. Sprint 8 (service/controller) + 2.20–2.21 (admin components) can partially parallelize. Sprint 9 completes approval frontend.

### Execution Timeline Summary

| Wave | Days | Tasks | Backend Hours | Frontend Hours |
|---|---|---|---|---|
| Wave 1 | 1–3 | 1.1–1.8, 1.20, 2.1–2.4, 2.15, 2.16 | ~16h | ~12h |
| Wave 2 | 4–11 | 1.9–1.19, 2.5–2.14 | ~40h | ~20h |
| Wave 3 | 15–22 | 1.21–1.31, 2.17–2.21 | ~24h | ~16h |
| **Total** | **22 days** | **31 backend + 21 frontend tasks** | **~80h** | **~48h** |

**Note**: There is a 3-day gap (Days 12–14) between Wave 2 and Wave 3 for integration testing of Waves 1–2 and QA validation before approval workflow begins.

## 12. Technical Dependencies

### Internal Dependencies
- **F-001 ApprovalService → M-010 F-271**: Self-registration requires email/phone verification via M-010's registration service. The public self-registration form (SelfRegistrationPage) must verify email/SMS OTP before creating a PendingApproval record.
- **F-001 ApprovalService → UserAccount**: On approve, creates UserAccount from PendingApproval data — depends on existing UserAccount entity.
- **F-001 ApprovalService → UserRole**: On approve, creates UserRole with assigned role code — depends on existing UserRole entity.
- **F-001 ApprovalController → SecurityConfig**: Approval endpoints require `@PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")` — depends on SecurityConfig being configured.
- **F-001 NotificationEmailService → SMTP infrastructure**: Requires `spring.mail.*` configuration in `src/main/resources/application.yml`.

### External Dependencies
- **SMTP server**: For sending approval notification emails (Mailgun, SendGrid, or internal SMTP). Requires credentials and TLS configuration.
- **MSSQL 2022**: Database server for Flyway migration V5. Must be available before Sprint 7.
- **Frontend design assets**: PendingApprovalPage and SelfRegistrationPage require UI design from designer before implementation.

### Module Dependency Map

```
M-001 (F-001)
├── consumes M-010 (F-271) for email/phone verification OTP
├── creates UserAccount → stored in M-001
├── creates UserRole → stored in M-001
└── depends on SMTP infrastructure for email notifications
```

## 13. Implementation Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Concurrent approval race condition**: Two admins approve the same pending request simultaneously | High | Medium | Use optimistic locking (`@Version`) on PendingApproval; one-at-a-time guard in service layer |
| **SMTP misconfiguration**: Email notifications fail silently | Medium | Medium | Add error handling in NotificationEmailService with retry + dead-letter; monitor SMTP connectivity |
| **Email/phone verification integration gap**: M-010 F-271 verification not available when F-001 approval workflow starts | High | Medium | Confirm M-010 completion status before Sprint 7; fallback: mock verification for development |
| **Anti-self-approval logic complexity**: Approver ID comparison may fail if principal ID not properly extracted | Medium | Low | Unit test the guard explicitly; log approver/applicant IDs for audit |
| **Transaction rollback on approval**: Multi-step approve (UserAccount + UserRole + notification + delete) fails mid-way | High | Low | Use `@Transactional(propagation = REQUIRED)` — if any step fails, entire transaction rolls back |
| **Admin UI design delay**: PendingApprovalPage and SelfRegistrationPage cannot be built without designer input | Medium | Medium | Get design specs before Sprint 7; use placeholder layouts if needed |
| **Database migration V5 conflicts**: Existing migration pipeline may have conflicts | Low | Low | Run Flyway migration in dry-run mode; test on staging DB first |
| **Role seeding**: `admin-operation` role not present in roles table at runtime | High | Medium | Add seed data for ADMIN_OPERATION role in V2 migration or separate seed script |

## 14. Developer Guidance

### Backend Development

#### Entity Guidelines
- `PendingApproval.java`: Use `@Column(unique = true)` for username and email; add `@ManyToOne` for `approvedBy` (UserAccount); use `LocalDateTime` for all date fields; add `@PrePersist` to set `createdAt`.
- `ApprovalNotification.java`: Use `@ManyToOne` for `pendingApproval` (cascade = DELETE); add CHECK constraint via JPA `@Column` for `recipientType` and `notificationType`; use `columnDefinition = "TEXT"` for message.

#### Service Guidelines
- **ApprovalService.approve()**: Must be `@Transactional`. Steps in order:
  1. Validate PendingApproval exists and status = 'pending'
  2. **Anti-self-approval guard**: `approverId != pendingApproval.approvedBy.id` (throw `SelfApprovalException`)
  3. Create UserAccount from PendingApproval data (status = 'active')
  4. Create UserRole with assignedRoleCode
  5. Update PendingApproval: status = 'approved', approvedBy, approvedAt
  6. Create ApprovalNotification (APPROVAL_GRANTED → USER)
  7. Create ApprovalNotification (APPROVAL_GRANTED → ADMIN for audit)
  8. Delete PendingApproval record
  9. Publish ApprovalDecisionEvent for async notification

- **ApprovalService.reject()**: Must be `@Transactional`. Steps:
  1. Validate PendingApproval exists and status = 'pending'
  2. **Anti-self-approval guard** (same as approve)
  3. Update PendingApproval: status = 'rejected', rejectionReason, rejectedAt
  4. Create ApprovalNotification (APPROVAL_REJECTED → USER with reason)
  5. Create ApprovalNotification (APPROVAL_REJECTED → ADMIN for audit)
  6. Delete PendingApproval record (or keep for audit — configurable via property)

- **NotificationEmailService**: Use Spring `@Async` for non-blocking email dispatch. Configure thread pool via `@EnableAsync` + `TaskExecutor` bean. Handle SMTP failures gracefully (log + retry + dead-letter).

#### Security Guidelines
- All approval endpoints require `@PreAuthorize("hasRole('ADMIN_OPERATION') or hasRole('SYSTEM_ADMIN')")`
- `GET /api/v1/users/{id}/pending-status` allows JWT-authenticated self-access (user can check their own pending status)
- Password in PendingApproval must be BCrypt hashed (never store plaintext)
- Rejection reason is visible only to admin with admin-operation role

#### Exception Handling
- Add new error codes to `GlobalExceptionHandler`:
  - `SELF_APPROVAL_DENIED` (HTTP 403)
  - `ACCOUNT_PENDING_APPROVAL` (HTTP 409)
  - `ROLE_NOT_FOUND` (HTTP 404)
- Use `@RestControllerAdvice` for consistent error response format

#### Repository Guidelines
- `PendingApprovalRepository`: Add methods `findByStatus(String status)`, `findByEmailAndStatus(String email, String status)`, `findByUsernameAndStatus(String username, String status)`, `countByStatus(String status)`
- `ApprovalNotificationRepository`: Add methods `findByPendingApprovalId(Long id)`, `findByNotificationType(String type)`

### Frontend Development

#### API Client Guidelines
- `approvalService.ts` (follows `frontend/src/services/` convention): Create axios instance with proper auth header. Endpoints:
  - `POST /api/v1/users/pending` — public (requires email/phone verification token)
  - `GET /api/v1/users/pending` — admin (Bearer token)
  - `GET /api/v1/users/pending/{id}` — admin (Bearer token)
  - `POST /api/v1/users/{id}/approve` — admin (Bearer token)
  - `POST /api/v1/users/{id}/reject` — admin (Bearer token)
  - `GET /api/v1/users/{id}/pending-status` — JWT self-access
  - `PATCH /api/v1/users/{id}/approve-role` — admin (Bearer token)

#### Component Guidelines
- `PendingApprovalPage`: Table with pagination (default 20 items/page, ordered by created_at DESC), action column with approve/reject buttons
- `ApprovalActionModal`: Two modes:
  - **Approve mode**: Role assignment dropdown (select from available roles), confirm button
  - **Reject mode**: Reason textarea (500 char max), confirm button
- `SelfRegistrationPage`: Public form (no auth required) with fields: username, email, full_name, phone, password. Must include email/phone verification step before submission.

#### State Management
- Use Zustand stores (following existing `frontend/src/store/` convention) for auth state management
- Invalidate cache on approve/reject action

### Database Migration Guidelines

#### V5__F-001_init_pending_approvals.sql
- Use MSSQL 2022 T-SQL syntax
- `IDENTITY(1,1)` for auto-increment
- `DATETIME2` for timestamps (not DATETIME)
- `SYSUTCDATETIME()` for default values
- Unique indexes on username and email (prevent duplicate registration)
- Composite index on `(status, created_at)` for admin list queries
- Foreign key references to `user_accounts(id)` for `approved_by`

## 15. QA Guidance

### Backend Testing Areas
1. **Unit tests**: Password policy validation (BR-001-01), unique email constraint (BR-001-03), lockout logic (BR-001-02)
2. **Approval workflow tests**:
   - Create pending approval → admin sees list → approve → user activated with role
   - Create pending approval → admin sees list → reject with reason → notification sent
   - Anti-self-approval guard: admin cannot approve own registration
   - One-at-a-time guard: only one pending request per email
   - Transaction rollback: if any step in approve fails, all changes rolled back
   - Role assignment on approve: assigned role matches admin selection
3. **Integration tests**: Spring Security JWT integration, `@Transactional` behavior, `@PreAuthorize` access control
4. **Email notification tests**: SMTP connectivity, async dispatch, error handling for delivery failures

### Frontend Testing Areas
1. **PendingApprovalPage**: List displays correctly, pagination works, approve/reject actions trigger modals
2. **SelfRegistrationPage**: Form validation, email/phone verification flow, pending status check
3. **ApprovalActionModal**: Approve with role assignment, reject with reason, form validation
4. **Permission UI**: Only admin-operation/system-admin can access approval pages; regular users see "pending status" only

### E2E Testing Areas
1. Full self-registration flow: user registers → email verification → pending approval → admin approves → user can login
2. Full rejection flow: user registers → email verification → pending approval → admin rejects with reason → user receives rejection notification
3. Anti-self-approval: admin tries to approve own request → error displayed

## 16. Migration/Rollout/Rollback Notes

### Database Migration
- **V5__F-001_init_pending_approvals.sql**: Deploy via Flyway with existing pipeline
- **Prerequisite**: V1–V4 migrations must be applied first (existing)
- **Rollback**: Drop `pending_approvals` and `approval_notifications` tables; remove indexes
- **Data migration**: None required (new tables only)

### Application Deployment
- **Environment variables needed**:
  - `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD`, `SPRING_MAIL_TLS_ENABLED`
  - `SPRING_TASK_EXECUTION_POOL_CORE_SIZE`, `SPRING_TASK_EXECUTION_POOL_MAX_SIZE` (for @Async)
  - All configured via `src/main/resources/application.yml` (profile-based: `dev`, `prod`)
- **Rollout strategy**: Blue-green or canary deployment (approval service is stateless)
- **Feature flag**: Consider feature flag for approval workflow to enable/disable without redeployment

### Rollback Plan
1. If approval workflow causes issues:
   - Disable approval endpoints via SecurityConfig (comment out approval route mappings)
   - Keep existing user CRUD functionality intact (independent service)
   - Rollback database migration V5 if data inconsistency detected
2. If SMTP configuration fails:
   - Temporarily disable email notifications (approve/reject still works, no email sent)
   - Configure SMTP in next deployment

### Seed Data
- Add `ADMIN_OPERATION` role to roles table (V2 migration or seed script):
  ```sql
  INSERT INTO roles (name, code, description, permissions, is_system) VALUES
  ('Admin Operation', 'ADMIN_OPERATION', 'Quản lý phê duyệt đăng ký và quản lý tài khoản admin', '{"resource":"pending_approvals","action":"read,write,approve,reject"}', 1);
  ```

## 17. Open Execution Questions

| Question | Impact | Owner | Status |
|---|---|---|---|
| Is M-010 F-271 (self-registration with OTP verification) complete and available for F-001 to consume? | High — Approval workflow depends on email/phone verification | Project Manager | **Need confirmation** |
| Which email provider will be used (Mailgun, SendGrid, internal SMTP)? | Medium — affects NotificationEmailService implementation | DevOps | **Need config** |
| Should rejected pending approvals be deleted or kept for audit trail? | Medium — affects database schema and ApprovalService.reject() logic | BA/SA | **Need decision** |
| Is the `admin-operation` role already seeded in the roles table, or does V5 need to include seed data? | High — if not seeded, approval endpoints will fail at authorization | DevOps | **Need action** |
| What is the OTP expiration window for email/phone verification before registration? | Medium — affects self-registration flow timing | BA | **Need spec** |
| Can SelfRegistrationPage be built as a standalone public page, or does it need to be integrated into M-010's auth flow? | Medium — affects routing and page location | SA | **Need clarification** |

## 18. Execution Readiness Verdict

### Pre-requisites Status

| Pre-requisite | Status | Notes |
|---|---|---|
| BA spec (feature-brief.md) | ✅ Complete | Updated with BR-001-09 through BR-001-12 |
| SA design (feature-brief.md) | ✅ Complete | Updated with approval workflow, entities, API endpoints |
| Database migration (V1–V4) | ✅ Ready | Existing migrations, V5 added |
| M-010 F-271 completion | ⚠️ Pending | **Must confirm before Sprint 7** — needed for email/phone verification |
| SMTP configuration | ⚠️ Pending | **Must configure before Sprint 8** — needed for NotificationEmailService |
| `admin-operation` role seed | ⚠️ Pending | **Must seed before deployment** — needed for @PreAuthorize |
| Frontend design specs | ⚠️ Pending | **Must be delivered before Sprint 7** — needed for PendingApprovalPage, SelfRegistrationPage |
| implementations.yaml | ✅ Updated | Services[] populated with 8 approval-related services |

### Risk Assessment

| Risk Level | Count | Items |
|---|---|---|
| High | 2 | Concurrent approval race condition; M-010 integration dependency |
| Medium | 4 | SMTP misconfiguration; Anti-self-approval logic; Admin UI design delay; Role seeding |
| Low | 2 | Transaction rollback; Database migration conflicts |

### Verdict Summary
- **Waves planned**: 3 waves (core foundation, user management, approval workflow)
- **Owner-type split**: engineering-backend-developer (11 backend + 11 approval backend), engineering-frontend-developer (16 frontend + 5 approval frontend)
- **services[] populated**: 8 approval services added to implementations.yaml
- **Blockers**: M-010 F-271 completion status, SMTP configuration, `admin-operation` role seed, frontend design specs

---

<verdict_envelope>
  <verdict>Need-clarification</verdict>
  <confidence>medium</confidence>
  <structured_summary>
    <key_findings>
      <item>3 waves planned: Wave 1 (core foundation, Days 1-3), Wave 2 (user management, Days 4-11), Wave 3 (approval workflow, Days 15-22)</item>
      <item>Owner-type split: engineering-backend-developer (11 core + 11 approval backend), engineering-frontend-developer (16 core + 5 approval frontend)</item>
      <item>services[] populated: 8 approval services added to implementations.yaml (ApprovalService, ApprovalNotificationService, NotificationEmailService, ApprovalController + 4 related)</item>
      <item>31 backend tasks (1.1-1.31) and 21 frontend tasks (2.1-2.21) documented</item>
      <item>7 new approval API endpoints documented</item>
      <item>Database migration V5__F-001_init_pending_approvals.sql included with full SQL</item>
      <item>Anti-self-approval guard, @Transactional approve/reject, optimistic locking identified</item>
      <item>Path corrections: backend uses com.hanghai.kchtg (not vn.eg.hanghai); frontend uses frontend/src/ (not src/); UserAuditEventListener replaced with existing AccessLogService.java</item>
    </key_findings>
    <artifacts_produced>
      <item>docs/modules/M-001-quan-tri-he-thong/_features/F-001-quan-ly-tai-khoan-nguoi-dung/tech-lead/04-plan.md</item>
      <item>docs/modules/M-001-quan-tri-he-thong/_features/F-001-quan-ly-tai-khoan-nguoi-dung/implementations.yaml (services[] updated)</item>
    </artifacts_produced>
  </structured_summary>
  <blockers>
    <blocker>
      <code>M-010-F-271-COMPLETION</code>
      <description>F-001 approval workflow depends on M-010 F-271 (email/phone verification) for self-registration OTP flow. Sprint 7 (approval workflow) cannot start until M-010 F-271 is confirmed complete. Next action: Project Manager confirm M-010 F-271 status before dispatching Sprint 7 tasks.</description>
    </blocker>
    <blocker>
      <code>SMTP-CONFIG-NEEDED</code>
      <description>NotificationEmailService requires SMTP configuration (host, port, credentials, TLS). Next action: DevOps configure spring.mail.* environment variables before Sprint 8.</description>
    </blocker>
    <blocker>
      <code>ADMIN-OPERATION-ROLE-SEED</code>
      <description>The admin-operation role must be seeded in the roles table for @PreAuthorize("hasRole('ADMIN_OPERATION')") to work. Next action: Add ADMIN_OPERATION seed data to V2 migration or separate seed script before deployment.</description>
    </blocker>
    <blocker>
      <code>FRONTEND-DESIGN-REQUIRED</code>
      <description>PendingApprovalPage and SelfRegistrationPage require UI design before Sprint 7. Next action: Designer deliver specs for admin approval panel and public registration form.</description>
    </blocker>
  </blockers>
</verdict_envelope>
