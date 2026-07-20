# Tech Lead Plan: M-001 — Quản trị hệ thống

## Module Overview

Module M-001 Quản trị hệ thống gồm **4 features** cung cấp lõi quản trị người dùng, phân
quyền RBAC, tổ chức và audit cho dự án Hàng Hải (KCHTGT).

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Security + Spring Data JPA
- Frontend: React 18 + Vite + TypeScript + Ant Design
- Database: MSSQL 2022 (Flyway quản lý schema)
- Build: Maven, npm

> **Ghi chú scope (audit #5, 2026-07-07):** Plan này đã được viết lại cho đúng 4-feature
> thực tế của module. Bản cũ mô tả nhầm 7 features (kèm F-004 admin, F-006 GIS/GeoServer,
> F-007 liên thông) — các domain đó thuộc module khác (GIS: M-007/M-012; liên thông: M-009).
> F-006 (AdminAccount) đã bị gỡ ở commit `463138f7` / migration `V28`; quyền admin nay chỉ là
> một `Role` trong RBAC của F-001.

---

## Feature Summary

| # | Feature | Slug | Complexity |
|---|---|---|---|
| F-001 | Quản lý tài khoản người dùng | quan-ly-tai-khoan-nguoi-dung | High |
| F-002 | Quản lý nhóm người dùng | quan-ly-nhom-nguoi-dung | Medium |
| F-003 | Quản lý đơn vị | quan-ly-don-vi | High |
| F-005 | Quản lý log truy cập | quan-ly-log-truy-cap | Medium |

---

## Implementation Order (Recommended)

Theo dependency giữa các feature:

### Wave 1: Core Identity & Access (F-001)
1. **F-001** User Account Management — nền tảng: `User`, `Role`, RBAC (`UserPermissionOverride`),
   JWT + TOTP, password policy, luồng phê duyệt (`PendingApproval`).

### Wave 2: Organization & Membership (F-002, F-003)
2. **F-002** User Group Management — phụ thuộc `User` từ F-001.
3. **F-003** Unit Management — cây tổ chức (Materialized Path), phụ thuộc `User`.

### Wave 3: Audit & Monitoring (F-005)
4. **F-005** Access Log Management — ghi log mọi thao tác từ Wave 1–2 (append-only).

---

## Backend Package Structure

Kiến trúc **feature-sliced** dưới `com.hanghai.kchtg`:

```
src/main/java/com/hanghai/kchtg/
├── user/                      # F-001
│   ├── entity/                #   User, Role, Permission, UserPermissionOverride,
│   │                          #   PasswordResetToken, PendingApproval, ApprovalNotification,
│   │                          #   AccountRegistrationAudit, LoginAuditLog, VerificationToken
│   ├── repository/
│   ├── service/               #   UserService, TotpService, PasswordReset...
│   └── controller/            #   UserController, AuthController, RoleController,
│                              #   PermissionController, PasswordResetController,
│                              #   RegistrationController, RegisterConfigController,
│                              #   TotpSetupController, VerificationController, ApprovalController
├── group/                     # F-002
│   ├── entity/                #   UserGroup, GroupMember, GroupHistory
│   ├── repository/ · service/
│   └── controller/            #   GroupController
├── orgunit/                   # F-003
│   ├── entity/                #   OrgUnit, UnitHistory, OrganizationChart
│   ├── repository/ · service/
│   └── controller/            #   OrgUnitController
├── accesslog/                 # F-005
│   ├── entity/                #   AccessLog, LogRetentionPolicy, LogAggregate
│   ├── repository/ · service/
│   ├── interceptor/           #   AccessLogInterceptor (async via AsyncLogAppender)
│   └── controller/            #   AccessLogController, LogExportController
├── admin/                     # F-005 support
│   └── entity/AdminAuditLog   #   Bảng admin_audit_logs — GIỮ LẠI (V28), do AccessLogInterceptor dùng
└── security/                  # shared: JwtAuthenticationFilter, SecurityConfig,
                               #   PermissionAuthorizationManager
```

---

## Database Schema Summary

| Table | Feature | Ghi chú |
|---|---|---|
| `app_users` | F-001 | Tài khoản người dùng + role chính |
| `app_roles` | F-001 | Định nghĩa role (seeded) |
| `user_permission_override` | F-001 | Override quyền theo user (allow/deny) |
| `password_reset_tokens` | F-001 | Luồng đặt lại mật khẩu |
| `pending_approvals` | F-001 | Hàng chờ phê duyệt tài khoản |
| `approval_notifications` | F-001 | Thông báo phê duyệt |
| `account_registration_audit` | F-001 | Audit đăng ký tài khoản |
| `user_groups` | F-002 | Định nghĩa nhóm |
| `group_members` | F-002 | Junction nhóm–user |
| `group_histories` | F-002 | Audit trail nhóm (BR-015) |
| `org_units` | F-003 | Cây đơn vị (Materialized Path) |
| `unit_history` | F-003 | Audit trail đơn vị |
| `organization_chart` | F-003 | Sơ đồ tổ chức |
| `access_logs` | F-005 | Audit truy cập hệ thống (append-only) |
| `log_retention_policies` | F-005 | Cấu hình lưu trữ log |
| `log_aggregates` | F-005 | Thống kê ngày (pre-computed) |
| `admin_audit_logs` | F-005 | Giữ lại từ V28; dùng bởi AccessLogInterceptor |

> Các bảng `admin_accounts`, `admin_permissions`, `admin_recovery_tokens` đã **DROP** ở
> `V28__cleanup_f006_redundant_tables.sql` (trùng RBAC của F-001).

---

## API Surface (theo BA lean-spec)

Chi tiết endpoint + business rule xem `ba/00-lean-spec.md`. Tóm tắt:

- **F-001** — `/api/users`, `/api/users/me`, `/api/users/{id}/lock|unlock|status|reset-password`,
  `/api/auth/login`, `/api/auth/login/totp`
- **F-002** — `/api/groups`, `/api/groups/{id}/members`, `/api/groups/{id}/copy`, `/api/groups/{id}/history`
- **F-003** — `/api/org-units` (CRUD + hierarchy)
- **F-005** — `/api/access-logs`, `/api/logs/export/csv`, `/api/logs/alerts/failures`,
  `/api/logs/stats/daily`, `/api/logs/retention`

### RBAC (xem `ba/00-lean-spec.md` §4 — Permission Invalidation Strategy)
- Authentication: JWT dual-token + 2-phase TOTP MFA.
- Authorization: Spring Security `@PreAuthorize` + `PermissionAuthorizationManager`.
- Precedence: `Override ∪ Group ∪ Role` (Override deny thắng).
- Invalidation: `permission_version` + cache Redis `user_perms:{user_id}` (TTL 5–10 phút).

---

## Dependencies Between Features

| Depends On | Feature | Reason |
|---|---|---|
| — | F-001 | Nền tảng: `User`, `Role` |
| F-001 | F-002 | `GroupMember` tham chiếu `User` |
| F-001 | F-003 | `OrgUnit.created_by` tham chiếu `User` |
| F-001, F-002, F-003 | F-005 | `AccessLog` ghi audit cho mọi thao tác |

---

## Complexity Assessment

| Feature | Complexity | Primary Risk |
|---|---|---|
| F-001 | High | JWT + TOTP 2FA, rate limiting, permission versioning/cache invalidation |
| F-002 | Medium | Transactional copy (nhóm + members), delete-guard khi còn member |
| F-003 | High | Materialized Path tree, quy trình phê duyệt cấu trúc |
| F-005 | Medium | Async log writing, immutability guard (BR-025), batch cleanup + stats |

---

## Detailed Plans

Per-feature detailed plans:

1. [F-001 Tech Lead Plan](../_features/F-001-quan-ly-tai-khoan-nguoi-dung/tech-lead/04-plan.md)
2. [F-002 Tech Lead Plan](../_features/F-002-quan-ly-nhom-nguoi-dung/tech-lead/04-plan.md)
3. [F-003 Tech Lead Plan](../_features/F-003-quan-ly-don-vi/tech-lead/04-plan.md)
4. [F-005 Tech Lead Plan](../_features/F-005-quan-ly-log-truy-cap/tech-lead/04-plan.md)
