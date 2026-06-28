# Tech Lead Plan: M-001 — Quản trị hệ thống

## Module Overview

Module M-001 Quản trị hệ thống contains 7 features covering the complete admin panel for the Hàng Hải project.

**Tech Stack:**
- Backend: Spring Boot 3.x + Spring Security + Spring Data JPA
- Frontend: React 18 + Vite + TypeScript + Ant Design
- Database: MSSQL 2022
- GIS: GeoServer (for F-006)
- Build: Maven, npm

---

## Feature Summary

| # | Feature | Slug | Complexity | Est. Effort |
|---|---|---|---|---|
| F-001 | Quản lý tài khoản người dùng | quan-ly-tai-khoan-nguoi-dung | High | 6 sprints (14 days) |
| F-002 | Quản lý nhóm người dùng | quan-ly-nhom-nguoi-dung | Medium | 6 sprints (9 days) |
| F-003 | Quản lý đơn vị | quan-ly-don-vi | High | 6 sprints (10 days) |
| F-004 | Quản lý tài khoản admin | quan-ly-tai-khoan-admin | High | 7 sprints (12 days) |
| F-005 | Quản lý log truy cập | quan-ly-log-truy-cap | Medium | 7 sprints (10 days) |
| F-006 | Quản lý biểu tượng bản đồ | quan-ly-bieu-tuong-ban-do | High | 7 sprints (11 days) |
| F-007 | Quản lý kết nối liên thông chia dữ liệu | quan-ly-ket-noi-lien-thong-chia-du-lieu | Medium-High | 7 sprints (10 days) |

**Total estimated effort: ~40-50 man-days**

---

## Implementation Order (Recommended)

Based on feature dependencies, implement in this order:

### Wave 1: Core Identity & Access (F-001, F-004)
1. **F-001** User Account Management — foundational entities (UserAccount, Role, UserRole)
2. **F-004** Admin Account Management — super-admin layer on top of F-001

Both features share authentication infrastructure (JWT, TOTP, password policies).

### Wave 2: Organization & Membership (F-002, F-003)
3. **F-002** User Group Management — depends on UserAccount from F-001
4. **F-003** Unit Management — organizational hierarchy, depends on UserAccount

### Wave 3: Audit & Monitoring (F-005)
5. **F-005** Access Log Management — logs all operations from Waves 1–2

### Wave 4: Domain-Specific (F-006, F-007)
6. **F-006** Map Symbol Management — GIS integration with GeoServer
7. **F-007** Data Connection Management — external system integration

---

## Backend Package Structure

```
src/main/java/vn/eg/haihang/
├── model/
│   └── entity/
│       ├── UserAccount.java          # F-001
│       ├── Role.java                 # F-001
│       ├── UserRole.java             # F-001
│       ├── PasswordResetToken.java   # F-001
│       ├── UserGroup.java            # F-002
│       ├── GroupMember.java          # F-002
│       ├── GroupHistory.java         # F-002
│       ├── Unit.java                 # F-003
│       ├── UnitHistory.java          # F-003
│       ├── OrganizationChart.java    # F-003
│       ├── AdminAccount.java         # F-004
│       ├── AdminPermission.java      # F-004
│       ├── AdminAuditLog.java        # F-004
│       ├── AdminRecoveryToken.java   # F-004
│       ├── AccessLog.java            # F-005
│       ├── LogRetentionPolicy.java   # F-005
│       ├── LogAggregate.java         # F-005
│       ├── MapSymbol.java            # F-006
│       ├── SymbolUsage.java          # F-006
│       ├── SymbolLibrary.java        # F-006
│       ├── DataConnection.java       # F-007
│       ├── SyncLog.java              # F-007
│       └── ConnectionHealth.java     # F-007
├── repository/
│   ├── UserRepository.java           # F-001
│   ├── RoleRepository.java           # F-001
│   ├── UserGroupRepository.java      # F-002
│   ├── GroupMemberRepository.java    # F-002
│   ├── UnitRepository.java           # F-003
│   ├── AdminAccountRepository.java   # F-004
│   ├── AdminPermissionRepository.java# F-004
│   ├── AdminAuditLogRepository.java  # F-004
│   ├── AccessLogRepository.java      # F-005
│   ├── MapSymbolRepository.java      # F-006
│   ├── DataConnectionRepository.java # F-007
│   └── ... (remaining repos)
├── dto/
│   ├── user/                         # F-001 DTOs
│   ├── group/                        # F-002 DTOs
│   ├── unit/                         # F-003 DTOs
│   ├── admin/                        # F-004 DTOs
│   ├── log/                          # F-005 DTOs
│   ├── map/                          # F-006 DTOs
│   └── connection/                   # F-007 DTOs
├── service/
│   ├── UserService.java              # F-001
│   ├── PasswordResetService.java     # F-001
│   ├── TotpService.java              # F-001
│   ├── GroupService.java             # F-002
│   ├── GroupMemberService.java       # F-002
│   ├── UnitService.java              # F-003
│   ├── UnitTreeService.java          # F-003
│   ├── AdminService.java             # F-004
│   ├── AdminAuthService.java         # F-004
│   ├── AdminUnlockService.java       # F-004
│   ├── LogService.java               # F-005
│   ├── MapSymbolService.java         # F-006
│   ├── GeoServerIntegrationService.java # F-006
│   ├── DataConnectionService.java    # F-007
│   ├── ConnectionHealthService.java  # F-007
│   └── ... (remaining services)
├── controller/
│   ├── UserController.java           # F-001
│   ├── AuthController.java           # F-001
│   ├── GroupController.java          # F-002
│   ├── UnitController.java           # F-003
│   ├── AdminController.java          # F-004
│   ├── AdminAuthController.java      # F-004
│   ├── LogController.java            # F-005
│   ├── MapSymbolController.java      # F-006
│   └── DataConnectionController.java # F-007
├── security/
│   ├── JwtAuthenticationFilter.java  # F-001
│   ├── AdminJwtFilter.java           # F-004
│   ├── SecurityConfig.java           # shared
│   └── CredentialsEncryptor.java     # F-007
├── scheduler/
│   ├── LogCleanupScheduler.java      # F-005
│   ├── LogStatsScheduler.java        # F-005
│   ├── HealthCheckScheduler.java     # F-007
│   └── FailedLoginAlertChecker.java  # F-005
├── exception/
│   └── GlobalExceptionHandler.java   # shared
├── validator/
│   ├── SymbolValidator.java          # F-006
│   ├── ConnectionValidator.java      # F-007
│   └── ...
├── adapter/
│   └── GeoServerAdapter.java         # F-006
└── factory/
    ├── TokenFactory.java             # F-004
    ├── SLDFactory.java               # F-006
    └── GroupCodeFactory.java         # F-002
```

---

## Frontend Package Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── UserListPage.tsx            # F-001
│   │   ├── UserCreatePage.tsx          # F-001
│   │   ├── UserDetailPage.tsx          # F-001
│   │   ├── GroupListPage.tsx           # F-002
│   │   ├── GroupDetailPage.tsx         # F-002
│   │   ├── GroupCreatePage.tsx         # F-002
│   │   ├── UnitListPage.tsx            # F-003
│   │   ├── UnitTreeViewPage.tsx        # F-003
│   │   ├── UnitCreatePage.tsx          # F-003
│   │   ├── UnitApprovalPage.tsx        # F-003
│   │   ├── AdminListPage.tsx           # F-004
│   │   ├── AdminDetailPage.tsx         # F-004
│   │   ├── AdminCreatePage.tsx         # F-004
│   │   ├── AdminPermissionsPage.tsx    # F-004
│   │   ├── AdminAuditLogPage.tsx       # F-004
│   │   ├── AccessLogListPage.tsx       # F-005
│   │   ├── LogStatsPage.tsx            # F-005
│   │   ├── ConnectionListPage.tsx      # F-007
│   │   ├── ConnectionDetailPage.tsx    # F-007
│   │   └── ConnectionCreatePage.tsx    # F-007
│   ├── super-admin/
│   │   └── ... (F-004 pages)
│   ├── gis/
│   │   ├── MapSymbolListPage.tsx       # F-006
│   │   ├── MapSymbolDetailPage.tsx     # F-006
│   │   └── SymbolLibraryPage.tsx       # F-006
│   └── ProfilePage.tsx                 # F-001
├── components/
│   ├── admin/
│   │   ├── UserTable.tsx               # F-001
│   │   ├── UserForm.tsx                # F-001
│   │   ├── RoleAssignmentModal.tsx     # F-001
│   │   ├── GroupTable.tsx              # F-002
│   │   ├── GroupForm.tsx               # F-002
│   │   ├── MemberManagementModal.tsx   # F-002
│   │   ├── UnitTreeComponent.tsx       # F-003
│   │   ├── UnitForm.tsx                # F-003
│   │   ├── AdminTable.tsx              # F-004
│   │   ├── AdminForm.tsx               # F-004
│   │   ├── PermissionMatrixTable.tsx   # F-004
│   │   ├── LogTable.tsx                # F-005
│   │   ├── LogFilters.tsx              # F-005
│   │   ├── LogStatsChart.tsx           # F-005
│   │   ├── ConnectionTable.tsx         # F-007
│   │   ├── ConnectionForm.tsx          # F-007
│   │   ├── HealthStatusBadge.tsx       # F-007
│   │   ├── CredentialField.tsx         # F-007
│   │   └── IpWhitelistInput.tsx        # F-007
│   └── gis/
│       ├── SymbolTable.tsx             # F-006
│       ├── SymbolForm.tsx              # F-006
│       ├── SymbolPreview.tsx           # F-006
│       └── SymbolImportModal.tsx       # F-006
├── hooks/
│   ├── useUsers.ts                     # F-001
│   ├── useGroups.ts                    # F-002
│   ├── useUnits.ts                     # F-003
│   ├── useAdmins.ts                    # F-004
│   ├── useLogs.ts                      # F-005
│   ├── useMapSymbols.ts                # F-006
│   └── useConnections.ts               # F-007
├── services/api/
│   ├── userApi.ts                      # F-001
│   ├── authApi.ts                      # F-001
│   ├── groupApi.ts                     # F-002
│   ├── unitApi.ts                      # F-003
│   ├── adminApi.ts                     # F-004
│   ├── logApi.ts                       # F-005
│   ├── mapSymbolApi.ts                 # F-006
│   └── connectionApi.ts                # F-007
├── types/
│   ├── userTypes.ts                    # F-001
│   ├── groupTypes.ts                   # F-002
│   ├── unitTypes.ts                    # F-003
│   ├── adminTypes.ts                   # F-004
│   ├── logTypes.ts                     # F-005
│   ├── mapSymbolTypes.ts               # F-006
│   └── connectionTypes.ts              # F-007
├── contexts/
│   └── authContext.tsx                 # F-001
└── guards/
    └── superAdminGuard.tsx             # F-004
```

---

## Shared Database Schema Summary

| Table | Feature | Key |
|---|---|---|
| `user_accounts` | F-001 | User profiles with role assignment |
| `roles` | F-001 | System role definitions (seeded) |
| `user_roles` | F-001 | Many-to-many user-role junction |
| `password_reset_tokens` | F-001 | Forgot password flow |
| `user_groups` | F-002 | Group definitions |
| `group_members` | F-002 | Many-to-many group-user junction |
| `group_histories` | F-002 | Group audit trail |
| `units` | F-003 | Hierarchical unit tree (self-ref) |
| `unit_histories` | F-003 | Unit audit trail |
| `organization_charts` | F-003 | Org chart overlay |
| `admin_accounts` | F-004 | Super-admin accounts with MFA |
| `admin_permissions` | F-004 | Fine-grained module access |
| `admin_audit_logs` | F-004 | Admin action audit trail |
| `admin_recovery_tokens` | F-004 | Admin password recovery |
| `access_logs` | F-005 | System access audit (append-only) |
| `log_retention_policies` | F-005 | Log retention configuration |
| `log_aggregates` | F-005 | Pre-computed daily stats |
| `map_symbols` | F-006 | GIS symbol definitions |
| `symbol_usages` | F-006 | Symbol-GIS object assignments |
| `symbol_libraries` | F-006 | File storage metadata |
| `data_connections` | F-007 | External system connections |
| `sync_logs` | F-007 | Sync operation history |
| `connection_health` | F-007 | Health check results |

**Total: 24 tables, ~50 indexes**

---

## Shared API Base Path

All REST endpoints use prefix: `/api/v1/`

### Public Endpoints
- `POST /api/v1/auth/forgot-password` (F-001)
- `POST /api/v1/auth/reset-password` (F-001)
- `POST /api/v1/auth/totp/verify` (F-001)
- `GET /api/v1/auth/password-policy` (F-001)
- `POST /api/v1/admins/login` (F-004)
- `POST /api/v1/admins/login/totp/verify` (F-004)
- `POST /api/v1/admins/forgot-password` (F-004)
- `POST /api/v1/admins/reset-password` (F-004)

### JWT-Authenticated (All Roles)
- `GET /api/v1/users/me` (F-001)
- `PUT /api/v1/users/me` (F-001)
- `POST /api/v1/auth/change-password` (F-001)
- `POST /api/v1/admins/change-password` (F-004)
- `GET /api/v1/map-symbols/{id}/preview` (F-006)
- `GET /api/v1/map-symbols/{id}/geoserver-layer` (F-006)

### System Admin Required
All CRUD, management, and configuration endpoints for F-001 through F-007 require `system-admin` role.

### Super Admin Required
All F-004 (admin account management) endpoints require `super-admin` role.

### Security Admin Access
F-005 log endpoints: `system-admin` and `security-admin` roles have access.

---

## Shared Configuration

```yaml
# application.yml key settings
spring:
  datasource:
    url: jdbc:sqlserver://localhost:1433;databaseName=haihang;encrypt=true;trustServerCertificate=true
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
  jpa:
    hibernate:
      ddl-auto: validate  # Flyway manages schema
    properties:
      hibernate:
        dialect: org.hibernate.dialect.SQLServerDialect

# JWT
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-ms: 3600000  # 1 hour
    refresh-expiration-ms: 604800000  # 7 days

# Password Policy
app:
  password:
    min-length: 8
    require-uppercase: true
    require-special-char: true
    history-count: 5

# Rate Limiting
app:
  rate-limit:
    login: 50/15min
    password-change: 5/15min
    totp-verify: 5 attempts/5min

# Scheduler
app:
  scheduler:
    health-check-interval: 300000  # 5 min
    log-cleanup-cron: "0 2 * * *"  # daily 2 AM
    log-stats-cron: "0 3 * * *"    # daily 3 AM
    alert-check-interval: 300000   # 5 min

# GeoServer
app:
  geoserver:
    url: ${GEOSERVER_URL:http://localhost:8080/geoserver}
    username: ${GEOSERVER_USERNAME:admin}
    password: ${GEOSERVER_PASSWORD:admin}
    workspace: hang_hai

# AES Encryption Key (F-007)
app:
  encryption:
    aes-key: ${AES_ENCRYPTION_KEY}
```

---

## Sprint Timeline (Consolidated)

```
Week 1: F-001 (User Account) — Entities → Auth → CRUD
Week 2: F-004 (Admin) + F-001 completion — Admin CRUD, MFA, dual-approval
Week 3: F-002 (Groups) + F-003 (Units) — Group CRUD, Unit tree + approval
Week 4: F-005 (Logs) + F-003 completion — Access logging, stats, retention
Week 5: F-006 (Map Symbols) — CRUD + GeoServer integration
Week 6: F-007 (Connections) + all completions — External connections, health check
Week 7: Integration testing across all features + E2E
```

---

## Dependencies Between Features

| Depends On | Feature | Reason |
|---|---|---|
| — | F-001 | Foundational: UserAccount, Role entities |
| F-001 | F-002 | GroupMember references UserAccount |
| F-001 | F-003 | Unit created_by references UserAccount |
| F-001 | F-004 | AdminAuditLog references AdminAccount (separate from UserAccount) |
| F-001, F-002, F-003 | F-005 | AccessLog references UserAccount for audit trail |
| F-001 | F-006 | SymbolUsage.used_by references UserAccount |
| F-001 | F-007 | Connection operations tracked by UserAccount |

---

## Complexity Assessment

| Feature | Complexity | Primary Risk |
|---|---|---|
| F-001 | High | JWT + TOTP 2FA security, rate limiting |
| F-002 | Medium | Member batch operations, delete validation |
| F-003 | High | Recursive CTE tree queries, approval workflow |
| F-004 | High | Dual-approval unlock, AOP audit, MFA |
| F-005 | Medium | Async log writing, batch cleanup |
| F-006 | High | GeoServer REST integration, SVG validation |
| F-007 | Medium-High | AES encryption, external HTTP calls, health check |

---

## Detailed Plans

Per-feature detailed plans with task breakdown, file paths, and API specs:

1. [F-001 Tech Lead Plan](_features/F-001-quan-ly-tai-khoan-nguoi-dung/tech-lead/04-plan.md)
2. [F-002 Tech Lead Plan](_features/F-002-quan-ly-nhom-nguoi-dung/tech-lead/04-plan.md)
3. [F-003 Tech Lead Plan](_features/F-003-quan-ly-don-vi/tech-lead/04-plan.md)
4. [F-004 Tech Lead Plan](_features/F-004-quan-ly-tai-khoan-admin/tech-lead/04-plan.md)
5. [F-005 Tech Lead Plan](_features/F-005-quan-ly-log-truy-cap/tech-lead/04-plan.md)
6. [F-006 Tech Lead Plan](_features/F-006-quan-ly-bieu-tuong-ban-do/tech-lead/04-plan.md)
7. [F-007 Tech Lead Plan](_features/F-007-quan-ly-ket-noi-lien-thong-chia-du-lieu/tech-lead/04-plan.md)
