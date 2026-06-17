# Tech Lead Plan: F-004 — Quản lý tài khoản admin

## 1. Implementation Tasks

### Backend Tasks (Estimated: 3.5–4.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 1.1 | Entity: `AdminAccount.java` | `src/main/java/vn/eg/haihang/model/entity/AdminAccount.java` | Medium |
| 1.2 | Entity: `AdminPermission.java` | `src/main/java/vn/eg/haihang/model/entity/AdminPermission.java` | Medium |
| 1.3 | Entity: `AdminAuditLog.java` | `src/main/java/vn/eg/haihang/model/entity/AdminAuditLog.java` | Low |
| 1.4 | Entity: `AdminRecoveryToken.java` | `src/main/java/vn/eg/haihang/model/entity/AdminRecoveryToken.java` | Low |
| 1.5 | Repository: `AdminAccountRepository.java` | `src/main/java/vn/eg/haihang/repository/AdminAccountRepository.java` | Medium |
| 1.6 | Repository: `AdminPermissionRepository.java` | `src/main/java/vn/eg/haihang/repository/AdminPermissionRepository.java` | Medium |
| 1.7 | Repository: `AdminAuditLogRepository.java` | `src/main/java/vn/eg/haihang/repository/AdminAuditLogRepository.java` | Medium |
| 1.8 | Repository: `AdminRecoveryTokenRepository.java` | `src/main/java/vn/eg/haihang/repository/AdminRecoveryTokenRepository.java` | Low |
| 1.9 | DTO: `AdminCreateDTO`, `AdminUpdateDTO`, `AdminLoginDTO`, `PermissionGrantDTO` | `src/main/java/vn/eg/haihang/dto/` | Medium |
| 1.10 | Service: `AdminService.java` | `src/main/java/vn/eg/haihang/service/AdminService.java` | High |
| 1.11 | Service: `AdminAuthService.java` (login + MFA flow) | `src/main/java/vn/eg/haihang/service/AdminAuthService.java` | High |
| 1.12 | Service: `AdminPermissionService.java` (JSON policy eval) | `src/main/java/vn/eg/haihang/service/AdminPermissionService.java` | High |
| 1.13 | Service: `AdminUnlockService.java` (dual-approval) | `src/main/java/vn/eg/haihang/service/AdminUnlockService.java` | High |
| 1.14 | Service: `AdminAuditService.java` (AOP aspect) | `src/main/java/vn/eg/haihang/service/AdminAuditService.java` | Medium |
| 1.15 | Service: `TokenFactory.java` (JWT, temp_token, recovery) | `src/main/java/vn/eg/haihang/factory/TokenFactory.java` | Medium |
| 1.16 | Controller: `AdminAuthController.java` | `src/main/java/vn/eg/haihang/controller/AdminAuthController.java` | High |
| 1.17 | Controller: `AdminController.java` | `src/main/java/vn/eg/haihang/controller/AdminController.java` | High |
| 1.18 | Security: `AdminJwtFilter.java` (separate from user filter) | `src/main/java/vn/eg/haihang/security/AdminJwtFilter.java` | High |
| 1.19 | Aspect: `AdminAuditAspect.java` (@AdminAudit annotation) | `src/main/java/vn/eg/haihang/aspect/AdminAuditAspect.java` | Medium |
| 1.20 | Builder: `PermissionPolicyBuilder.java` | `src/main/java/vn/eg/haihang/builder/PermissionPolicyBuilder.java` | Medium |
| 1.21 | Config: Admin JWT, MFA, dual-approval timeout | `src/main/resources/application.yml` | Low |

### Frontend Tasks (Estimated: 2.5–3.5 days)

| # | Task | File Path | Complexity |
|---|---|---|---|
| 2.1 | API client: `adminApi.ts` | `src/services/api/adminApi.ts` | Medium |
| 2.2 | Type definitions: `adminTypes.ts` | `src/types/adminTypes.ts` | Medium |
| 2.3 | Hook: `useAdmins.ts` (pagination, filtering) | `src/hooks/useAdmins.ts` | Medium |
| 2.4 | Page: `AdminListPage.tsx` | `src/pages/super-admin/AdminListPage.tsx` | High |
| 2.5 | Page: `AdminDetailPage.tsx` | `src/pages/super-admin/AdminDetailPage.tsx` | Medium |
| 2.6 | Page: `AdminCreatePage.tsx` | `src/pages/super-admin/AdminCreatePage.tsx` | Medium |
| 2.7 | Page: `AdminPermissionsPage.tsx` | `src/pages/super-admin/AdminPermissionsPage.tsx` | High |
| 2.8 | Page: `AdminAuditLogPage.tsx` | `src/pages/super-admin/AdminAuditLogPage.tsx` | Medium |
| 2.9 | Page: `AdminLockoutPage.tsx` | `src/pages/super-admin/AdminLockoutPage.tsx` | Medium |
| 2.10 | Component: `AdminTable.tsx` | `src/components/super-admin/AdminTable.tsx` | Medium |
| 2.11 | Component: `AdminForm.tsx` | `src/components/super-admin/AdminForm.tsx` | Medium |
| 2.12 | Component: `PermissionMatrixTable.tsx` | `src/components/super-admin/PermissionMatrixTable.tsx` | High |
| 2.13 | Component: `DualApprovalModal.tsx` | `src/components/super-admin/DualApprovalModal.tsx` | Medium |
| 2.14 | Component: `AuditLogViewer.tsx` | `src/components/super-admin/AuditLogViewer.tsx` | Medium |
| 2.15 | Auth: `superAdminGuard.tsx` (route protection) | `src/guards/superAdminGuard.tsx` | High |
| 2.16 | Routing: add super-admin routes | `src/App.tsx` | Low |

---

## 2. API Routes

| Method | Path | Handler | Auth |
|---|---|---|---|
| GET | `/api/v1/admins` | `AdminController.listAdmins()` | super-admin |
| GET | `/api/v1/admins/{id}` | `AdminController.getAdminById()` | super-admin |
| POST | `/api/v1/admins` | `AdminController.createAdmin()` | super-admin |
| PUT | `/api/v1/admins/{id}` | `AdminController.updateAdmin()` | super-admin |
| DELETE | `/api/v1/admins/{id}` | `AdminController.deleteAdmin()` | super-admin |
| POST | `/api/v1/admins/login` | `AdminAuthController.login()` | Public |
| POST | `/api/v1/admins/login/totp/verify` | `AdminAuthController.verifyTotp()` | Public (temp_token) |
| POST | `/api/v1/admins/forgot-password` | `AdminAuthController.forgotPassword()` | Public |
| POST | `/api/v1/admins/reset-password` | `AdminAuthController.resetPassword()` | Public (token) |
| POST | `/api/v1/admins/change-password` | `AdminAuthController.changePassword()` | JWT (admin) |
| PATCH | `/api/v1/admins/{id}/lock` | `AdminController.lockAdmin()` | super-admin |
| PATCH | `/api/v1/admins/{id}/unlock` | `AdminController.unlockAdmin()` | super-admin (x2) |
| GET | `/api/v1/admins/lockout-log` | `AdminController.getLockoutLog()` | super-admin |
| GET | `/api/v1/admins/{id}/permissions` | `AdminController.getPermissions()` | super-admin |
| POST | `/api/v1/admins/{id}/permissions` | `AdminController.grantPermission()` | super-admin |
| DELETE | `/api/v1/admins/{id}/permissions/{permId}` | `AdminController.revokePermission()` | super-admin |
| GET | `/api/v1/admins/{id}/modules` | `AdminController.getModuleAccess()` | super-admin |
| GET | `/api/v1/admins/{id}/audit-log` | `AdminController.getAdminAuditLog()` | super-admin |
| GET | `/api/v1/admins/audit-log` | `AdminController.getAllAuditLogs()` | super-admin |

---

## 3. Component Structure

```
src/
├── pages/
│   └── super-admin/
│       ├── AdminListPage.tsx            ← Bảng admin với type/status filters
│       ├── AdminDetailPage.tsx          ← Chi tiết admin + tabs
│       ├── AdminCreatePage.tsx          ← Form tạo admin + MFA setup
│       ├── AdminPermissionsPage.tsx     ← Ma trận phân quyền module
│       ├── AdminAuditLogPage.tsx        ← Bảng audit log tìm kiếm
│       └── AdminLockoutPage.tsx         ← Lịch sử khóa/mở khóa
├── components/
│   └── super-admin/
│       ├── AdminTable.tsx               ← Bảng phân trang Ant Design
│       ├── AdminForm.tsx                ← Form (username, email, type, module access)
│       ├── PermissionMatrixTable.tsx    ← Grid: modules × permissions checkboxes
│       ├── DualApprovalModal.tsx        ← Modal 2-of-3 approval workflow
│       └── AuditLogViewer.tsx           ← Timeline/detail viewer
├── hooks/
│   └── useAdmins.ts                     ← React Query hook (list, get, CRUD, audit)
├── services/
│   └── api/
│       └── adminApi.ts                  ← axios instance + admin endpoints
├── types/
│   └── adminTypes.ts                    ← AdminAccount, AdminPermission, AdminAuditLog
├── guards/
│   └── superAdminGuard.tsx              ← Route guard for super-admin role
└── App.tsx                              ← Router thêm routes super-admin/admins/*
```

---

## 4. Database Schema (Flyway Migrations)

### V1__F-004_init_admin_accounts.sql
```sql
-- Admin Accounts table
CREATE TABLE admin_accounts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) NOT NULL,
    email NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    admin_type VARCHAR(30) NOT NULL CHECK (admin_type IN ('super', 'system', 'security')),
    module_access NVARCHAR(MAX),  -- JSON: ["M-001", "M-002", ...]
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'suspended')),
    mfa_enabled BIT DEFAULT 1,
    mfa_secret VARCHAR(100) NULL,  -- TOTP base32
    lockout_count INT DEFAULT 0,
    locked_until DATETIME2 NULL,
    last_login_at DATETIME2 NULL,
    created_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
);
GO

CREATE UNIQUE INDEX idx_admin_accounts_username ON admin_accounts(username);
CREATE UNIQUE INDEX idx_admin_accounts_email ON admin_accounts(email);
CREATE INDEX idx_admin_accounts_type ON admin_accounts(admin_type);
CREATE INDEX idx_admin_accounts_status ON admin_accounts(status);

CREATE TRIGGER trg_admin_accounts_updated
ON admin_accounts
AFTER UPDATE
AS
BEGIN
    UPDATE admin_accounts SET updated_at = SYSUTCDATETIME()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- Seed: Initial super-admin
INSERT INTO admin_accounts (username, email, password_hash, admin_type, module_access, status, mfa_enabled)
VALUES ('superadmin', 'superadmin@eg.gov.vn', '$2a$10$...BCRYPT_HASH...', 'super', '["M-001","M-002","M-003","M-004","M-005","M-006","M-007"]', 'active', 1);
```

### V2__F-004_init_admin_permissions.sql
```sql
-- Admin Permissions (fine-grained)
CREATE TABLE admin_permissions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id BIGINT NOT NULL FOREIGN KEY REFERENCES admin_accounts(id) ON DELETE CASCADE,
    module_id VARCHAR(10) NOT NULL,
    permissions NVARCHAR(MAX) NOT NULL,  -- JSON: ["read", "write", "delete", "approve"]
    granted_by BIGINT FOREIGN KEY REFERENCES admin_accounts(id),
    granted_at DATETIME2 DEFAULT SYSUTCDATETIME(),
    expires_at DATETIME2 NULL
);
GO

CREATE INDEX idx_admin_perm_admin_id ON admin_permissions(admin_id);
CREATE INDEX idx_admin_perm_module_id ON admin_permissions(module_id);
```

### V3__F-004_init_admin_audit_logs.sql
```sql
-- Admin Audit Log (append-only)
CREATE TABLE admin_audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id BIGINT NOT NULL FOREIGN KEY REFERENCES admin_accounts(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('create','update','delete','lock','unlock','login','permission_grant','permission_revoke')),
    target NVARCHAR(200),
    details NVARCHAR(MAX),  -- JSON full payload diff
    ip_address VARCHAR(45),
    user_agent NVARCHAR(500),
    performed_at DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

CREATE INDEX idx_admin_audit_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_performed_at ON admin_audit_logs(performed_at);
CREATE INDEX idx_admin_audit_action ON admin_audit_logs(action);
```

### V4__F-004_init_admin_recovery_tokens.sql
```sql
-- Admin Recovery Tokens
CREATE TABLE admin_recovery_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    admin_id BIGINT NOT NULL FOREIGN KEY REFERENCES admin_accounts(id) ON DELETE CASCADE,
    token NVARCHAR(255) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    used_at DATETIME2 NULL
);
GO

CREATE INDEX idx_admin_recovery_admin_id ON admin_recovery_tokens(admin_id);
CREATE INDEX idx_admin_recovery_token ON admin_recovery_tokens(token);
```

---

## 5. Estimated Complexity

| Area | Complexity | Notes |
|---|---|---|
| Entity + Repository | Medium | Self-referencing (granted_by, performed_by), JSON columns |
| Dual-Approval Unlock | High | 2-of-3 approval workflow with temp table + notification |
| AOP Audit Logging | Medium | @Aspect auto-capture of all admin mutations |
| Admin Auth (MFA) | High | Separate JWT filter, temp_token TOTP flow, recovery tokens |
| Permission Policy Engine | High | JSON policy evaluation at runtime for module access |
| Frontend (Permission Matrix) | High | Grid of modules × permissions with checkboxes |
| **Overall** | **High** | Most security-sensitive feature, dual-approval + MFA + AOP audit |

---

## 6. Sprint Breakdown (Wave 1)

| Sprint | Tasks | Deliverable |
|---|---|---|
| Sprint 1 (Days 1–2) | Entities, Repositories, DTOs, V1–V4 migrations | DB schema ready |
| Sprint 2 (Days 3–4) | AdminAuthService, AdminAuthController, AdminJwtFilter | Admin login + MFA + JWT working |
| Sprint 3 (Days 5–6) | AdminService, AdminPermissionService, AdminController | Admin CRUD + permissions |
| Sprint 4 (Day 7) | AdminUnlockService (dual-approval), AdminAuditService + Aspect | Unlock workflow + audit logging |
| Sprint 5 (Days 8–9) | Frontend: AdminListPage, AdminTable, AdminForm, APIs | Admin CRUD UI |
| Sprint 6 (Days 10–11) | Frontend: PermissionMatrix, AuditLogViewer, DualApprovalModal | Permission + audit UI |
| Sprint 7 (Day 12) | Integration testing, E2E tests | Feature ready for QA |
