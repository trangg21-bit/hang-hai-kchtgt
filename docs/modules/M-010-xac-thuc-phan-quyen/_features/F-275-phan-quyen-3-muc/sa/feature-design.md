# System Architecture Design — F-275: Phân quyền 3 mức (3-Level ACL)

> **SA Design** — Feature F-275 thuộc module M-010 (Xác thực & Phân quyền).
> Tech stack: Spring Boot 3.3.6 / Java 17 / Spring Security / JPA-Hibernate / PostgreSQL / React 19 + Ant Design 6.
> Last updated: 2026-06-23

---

## Mục lục

1. [Overview & Architecture Principles](#1-overview--architecture-principles)
2. [Database Schema Design](#2-database-schema-design)
3. [API Endpoint Specifications](#3-api-endpoint-specifications)
4. [Permission Middleware Architecture](#4-permission-middleware-architecture)
5. [Data Scope Filter Design (JPA @Specification)](#5-data-scope-filter-design-jpa-specification)
6. [Audit Logging Design](#6-audit-logging-design)
7. [UI Integration (React/Ant Design)](#7-ui-integration-reactant-design)
8. [Business Rule Enforcement Mapping](#8-business-rule-enforcement-mapping)
9. [Security Considerations](#9-security-considerations)
10. [Implementation Phases & File Map](#10-implementation-phases--file-map)

---

## 1. Overview & Architecture Principles

### 1.1 3-Level Permission Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      User JWT Payload                           │
│  { userId, roleId, organizationId, permissionSet: [...] }        │
└────────────┬──────────────────────┬─────────────────────────────┘
             │                      │
     Level 1 │              Level 2 │
  (Feature)  │              (Operation)
             │                      │
  ┌──────────▼──────┐    ┌──────────▼────────────┐
  │ Feature Access   │    │ CRUD + Business Action│
  │ Module/Endpoint  │    │ read/write/delete/    │
  │ Guard (React)    │    │ approve/export/...    │
  └─────────────────┘    └───────────────────────┘
             │                      │
             └──────────┬───────────┘
                        │
               Level 3 │
              (Data)   │
                        │
          ┌─────────────▼──────────────┐
          │ Row-Level Security:         │
          │ • organization scope        │
          │ • hierarchy subtree         │
          │ • ownership                 │
          └─────────────────────────────┘
```

### 1.2 Architecture Principles

| # | Principle | Enforcement |
|---|-----------|-------------|
| P1 | **Defense in depth** — permission check at middleware + data filter layer | `AuthorizationInterceptor` + `@DataScope` AOP + JPA Specification |
| P2 | **Super Admin bypass** — always full access, no check | `PermissionEvaluator.hasSuperAdmin()` shortcut |
| P3 | **Org hierarchy subtree** — parent sees children's data, never sibling's | `OrganizationService.getEffectiveOrgIds()` uses `hierarchyPath` LIKE |
| P4 | **Direct grant > role** — direct permission grants cannot be overridden by role revocation | `PermissionEvaluator.mergePermissions()` union of role perms + direct grants |
| P5 | **Audit everything** — every access decision (grant/deny) logged synchronously | `AuditLogAspect` AOP around permission check |
| P6 | **No silent bypass** — data filter must be applied by default, cannot be skipped | Spring `@Transactional` + `@DataScope` annotation; custom `EntityManager` wrapping |

---

## 2. Database Schema Design

### 2.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Role       │     │  RolePermission  │     │  Permission  │
│──────────────│     │──────────────────│     │──────────────│
│ id (PK)      │◄────│ roleId (FK)      │     │ id (PK)      │
│ name         │     │ permissionId(FK) │────►│ code (UNIQUE)│
│ code (UNIQUE)│     │ grantedBy (FK)   │     │ feature      │
│ description  │     │ grantedAt        │     │ operation    │
│ level        │     └──────────────────┘     │ description  │
│ isSystem     │                               └──────────────┘
│ hierarchyDepth│
└──────┬───────┘
       │
       │ FK (many-to-many via UserRole)
       ▼
┌──────────────┐
│   User       │
│──────────────│
│ id (PK)      │
│ username     │
│ email        │
│ passwordHash │
│ orgId (FK)───┼──────────────┐
│ status       │              │
│ mfaEnabled   │              │
│ createdAt    │              │
│ updatedAt    │              │
│ deletedAt    │              │
└──────────────┘              │
       │                      │
       │ FK                     │ FK
       ▼                      ▼
┌──────────────┐     ┌──────────────────┐
│  UserRole    │     │ Organization     │
│──────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)          │
│ userId (FK)  │     │ name             │
│ roleId (FK)  │     │ code (UNIQUE)    │
│ assignedBy   │     │ parentId (FK)    │
│ assignedAt   │     │ hierarchyPath    │
│ expiresAt    │     │ hierarchyDepth   │
│ isDirectGrant│     │ status           │
└──────────────┘     │ coefficient      │
                     │ createdAt        │
                     │ updatedAt        │
                     └──────────────────┘

┌──────────────┐
│  AuditLog    │
│──────────────│
│ id (PK)      │
│ userId (FK)  │
│ username     │
│ action       │
│ resource     │
│ requiredPerm │
│ granted      │
│ ipAddress    │
│ userAgent    │
│ details (JSON)│
│ createdAt    │
└──────────────┘
```

### 2.2 DDL — PostgreSQL

```sql
-- ============================================================
-- 1. PERMISSION — defines every possible permission in the system
-- ============================================================
CREATE TABLE permission (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(100)  NOT NULL UNIQUE,   -- e.g., 'phanhien:read'
    feature         VARCHAR(50)   NOT NULL,            -- e.g., 'phanhien'
    operation       VARCHAR(30)   NOT NULL,            -- e.g., 'read', 'write', 'approve'
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_permission_code UNIQUE (code),
    CONSTRAINT chk_permission_code_format
        CHECK (code ~ '^[a-z][a-z0-9]*:[a-z][a-z0-9]*$')
);

CREATE INDEX idx_permission_feature ON permission (feature);
CREATE INDEX idx_permission_operation ON permission (operation);

-- ============================================================
-- 2. ROLE — defines role hierarchy and classification
-- ============================================================
CREATE TABLE role (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(50)   NOT NULL,
    code            VARCHAR(30)   NOT NULL UNIQUE,     -- e.g., 'SUPER_ADMIN', 'SYSTEM_ADMIN'
    description     TEXT,
    level           INT         NOT NULL DEFAULT 0,    -- 0=Super, 1=SysAdmin, 2=SecAdmin, 3+=Business
    is_system       BOOLEAN     NOT NULL DEFAULT FALSE, -- immutable system roles
    hierarchy_depth INT         NOT NULL DEFAULT 0,    -- depth in org hierarchy (0=root)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role_level CHECK (level >= 0)
);

CREATE INDEX idx_role_level ON role (level);
CREATE INDEX idx_role_code ON role (code);

-- ============================================================
-- 3. ROLE_PERMISSION — many-to-many join: role ↔ permission
-- ============================================================
CREATE TABLE role_permission (
    id              BIGSERIAL PRIMARY KEY,
    role_id         BIGINT      NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id   BIGINT      NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    granted_by      BIGINT      NOT NULL,               -- user who granted (FK→user)
    granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permission_role ON role_permission (role_id);
CREATE INDEX idx_role_permission_perm ON role_permission (permission_id);

-- ============================================================
-- 4. USER_ACCOUNT — user master table (extends from M-010 auth module)
-- ============================================================
CREATE TABLE user_account (
    id              BIGSERIAL PRIMARY KEY,
    username        VARCHAR(50)   NOT NULL UNIQUE,
    email           VARCHAR(100)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    organization_id BIGINT        NOT NULL REFERENCES organization(id),
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    mfa_enabled     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'DISABLED', 'LOCKED', 'PENDING'))
);

CREATE INDEX idx_user_org ON user_account (organization_id);
CREATE INDEX idx_user_status ON user_account (status);
CREATE INDEX idx_user_deleted ON user_account (deleted_at) WHERE deleted_at IS NULL;

-- ============================================================
-- 5. USER_ROLE — assigns roles to users (direct grant or via role)
-- ============================================================
CREATE TABLE user_role (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES user_account(id) ON DELETE CASCADE,
    role_id         BIGINT      NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    assigned_by     BIGINT      NOT NULL,                 -- user who assigned (FK→user)
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,                          -- null = permanent
    is_direct_grant BOOLEAN     NOT NULL DEFAULT FALSE,   -- true = direct, not via role
    CONSTRAINT chk_role_level_hierarchy CHECK (
        NOT (is_direct_grant = TRUE AND (
            EXISTS (SELECT 1 FROM role WHERE id = user_role.role_id AND level < 0)
        ))
    ),
    CONSTRAINT uk_user_role UNIQUE (user_id, role_id, is_direct_grant)
);

CREATE INDEX idx_user_role_user ON user_role (user_id);
CREATE INDEX idx_user_role_role ON user_role (role_id);
CREATE INDEX idx_user_role_direct ON user_role (user_id, is_direct_grant) WHERE is_direct_grant = TRUE;

-- ============================================================
-- 6. ORGANIZATION — hierarchical org structure
-- ============================================================
CREATE TABLE organization (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    code            VARCHAR(30)   NOT NULL UNIQUE,        -- e.g., 'D01', 'C01', 'P01'
    parent_id       BIGINT        REFERENCES organization(id),
    hierarchy_path  VARCHAR(500)  NOT NULL DEFAULT '/',    -- '/001/005/012' for subtree queries
    hierarchy_depth INT           NOT NULL DEFAULT 0,
    status          VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    coefficient     DECIMAL(5,2)  NOT NULL DEFAULT 1.00,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_org_status CHECK (status IN ('ACTIVE', 'DISABLED', 'PENDING'))
);

-- Self-referencing unique constraint on code to avoid ambiguity
CREATE UNIQUE INDEX idx_org_code_status ON organization (code, status);

-- Recursive CTE for subtree queries is used in application layer;
-- but an index on hierarchy_path enables LIKE queries:
CREATE INDEX idx_org_hierarchy_path ON organization (hierarchy_path);

-- ============================================================
-- 7. AUDIT_LOG — permission decisions & admin actions
-- ============================================================
CREATE TABLE audit_log (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT        REFERENCES user_account(id),
    username            VARCHAR(50),                        -- denormalized for fast reads
    action              VARCHAR(50)   NOT NULL,             -- LOGIN, LOGOUT, ACCESS_DENIED, ROLE_ASSIGN, etc.
    resource            VARCHAR(200),                       -- endpoint or resource path
    required_permission VARCHAR(100),                       -- permission code that was checked
    granted             BOOLEAN     NOT NULL,               -- true=allowed, false=denied
    ip_address          VARCHAR(45),                        -- IPv4 or IPv6
    user_agent          TEXT,
    details             JSONB,                              -- flexible additional context
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Heavy-read indexes for audit log querying
CREATE INDEX idx_audit_user ON audit_log (user_id);
CREATE INDEX idx_audit_action ON audit_log (action);
CREATE INDEX idx_audit_granted ON audit_log (granted);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);
CREATE INDEX idx_audit_resource ON audit_log (resource);
CREATE INDEX idx_audit_combo ON audit_log (granted, created_at DESC) WHERE granted = FALSE;

-- ============================================================
-- 8. Permission cache table (Wave 2)
-- ============================================================
CREATE TABLE permission_cache (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES user_account(id),
    permission_set  JSONB       NOT NULL,                   -- ['phanhien:read', 'phanhien:write', ...]
    version         INT         NOT NULL DEFAULT 1,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_perm_cache_user ON permission_cache (user_id);
CREATE INDEX idx_perm_cache_expire ON permission_cache (expires_at) WHERE expires_at > NOW();

-- ============================================================
-- 9. Seed data — initial roles
-- ============================================================
INSERT INTO role (name, code, description, level, is_system, hierarchy_depth) VALUES
    ('Super Admin',         'SUPER_ADMIN',   'Toàn quyền hệ thống, không giới hạn',       0, TRUE,  0),
    ('System Admin',        'SYSTEM_ADMIN',  'Quản lý hệ thống, module được cấp',         1, TRUE,  0),
    ('Security Admin',      'SECURITY_ADMIN','Quản lý bảo mật, audit log',                2, TRUE,  0);

-- Seed data — default permissions
INSERT INTO permission (code, feature, operation, description) VALUES
    ('phanhien:read',    'phanhien', 'read',    'Xem danh sách phân hiện'),
    ('phanhien:write',   'phanhien', 'write',   'Tạo/sửa phân hiện'),
    ('phanhien:delete',  'phanhien', 'delete',  'Xóa phân hiện'),
    ('phanhien:approve', 'phanhien', 'approve', 'Phê duyệt phân hiện'),
    ('baocao:read',      'baocao',   'read',    'Xem báo cáo'),
    ('baocao:write',     'baocao',   'write',   'Tạo/sửa báo cáo'),
    ('baocao:export',    'baocao',   'export',  'Xuất báo cáo'),
    ('admin:manage',     'admin',    'manage',  'Quản lý người dùng/vai trò'),
    ('admin:full',       'admin',    'full',    'Toàn quyền quản trị');

-- Grant default permissions to system roles
INSERT INTO role_permission (role_id, permission_id, granted_by, granted_at)
SELECT r.id, p.id, 1, NOW()
FROM role r, permission p
WHERE r.is_system = TRUE AND p.code IN ('admin:manage', 'admin:full');
```

### 2.3 JPA Entity Classes

```java
// ===== Permission.java =====
@Entity
@Table(name = "permission", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class Permission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 50)
    private String feature;

    @Column(nullable = false, length = 30)
    private String operation;

    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

// ===== Role.java =====
@Entity
@Table(name = "role", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    private String description;

    @Column(nullable = false)
    private Integer level;

    @Column(nullable = false)
    private Boolean isSystem;

    @Column(nullable = false)
    private Integer hierarchyDepth;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

// ===== RolePermission.java =====
@Entity
@Table(name = "role_permission", uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"}))
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class RolePermission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by", nullable = false)
    private UserAccount grantedBy;

    @CreationTimestamp
    private LocalDateTime grantedAt;
}

// ===== UserAccount.java =====
@Entity
@Table(name = "user_account")
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "mfa_enabled", nullable = false)
    private Boolean mfaEnabled;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}

// ===== UserRole.java =====
@Entity
@Table(name = "user_role", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "role_id", "is_direct_grant"}))
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class UserRole {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private UserAccount assignedBy;

    @CreationTimestamp
    private LocalDateTime assignedAt;

    private LocalDateTime expiresAt;

    @Column(name = "is_direct_grant", nullable = false)
    private Boolean isDirectGrant;
}

// ===== Organization.java =====
@Entity
@Table(name = "organization")
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class Organization {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Organization parent;

    @Column(name = "hierarchy_path", nullable = false, length = 500)
    private String hierarchyPath;

    @Column(name = "hierarchy_depth", nullable = false)
    private Integer hierarchyDepth;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal coefficient;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

// ===== AuditLog.java =====
@Entity
@Table(name = "audit_log")
@Data @NoArgsConstructor @AllArgsConstructor
@Builder @SuperBuilder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(length = 50)
    private String username;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(length = 200)
    private String resource;

    @Column(name = "required_permission", length = 100)
    private String requiredPermission;

    @Column(nullable = false)
    private Boolean granted;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 200)
    private String userAgent;

    @Column(columnDefinition = "jsonb")
    private String details;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

---

## 3. API Endpoint Specifications

### 3.1 Permission Management API

#### GET `/api/v1/permissions`
```yaml
summary: Danh sách permissions (có filter)
security: [{ bearerAuth: [] }]
parameters:
  - name: feature
    in: query
    schema: { type: string }       # filter theo feature, e.g. "phanhien"
  - name: operation
    in: query
    schema: { type: string }      # filter theo operation, e.g. "read"
  - name: page
    in: query
    schema: { type: integer, default: 0 }
  - name: size
    in: query
    schema: { type: integer, default: 20, maximum: 100 }
  - name: sort
    in: query
    schema: { type: string, default: "createdAt,desc" }
responses:
  200:
    description: Paginated permission list
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/PermissionDto'
            total: { type: integer }
            page: { type: integer }
            size: { type: integer }
  401: Unauthorized
  403:
    description: Forbidden
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ForbiddenResponse'
```

#### GET `/api/v1/permissions/{id}`
```yaml
summary: Chi tiết permission
responses:
  200:
    description: Permission detail
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/PermissionDto'
  404: Not found
```

#### POST `/api/v1/permissions`
```yaml
summary: Tạo permission mới (Super Admin only)
security: [{ bearerAuth: [] }]
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreatePermissionRequest'
responses:
  201:
    description: Permission created
  400:
    description: Validation error (BR-275-01: format `{feature}:{operation}`)
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
  403: Forbidden
```

#### PUT `/api/v1/permissions/{id}`
```yaml
summary: Chỉnh sửa permission (Super Admin only)
responses:
  200: Permission updated
  403: Forbidden
  404: Not found
```

#### DELETE `/api/v1/permissions/{id}`
```yaml
summary: Xóa permission (Super Admin only, cascades to RolePermission)
responses:
  204: Deleted
  403: Forbidden
```

### 3.2 Role Management API

#### GET `/api/v1/roles`
```yaml
summary: Danh sách roles (có filter theo level)
parameters:
  - name: level
    in: query
    schema: { type: integer }     # filter theo level, e.g. 0, 1, 2
  - name: isSystem
    in: query
    schema: { type: boolean }    # filter hệ thống hay tùy chỉnh
responses:
  200:
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/RoleDto'
```

#### POST `/api/v1/roles`
```yaml
summary: Tạo role mới
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateRoleRequest'
        required: [name, code, level]
responses:
  201: Role created
  400:
    description: Validation error
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ValidationErrorResponse'
```

#### POST `/api/v1/roles/{roleId}/permissions`
```yaml
summary: Gán permissions cho role (Super Admin only)
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [permissionIds]
        properties:
          permissionIds:
            type: array
            items: { type: integer, format: int64 }
            example: [1, 5, 12]
responses:
  200:
    description: Permissions assigned
    content:
      application/json:
        schema:
          type: object
          properties:
            assignedCount: { type: integer }
  403: Forbidden
```

#### DELETE `/api/v1/roles/{roleId}/permissions/{permissionId}`
```yaml
summary: Revocation permission khỏi role
responses:
  204: Revoked
```

### 3.3 User Role Assignment API

#### POST `/api/v1/users/{userId}/roles`
```yaml
summary: Gán role cho user
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [roleId, isDirectGrant]
        properties:
          roleId:
            type: integer
            format: int64
            description: ID của role cần gán
          isDirectGrant:
            type: boolean
            description: true = cấp trực tiếp, không qua role; false = gán role
          expiresAt:
            type: string
            format: date-time
            description: Thời hạn hết hạn (null = permanent)
responses:
  200:
    description: Role assigned
  400:
    description: Business rule violation (BR-275-05: cannot assign higher level role)
  403: Forbidden
```

#### POST `/api/v1/users/{userId}/permissions`
```yaml
summary: Cấp trực tiếp permission cho user (Super Admin only)
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [permissionIds]
        properties:
          permissionIds:
            type: array
            items: { type: integer, format: int64 }
responses:
  200:
    description: Direct permission granted
  403: Forbidden
```

### 3.4 Permission Evaluation & Audit API

#### GET `/api/v1/permissions/evaluate/{userId}`
```yaml
summary: Test permission evaluation result (Admin only)
description: Trả về toàn bộ permissionSet của user sau khi merge từ role + direct grant
responses:
  200:
    description: Evaluation result
    content:
      application/json:
        schema:
          type: object
          properties:
            userId: { type: integer }
            permissionSet:
              type: array
              items: { type: string }
              example: ['phanhien:read', 'phanhien:write', 'baocao:export']
            roles:
              type: array
              items:
                type: object
                properties:
                  roleId: { type: integer }
                  roleName: { type: string }
                  permissions:
                    type: array
                    items: { type: string }
            directGrants:
              type: array
              items: { type: string }
```

#### GET `/api/v1/audit-logs`
```yaml
summary: Audit logs — truy cập bị từ chối hoặc tất cả
security: [{ bearerAuth: [] }]
parameters:
  - name: granted
    in: query
    schema: { type: boolean }    # true=granted, false=denied (mặc định: tất cả)
  - name: action
    in: query
    schema: { type: string }    # filter theo action
  - name: userId
    in: query
    schema: { type: integer }
  - name: startDate
    in: query
    schema: { type: string, format: date-time }
  - name: endDate
    in: query
    schema: { type: string, format: date-time }
  - name: page
    in: query
    schema: { type: integer, default: 0 }
  - name: size
    in: query
    schema: { type: integer, default: 20 }
responses:
  200:
    content:
      application/json:
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                $ref: '#/components/schemas/AuditLogDto'
            total: { type: integer }
  403: Forbidden (Security Admin only)
```

### 3.5 DTO Schemas

```java
// PermissionDto.java
public record PermissionDto(
    Long id,
    String code,
    String feature,
    String operation,
    String description,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

// RoleDto.java
public record RoleDto(
    Long id,
    String name,
    String code,
    String description,
    Integer level,
    Boolean isSystem,
    Integer hierarchyDepth,
    List<PermissionDto> permissions,
    LocalDateTime createdAt
) {}

// CreatePermissionRequest.java
public record CreatePermissionRequest(
    @NotBlank @Pattern(regexp = "^[a-z][a-z0-9]*:[a-z][a-z0-9]*$")
    String code,
    @NotBlank String feature,
    @NotBlank String operation,
    String description
) {}

// CreateRoleRequest.java
public record CreateRoleRequest(
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "^[A-Z][A-Z0-9_]*$")
    String code,
    @NotBlank String description,
    @Min(0) Integer level,
    Integer hierarchyDepth
) {}

// ForbiddenResponse.java
public record ForbiddenResponse(
    String error,
    String message,
    String requiredPermission,    // BR-275-11: permission code cần thiết
    String errorCode              // e.g., "PERMISSION_DENIED"
) {}

// AuditLogDto.java
public record AuditLogDto(
    Long id,
    Long userId,
    String username,
    String action,
    String resource,
    String requiredPermission,
    Boolean granted,
    String ipAddress,
    String userAgent,
    String details,
    LocalDateTime createdAt
) {}
```

---

## 4. Permission Middleware Architecture

### 4.1 Request Flow

```
┌──────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌────────────────┐
│  Client  │────▶│ JWT Auth Filter   │────▶│ PermissionCheck  │────▶│ DataScope      │
│ Request  │     │ (Authentication)  │     │ Interceptor       │     │ AOP Aspect     │
└──────────┘     └──────────────────┘     └──────────────────┘     └────────────────┘
                      │                        │                        │
                   decode JWT              check permissionSet        apply org
                   extract userId,          vs endpoint required       filter to JPA
                   roleId, orgId             permission                 Specification
                   → SecurityContext        → 403 if missing           → filtered data
                   → current user
```

### 4.2 JWT Auth Filter

```java
// JwtAuthenticationFilter.java (extends OncePerRequestFilter)
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String token = extractToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtUtil.parseToken(token);
            Long userId = claims.get("userId", Long.class);
            Long roleId = claims.get("roleId", Long.class);
            Long orgId = claims.get("organizationId", Long.class);
            List<String> permissionSet = claims.get("permissionSet", List.class);

            // Check user exists and not disabled
            UserAccount user = userAccountService.findById(userId)
                .orElseThrow(() -> new AuthenticationCredentialsException("User not found"));
            if (!"ACTIVE".equals(user.getStatus())) {
                throw new AuthenticationCredentialsException("User is not active");
            }

            Authentication auth = new JwtAuthenticationToken(
                user, permissionSet, orgId, roleId
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
```

### 4.3 Permission Checker Interceptor

```java
// PermissionCheckInterceptor.java
@Component
public class PermissionCheckInterceptor implements HandlerInterceptor {

    @Autowired private PermissionEvaluator permissionEvaluator;
    @Autowired private AuditLogService auditLogService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // Only apply to Controller methods with @RequiresPermission annotation
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiresPermission annotation = handlerMethod.getMethodAnnotation(RequiresPermission.class);
        if (annotation == null) {
            annotation = handlerMethod.getBeanType().getAnnotation(RequiresPermission.class);
        }
        if (annotation == null) {
            return true;  // no permission check needed
        }

        String requiredPermission = annotation.value();
        CurrentUser currentUser = CurrentUserContext.getCurrentUser();

        // BR-275-02: Super Admin always has full access
        if (permissionEvaluator.hasSuperAdmin(currentUser.getRoleId())) {
            return true;
        }

        boolean hasPermission = permissionEvaluator.hasPermission(
            currentUser.getUserId(), requiredPermission
        );

        // BR-275-07: Log all permission decisions
        auditLogService.log(
            currentUser.getUserId(),
            currentUser.getUsername(),
            hasPermission ? "ACCESS_GRANTED" : "ACCESS_DENIED",
            request.getRequestURI(),
            requiredPermission,
            hasPermission,
            request.getRemoteAddr(),
            request.getHeader("User-Agent"),
            null
        );

        if (!hasPermission) {
            // BR-275-11: Return 403 with required permission code
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(
                JsonUtil.toJson(new ForbiddenResponse(
                    "PERMISSION_DENIED",
                    "Bạn không có quyền thực hiện thao tác này",
                    requiredPermission,
                    "PERMISSION_DENIED"
                ))
            );
            return false;
        }

        return true;
    }
}
```

### 4.4 Permission Evaluator Service

```java
// PermissionEvaluator.java
@Service
public class PermissionEvaluator {

    @Autowired private UserRoleRepository userRoleRepo;
    @Autowired private RolePermissionRepository rolePermissionRepo;
    @Autowired private PermissionRepository permissionRepo;

    /**
     * BR-275-02: Super Admin always has full access
     */
    public boolean hasSuperAdmin(Long roleId) {
        return roleId != null && "SUPER_ADMIN".equals(
            Optional.ofNullable(roleId)
                .map(id -> rolePermissionRepo.findRoleById(id))
                .map(Role::getCode)
                .orElse(null)
        );
        // Simpler: just check role code
        // return "SUPER_ADMIN".equals(roleService.getRoleById(roleId).getCode());
    }

    /**
     * Merge permissions from all roles + direct grants
     * BR-275-06: If user has no roles (all revoked), only direct grants remain
     * BR-275-04: Direct grants cannot exceed role hierarchy limits
     */
    public Set<String> evaluatePermissions(Long userId) {
        // 1. Get all active roles
        List<UserRole> userRoles = userRoleRepo.findByUserIdAndExpiresAtAfter(userId, LocalDateTime.now());
        
        Set<String> permissions = new HashSet<>();

        // 2. Collect permissions from roles
        for (UserRole userRole : userRoles) {
            if (!userRole.getIsDirectGrant()) {
                Set<String> rolePerms = rolePermissionRepo.findPermissionCodesByRoleId(userRole.getRoleId());
                permissions.addAll(rolePerms);
            }
        }

        // 3. Add direct grants (always included, cannot be overridden)
        Set<String> directGrants = userRoleRepo.findPermissionCodesByUserIdAndDirectGrant(
            userId, true
        );
        permissions.addAll(directGrants);

        return Collections.unmodifiableSet(permissions);
    }

    /**
     * Check if user has a specific permission
     */
    public boolean hasPermission(Long userId, String permissionCode) {
        Set<String> allPermissions = evaluatePermissions(userId);
        return allPermissions.contains(permissionCode);
    }

    /**
     * Check if user has ANY of the required permissions (OR logic)
     */
    public boolean hasAnyPermission(Long userId, String... permissionCodes) {
        Set<String> allPermissions = evaluatePermissions(userId);
        return Arrays.stream(permissionCodes)
            .anyMatch(allPermissions::contains);
    }

    /**
     * Check if user has ALL of the required permissions (AND logic)
     */
    public boolean hasAllPermissions(Long userId, String... permissionCodes) {
        Set<String> allPermissions = evaluatePermissions(userId);
        return Arrays.stream(permissionCodes)
            .allMatch(allPermissions::contains);
    }
}
```

### 4.5 Annotation: `@RequiresPermission`

```java
// RequiresPermission.java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiresPermission {
    /**
     * Permission code required to access this endpoint.
     * Format: {feature}:{operation}
     * Example: @RequiresPermission("phanhien:write")
     */
    String value();

    /**
     * Optional: If true, access is allowed if user has ANY of these permissions.
     * If false (default), access requires ALL listed permissions.
     */
    boolean or() default false;
}

// For AND logic (default)
@RequiresPermission("phanhien:write")
public ResponseEntity<?> createPhanhien(@RequestBody CreatePhanhienRequest request) { ... }

// For OR logic
@RequiresPermission(value = {"phanhien:approve", "phanhien:delete"}, or = true)
public ResponseEntity<?> approvePhanhien(@PathVariable Long id) { ... }
```

### 4.6 Spring Security Config

```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // for @PreAuthorize, @Secured, etc.
public class SecurityConfig {

    @Autowired private JwtAuthenticationFilter jwtFilter;
    @Autowired private PermissionCheckInterceptor permInterceptor;
    @Autowired private AuthenticationEntryPoint authEntryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/v1/auth/login",
                    "/api/v1/auth/register",
                    "/api/v1/auth/refresh",
                    "/api/v1/auth/forgot-password",
                    "/api/v1/auth/reset-password",
                    "/api/v1/health",
                    "/api/v1/public/**"
                ).permitAll()
                .requestMatchers("/api/v1/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public WebMvcConfigurer mvcConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(permInterceptor)
                    .addPathPatterns("/api/v1/**")
                    .excludePathPatterns("/api/v1/auth/**");
            }
        };
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 4.7 Custom Access Denied Handler

```java
// CustomAccessDeniedHandler.java
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException)
            throws IOException, ServletException {
        
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(JsonUtil.toJson(new ForbiddenResponse(
            "ACCESS_DENIED",
            "Bạn không có quyền truy cập tài nguyên này",
            null,
            "ACCESS_DENIED"
        )));
    }
}
```

---

## 5. Data Scope Filter Design (JPA @Specification)

### 5.1 Concept

Data-level security (Level 3) ensures that each user only sees data belonging to their organization scope. This is implemented via:

1. **`@DataScope` annotation** — marks entity/repository methods that need org-scoped filtering
2. **JPA `Specification<T>`** — dynamically adds `WHERE` clauses for `organizationId`, `hierarchyPath`, or `ownerId`
3. **`DataScopeContext` ThreadLocal** — holds the current user's effective org IDs

### 5.2 `@DataScope` Annotation

```java
// DataScope.java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DataScope {
    /**
     * Org scope type:
     * - SELF: chỉ dữ liệu của chính user (ownership-based)
     * - CHILDREN: dữ liệu của đơn vị mình + các đơn vị con (subtree)
     * - ALL: toàn bộ dữ liệu (Super Admin)
     * - CUSTOM: tùy chỉnh theo field name
     */
    DataScopeType value() default DataScopeType.CHILDREN;

    /**
     * Field name on the entity that stores organizationId.
     * Default: "organization" (corresponds to JPA relationship)
     */
    String orgField() default "organization";

    /**
     * Field name on the entity that stores ownerId (for SELF scope).
     * Default: "createdBy"
     */
    String ownerField() default "createdBy";

    /**
     * Custom org code filter (for custom scope types).
     * e.g., "department" field on entity.
     */
    String customField() default "";

    /**
     * Custom org code value (for custom scope types).
     */
    String customValue() default "";
}

// DataScopeType.java
public enum DataScopeType {
    SELF,      // ownership-based: only records created by this user
    CHILDREN,  // org subtree: current org + all descendants
    ALL,       // no filtering (Super Admin)
    CUSTOM     // custom field-based filtering
}
```

### 5.3 DataScopeContext (ThreadLocal)

```java
// DataScopeContext.java
public class DataScopeContext {

    private static final ThreadLocal<EffectiveOrgContext> CONTEXT =
        ThreadLocal.withInitial(EffectiveOrgContext::new);

    public static void setScope(Long userId, Long currentOrgId, List<Long> effectiveOrgIds) {
        CONTEXT.set(new EffectiveOrgContext(userId, currentOrgId, effectiveOrgIds));
    }

    public static void clear() {
        CONTEXT.remove();
    }

    public static Long getUserId() {
        return CONTEXT.get().userId;
    }

    public static Long getCurrentOrgId() {
        return CONTEXT.get().currentOrgId;
    }

    public static List<Long> getEffectiveOrgIds() {
        return CONTEXT.get().effectiveOrgIds;
    }

    public static record EffectiveOrgContext(
        Long userId,
        Long currentOrgId,
        List<Long> effectiveOrgIds
    ) {}
}
```

### 5.4 `@DataScope` Aspect (AOP)

```java
// DataScopeAspect.java
@Aspect
@Component
@Slf4j
public class DataScopeAspect {

    @Autowired private OrganizationService organizationService;
    @Autowired private CurrentUserContext currentUserContext;

    /**
     * Intercepts all methods annotated with @DataScope
     * Sets the DataScopeContext with effective org IDs before method execution.
     */
    @Before("@annotation(dataScope)")
    public void applyDataScope(JoinPoint joinPoint, DataScope dataScope) {
        CurrentUser user = currentUserContext.getCurrentUser();
        if (user == null) {
            log.warn("No current user in DataScope context");
            return;
        }

        // BR-275-02: Super Admin gets ALL data
        Organization currentOrg = user.getOrganization();

        List<Long> effectiveOrgIds;
        switch (dataScope.value()) {
            case ALL:
                // Super Admin sees everything
                effectiveOrgIds = organizationService.getAllOrgIds();
                break;

            case CHILDREN:
                // User sees their org + all descendant orgs
                String orgPath = currentOrg.getHierarchyPath();
                effectiveOrgIds = organizationService.findDescendantOrgIds(currentOrg.getId());
                // Include current org itself
                effectiveOrgIds.add(currentOrg.getId());
                break;

            case SELF:
                // Only own records
                effectiveOrgIds = Collections.singletonList(currentOrg.getId());
                break;

            case CUSTOM:
                // Custom org code filtering
                effectiveOrgIds = Collections.singletonList(currentOrg.getId());
                break;

            default:
                effectiveOrgIds = Collections.singletonList(currentOrg.getId());
        }

        DataScopeContext.setScope(
            user.getUserId(),
            currentOrg.getId(),
            effectiveOrgIds
        );

        log.debug("Data scope applied: userId={}, orgIds={}",
            user.getUserId(), effectiveOrgIds);
    }

    @After("@annotation(dataScope)")
    public void clearDataScope(JoinPoint joinPoint, DataScope dataScope) {
        DataScopeContext.clear();
    }
}
```

### 5.5 Organization Service for Subtree Query

```java
// OrganizationService.java
@Service
public class OrganizationService {

    @Autowired private OrganizationRepository orgRepo;

    /**
     * Find all descendant org IDs given the current org's hierarchyPath.
     * Uses LIKE query on hierarchy_path: '/001/005/%' matches all children.
     */
    @Transactional(readOnly = true)
    public List<Long> findDescendantOrgIds(Long parentOrgId) {
        Organization parent = orgRepo.findById(parentOrgId)
            .orElseThrow(() -> new EntityNotFoundException("Organization not found: " + parentOrgId));

        // BR-275-04: Subtree query using hierarchyPath LIKE pattern
        String pathPattern = parent.getHierarchyPath() + "%";
        return orgRepo.findByHierarchyPathLike(pathPattern)
            .stream()
            .map(Organization::getId)
            .toList();
    }

    /**
     * Get all org IDs (for Super Admin)
     */
    @Transactional(readOnly = true)
    public List<Long> getAllOrgIds() {
        return orgRepo.findAll()
            .stream()
            .map(Organization::getId)
            .toList();
    }

    /**
     * Check if an org is a descendant of another (for BR-275-04 validation)
     */
    public boolean isDescendant(Long potentialDescendantId, Long ancestorId) {
        Organization descendant = orgRepo.findById(potentialDescendantId)
            .orElseThrow(() -> new EntityNotFoundException("Organization not found"));
        Organization ancestor = orgRepo.findById(ancestorId)
            .orElseThrow(() -> new EntityNotFoundException("Organization not found"));

        return descendant.getHierarchyPath().startsWith(ancestor.getHierarchyPath());
    }
}
```

### 5.6 JPA Specification Factory

```java
// DataScopeSpecification.java
public class DataScopeSpecification {

    /**
     * Create a JPA Specification that filters by effective org IDs.
     * Applies WHERE entity.organization.id IN (:orgIds)
     */
    public static <T> Specification<T> forOrgIds(String orgFieldPath, List<Long> orgIds) {
        return (root, query, cb) -> {
            if (orgIds == null || orgIds.isEmpty()) {
                return cb.conjunction();  // no filter
            }
            Path<Object> orgPath = root.get(orgFieldPath);
            // Navigate to id if org is a relationship
            return orgPath.get("id").in(orgIds);
        };
    }

    /**
     * Create a JPA Specification that filters by ownerId (SELF scope).
     * Applies WHERE entity.createdBy = :userId
     */
    public static <T> Specification<T> forOwnerId(String ownerFieldPath, Long userId) {
        return (root, query, cb) -> {
            Path<Object> ownerPath = root.get(ownerFieldPath);
            return cb.equal(ownerPath.get("id"), userId);
        };
    }

    /**
     * Combined specification: OR of org scope + ownership.
     * User sees records in their org scope OR records they own.
     */
    public static <T> Specification<T> combined(String orgFieldPath, List<Long> orgIds,
                                                 String ownerFieldPath, Long userId) {
        return (root, query, cb) -> {
            Specification<T> orgSpec = forOrgIds(orgFieldPath, orgIds);
            Specification<T> ownerSpec = forOwnerId(ownerFieldPath, userId);
            
            // Join both specs
            javax.persistence.criteria.Predicate orgPred = orgSpec.toPredicate(root, query, cb);
            javax.persistence.criteria.Predicate ownerPred = ownerSpec.toPredicate(root, query, cb);
            
            return cb.or(orgPred, ownerPred);
        };
    }
}
```

### 5.7 Specification Executor Repository

```java
// DataScopeJpaRepository.java (base interface for all scoped repositories)
public interface DataScopeJpaRepository<T, ID> {

    /**
     * Find with data scope applied (org subtree filter).
     */
    List<T> findByDataScope(Specification<T> spec);

    /**
     * Find with pagination + data scope.
     */
    Page<T> findByDataScope(Specification<T> spec, Pageable pageable);

    /**
     * Count with data scope.
     */
    long countByDataScope(Specification<T> spec);
}
```

### 5.8 Usage Example

```java
// PhanhienRepository.java
@Repository
public interface PhanhienRepository 
        extends JpaRepository<Phanhien, Long>,
                JpaSpecificationExecutor<Phanhien>,
                DataScopeJpaRepository<Phanhien, Long> {
}

// PhanhienService.java
@Service
public class PhanhienService {

    @Autowired private PhanhienRepository phanhienRepo;
    @Autowired private CurrentUserContext currentUserContext;

    @DataScope(value = DataScopeType.CHILDREN, orgField = "organization", ownerField = "createdBy")
    public Page<Phanhien> searchPhanhien(PhanhienSearchRequest request, Pageable pageable) {
        // 1. Build base specification from search criteria
        Specification<Phanhien> spec = Specification.where(
            PhanhienSpecification.hasStatus(request.getStatus())
                .and(PhanhienSpecification.hasNameContaining(request.getName()))
        );

        // 2. Data scope is applied via @DataScope aspect before this method runs
        // The aspect sets DataScopeContext with effective org IDs
        // We combine org scope + ownership
        List<Long> orgIds = DataScopeContext.getEffectiveOrgIds();
        Long userId = DataScopeContext.getUserId();
        
        Specification<Phanhien> dataScopeSpec = DataScopeSpecification.combined(
            "organization", orgIds,
            "createdBy", userId
        );

        // 3. Combine and execute
        return phanhienRepo.findByDataScope(spec.and(dataScopeSpec), pageable);
    }

    @DataScope(value = DataScopeType.SELF, ownerField = "createdBy")
    public List<Phanhien> getMyRecords() {
        List<Long> orgIds = DataScopeContext.getEffectiveOrgIds();
        Long userId = DataScopeContext.getUserId();
        return phanhienRepo.findByDataScope(
            DataScopeSpecification.combined("organization", orgIds, "createdBy", userId)
        );
    }

    @DataScope(value = DataScopeType.ALL)
    public Page<Phanhien> getAllPhanhien(Pageable pageable) {
        // Super Admin: no org filtering needed, all orgs included
        return phanhienRepo.findAll(pageable);
    }
}
```

---

## 6. Audit Logging Design

### 6.1 Audit Event Types

```java
// AuditAction.java
public enum AuditAction {
    // Authentication events
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,
    TOKEN_REFRESH,
    TOKEN_INVALIDATED,       // BR-275-12: org change → token invalidation
    MFA_SETUP,
    MFA_VERIFY,

    // Authorization events
    ACCESS_GRANTED,
    ACCESS_DENIED,           // 403 - recorded by PermissionCheckInterceptor
    PERMISSION_GRANTED,      // Direct permission grant
    PERMISSION_REVOKED,
    ROLE_ASSIGNED,
    ROLE_REVOKED,
    ROLE_CREATED,
    ROLE_UPDATED,
    ROLE_DELETED,
    ROLE_CLONED,
    PERMISSION_ASSIGNED,
    PERMISSION_REVOKED_FROM_ROLE,

    // Data events
    DATA_CREATED,
    DATA_UPDATED,
    DATA_DELETED,
    DATA_EXPORTED,
    DATA_APPROVED,
    DATA_REJECTED,

    // Admin events
    USER_CREATED,
    USER_UPDATED,
    USER_DISABLED,
    USER_DELETED,
    ORG_CREATED,
    ORG_UPDATED,
    ORG_DELETED,
    ORG_STRUCTURE_CHANGED,
}
```

### 6.2 Audit Log Service

```java
// AuditLogService.java
@Service
public class AuditLogService {

    @Autowired private AuditLogRepository auditLogRepo;

    /**
     * Synchronous audit logging for critical events.
     * BR-275-07: Every permission decision is logged.
     */
    @Transactional
    public AuditLog log(
            Long userId,
            String username,
            AuditAction action,
            String resource,
            String requiredPermission,
            Boolean granted,
            String ipAddress,
            String userAgent,
            Map<String, Object> details) {
        
        AuditLog logEntry = AuditLog.builder()
            .userId(userId)
            .username(username)
            .action(action.name())
            .resource(resource)
            .requiredPermission(requiredPermission)
            .granted(granted)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .details(details != null ? JsonUtil.toJson(details) : null)
            .createdAt(LocalDateTime.now())
            .build();

        return auditLogRepo.save(logEntry);
    }

    /**
     * Asynchronous audit logging for non-critical events (batched).
     */
    @Async("auditLoggingExecutor")
    public void logAsync(AuditLogEntry entry) {
        // Batch insert for performance
        auditLogRepo.save(entry.toEntity());
    }

    /**
     * Query denied accesses (BR-275-07: Security Admin reads denied logs)
     */
    public Page<AuditLog> findDeniedAccesses(Pageable pageable) {
        return auditLogRepo.findByGrantedFalse(pageable);
    }
}
```

### 6.3 Audit Log Aspect (AOP for automatic logging)

```java
// AuditLogAspect.java
@Aspect
@Component
@Slf4j
public class AuditLogAspect {

    @Autowired private AuditLogService auditLogService;
    @Autowired private CurrentUserContext currentUserContext;

    /**
     * Log business data mutations automatically via AOP.
     * Works with @AuditLog annotation on service methods.
     */
    @Around("@annotation(auditAnnotation)")
    public Object audit(ProceedingJoinPoint pjp, AuditLog auditAnnotation) throws Throwable {
        CurrentUser user = currentUserContext.getCurrentUser();
        String action = auditAnnotation.value();
        String resource = auditAnnotation.resource();
        
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        long elapsed = System.currentTimeMillis() - start;

        Map<String, Object> details = new HashMap<>();
        details.put("elapsedMs", elapsed);
        details.put("method", pjp.getSignature().toShortString());
        if (auditAnnotation.includeArgs()) {
            details.put("args", Arrays.toString(pjp.getArgs()));
        }
        if (auditAnnotation.includeResult()) {
            details.put("result", result);
        }

        auditLogService.log(
            user != null ? user.getUserId() : null,
            user != null ? user.getUsername() : "SYSTEM",
            AuditAction.valueOf(action),
            resource,
            auditAnnotation.requiredPermission(),
            true,  // method executed successfully = granted
            requestContextHolder.get().getRequest().getRemoteAddr(),
            requestContextHolder.get().getRequest().getHeader("User-Agent"),
            details
        );

        return result;
    }
}

// AuditLog annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface AuditLog {
    AuditAction value();
    String resource();
    String requiredPermission() default "";
    boolean includeArgs() default false;
    boolean includeResult() default false;
}
```

### 6.4 Audit Log Query Repository

```java
// AuditLogRepository.java
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE a.granted = false " +
           "AND (:startDate IS NULL OR a.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR a.createdAt <= :endDate) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findDeniedAccesses(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        Pageable pageable
    );

    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findByUserId(
        @Param("userId") Long userId,
        Pageable pageable
    );

    @Query("SELECT a FROM AuditLog a WHERE a.action = :action " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findByAction(
        @Param("action") String action,
        Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.granted = false")
    long countDeniedAccesses();
}
```

---

## 7. UI Integration (React/Ant Design 6)

### 7.1 PermissionGuard Component

```tsx
// frontend/src/components/PermissionGuard.tsx
import React from 'react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

interface PermissionGuardProps {
  /** Permission code(s) required. Single string or array for OR logic. */
  permission: string | string[];
  /** If false (default), all permissions required (AND). If true, any one suffices (OR). */
  or?: boolean;
  /** Component to render when permission is granted. */
  children: React.ReactNode;
  /** Component to render when permission is denied. Default: null (hidden). */
  fallback?: React.ReactNode;
}

/**
 * Hides/disables UI elements based on user permissions.
 * BR-275-09: UI must hide/disable button/feature based on permission set from JWT payload.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  or = false,
  children,
  fallback = null,
}) => {
  const { permissionSet } = useContext(AuthContext);

  const hasPermission = useCallback(() => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    return or
      ? permissions.some(p => permissionSet.has(p))
      : permissions.every(p => permissionSet.has(p));
  }, [permission, or, permissionSet]);

  if (hasPermission()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
```

### 7.2 Auth Context (React Query + Zustand)

```tsx
// frontend/src/contexts/AuthContext.tsx
import { createContext, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';

export const AuthContext = createContext<{
  token: string | null;
  userId: number | null;
  roleId: number | null;
  orgId: number | null;
  permissionSet: Set<string>;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (...codes: string[]) => boolean;
}>({} as any);

// authStore.ts (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userId: number | null;
  roleId: number | null;
  orgId: number | null;
  permissionSet: Set<string>;
  setAuth: (data: { token: string; userId: number; roleId: number; orgId: number; permissions: string[] }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      roleId: null,
      orgId: null,
      permissionSet: new Set(),
      setAuth: (data) => set({
        token: data.token,
        userId: data.userId,
        roleId: data.roleId,
        orgId: data.orgId,
        permissionSet: new Set(data.permissions),
      }),
      clearAuth: () => set({
        token: null,
        userId: null,
        roleId: null,
        orgId: null,
        permissionSet: new Set(),
      }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 7.3 Usage Examples

```tsx
// Example: Hide "Create" button if user lacks phanhien:write permission
<PermissionGuard permission="phanhien:write">
  <Button type="primary" onClick={handleCreate}>
    Tạo phân hiện
  </Button>
</PermissionGuard>

// Example: OR logic — show button if user has either approve OR delete
<PermissionGuard permission={["phanhien:approve", "phanhien:delete"]} or>
  <Button danger onClick={handleAction}>
    Phê duyệt / Xóa
  </Button>
</PermissionGuard>

// Example: Custom fallback — show "You don't have permission" message
<PermissionGuard
  permission="baocao:export"
  fallback={<Alert type="warning" message="Bạn không có quyền xuất báo cáo" />}
>
  <Button icon={<DownloadOutlined />}>Xuất báo cáo</Button>
</PermissionGuard>
```

---

## 8. Business Rule Enforcement Mapping

| Rule ID | Rule | Implementation Location |
|---------|------|------------------------|
| BR-275-01 | Permission code format `{feature}:{operation}` | `CreatePermissionRequest.code` with `@Pattern(regexp)` + DB `CHECK` constraint |
| BR-275-02 | Super Admin always full access | `PermissionEvaluator.hasSuperAdmin()` early return in `PermissionCheckInterceptor.preHandle()` |
| BR-275-03 | System roles cannot be deleted | `RoleService.deleteRole()` checks `role.getIsSystem() == true` → throw `IllegalStateException` |
| BR-275-04 | Data scope filter by org hierarchy | `@DataScope` + `DataScopeSpecification` + `OrganizationService.findDescendantOrgIds()` |
| BR-275-05 | Cannot assign higher level role | `UserRoleService.assignRole()` compares `assignerRole.level <= targetRole.level` |
| BR-275-06 | Revoke last role → lose permissions | `PermissionEvaluator.evaluatePermissions()` returns union of remaining roles + direct grants only |
| BR-275-07 | All permission decisions logged | `PermissionCheckInterceptor` logs every access decision + `AuditLogAspect` logs mutations |
| BR-275-08 | Permission cache versioning | `PermissionCacheService.version++` on any role/permission change |
| BR-275-09 | UI hides/disables by permission | `PermissionGuard` React component reads from JWT payload in store |
| BR-275-10 | Data filter always applied | `@DataScope` annotation on repository methods; custom JPA Specification factory |
| BR-275-11 | 403 returns required permission code | `PermissionCheckInterceptor` writes `ForbiddenResponse` with `requiredPermission` field |
| BR-275-12 | Org change invalidates tokens | `OrganizationService.changeUserOrg()` increments `PermissionCache.version` + logs `TOKEN_INVALIDATED` |

---

## 9. Security Considerations

### 9.1 Threat Model

| Threat | Mitigation |
|--------|-----------|
| Token tampering | JWT signed with server secret; verified by `JwtAuthenticationFilter` |
| Horizontal privilege escalation | Data scope filter (`@DataScope`) enforced at service layer, not just API |
| Vertical privilege escalation | Role level constraint (BR-275-05) prevents assigning higher-level roles |
| Direct permission bypass | Direct grants checked alongside role perms; cannot exceed role hierarchy |
| Missing authorization | All `/api/v1/**` endpoints require auth (Spring config); `@RequiresPermission` on each endpoint |
| Privilege persistence after role revocation | `PermissionEvaluator.evaluatePermissions()` re-computes from DB each request |
| Org hierarchy traversal | `hierarchyPath` LIKE query on DB; only descendants matched, never ancestors/siblings |

### 9.2 Rate Limiting & Brute Force Protection

```java
// Auth rate limiting (to be implemented in Wave 2)
// - Login endpoint: max 5 attempts per 5 minutes per IP
// - Password reset: max 3 attempts per 15 minutes per email
// - Permission/role management: max 20 requests per minute per admin
```

### 9.3 JWT Token Structure

```json
{
  "sub": "user123",
  "userId": 42,
  "roleId": 3,
  "organizationId": 7,
  "permissionSet": ["phanhien:read", "phanhien:write", "baocao:read"],
  "orgVersion": 5,
  "iat": 1718870400,
  "exp": 1718874000
}
```

- `orgVersion` — incremented on org change (BR-275-12), compared on token refresh
- `permissionSet` — embedded in JWT for fast middleware evaluation (no extra DB lookup)
- Token lifetime: 15 minutes (short-lived), with refresh token for extended sessions

---

## 10. Implementation Phases & File Map

### Phase 1: Core Entities & Infrastructure (Week 1)

| Priority | File | Description |
|----------|------|-------------|
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/Permission.java` | Permission JPA entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/Role.java` | Role JPA entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/RolePermission.java` | RolePermission join entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/UserAccount.java` | UserAccount entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/UserRole.java` | UserRole entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/Organization.java` | Organization entity |
| P0 | `src/main/java/com/hanghai/kchtg/security/entity/AuditLog.java` | AuditLog entity |
| P0 | `src/main/resources/db/migration/V1__initial_auth_schema.sql` | Flyway migration DDL |
| P0 | `src/main/java/com/hanghai/kchtg/security/repository/*Repository.java` | Spring Data repositories |

### Phase 2: Permission Middleware (Week 2)

| Priority | File | Description |
|----------|------|-------------|
| P0 | `src/main/java/com/hanghai/kchtg/security/filter/JwtAuthenticationFilter.java` | JWT auth filter |
| P0 | `src/main/java/com/hanghai/kchtg/security/config/SecurityConfig.java` | Spring Security config |
| P0 | `src/main/java/com/hanghai/kchtg/security/service/PermissionEvaluator.java` | Permission evaluation engine |
| P0 | `src/main/java/com/hanghai/kchtg/security/annotation/RequiresPermission.java` | Permission annotation |
| P0 | `src/main/java/com/hanghai/kchtg/security/interceptor/PermissionCheckInterceptor.java` | Permission interceptor |
| P0 | `src/main/java/com/hanghai/kchtg/security/context/CurrentUserContext.java` | ThreadLocal user context |
| P0 | `src/main/java/com/hanghai/kchtg/security/dto/ForbiddenResponse.java` | 403 response DTO |

### Phase 3: Data Scope Filter (Week 2-3)

| Priority | File | Description |
|----------|------|-------------|
| P1 | `src/main/java/com/hanghai/kchtg/security/annotation/DataScope.java` | Data scope annotation |
| P1 | `src/main/java/com/hanghai/kchtg/security/aspect/DataScopeAspect.java` | AOP aspect |
| P1 | `src/main/java/com/hanghai/kchtg/security/context/DataScopeContext.java` | ThreadLocal context |
| P1 | `src/main/java/com/hanghai/kchtg/security/spec/DataScopeSpecification.java` | JPA Specification factory |
| P1 | `src/main/java/com/hanghai/kchtg/security/service/OrganizationService.java` | Org hierarchy service |
| P1 | `src/main/java/com/hanghai/kchtg/security/repository/DataScopeJpaRepository.java` | Base scoped repository interface |

### Phase 4: API Endpoints & Management (Week 3-4)

| Priority | File | Description |
|----------|------|-------------|
| P1 | `src/main/java/com/hanghai/kchtg/security/controller/PermissionController.java` | Permission CRUD |
| P1 | `src/main/java/com/hanghai/kchtg/security/controller/RoleController.java` | Role CRUD + permission assignment |
| P1 | `src/main/java/com/hanghai/kchtg/security/controller/UserRoleController.java` | User role assignment |
| P1 | `src/main/java/com/hanghai/kchtg/security/controller/AuditLogController.java` | Audit log query |
| P1 | `src/main/java/com/hanghai/kchtg/security/service/RoleService.java` | Role business logic |
| P1 | `src/main/java/com/hanghai/kchtg/security/service/UserRoleService.java` | UserRole business logic |
| P1 | `src/main/java/com/hanghai/kchtg/security/dto/*Dto.java` | Request/Response DTOs |

### Phase 5: Audit Logging (Week 4)

| Priority | File | Description |
|----------|------|-------------|
| P1 | `src/main/java/com/hanghai/kchtg/security/aspect/AuditLogAspect.java` | AOP audit logger |
| P1 | `src/main/java/com/hanghai/kchtg/security/annotation/AuditLog.java` | Audit annotation |
| P1 | `src/main/java/com/hanghai/kchtg/security/service/AuditLogService.java` | Audit log service |

### Phase 6: UI Integration (Week 4-5)

| Priority | File | Description |
|----------|------|-------------|
| P2 | `frontend/src/components/PermissionGuard.tsx` | React permission guard |
| P2 | `frontend/src/contexts/AuthContext.tsx` | Auth context with JWT |
| P2 | `frontend/src/stores/authStore.ts` | Zustand auth store |
| P2 | `frontend/src/hooks/usePermissions.ts` | Hook for permission checks |
| P2 | `frontend/src/layouts/ProtectedLayout.tsx` | Layout with navigation filtering |

### Phase 7: Testing (Week 5)

| Priority | File | Description |
|----------|------|-------------|
| P1 | `src/test/java/com/hanghai/kchtg/security/PermissionEvaluatorTest.java` | Unit: permission evaluation |
| P1 | `src/test/java/com/hanghai/kchtg/security/RoleHierarchyTest.java` | Unit: role level validation |
| P1 | `src/test/java/com/hanghai/kchtg/security/DataScopeFilterTest.java` | Unit: org subtree filtering |
| P1 | `src/test/java/com/hanghai/kchtg/security/AuditLogTest.java` | Unit: audit logging |
| P2 | `src/test/java/com/hanghai/kchtg/security/SecurityIntegrationTest.java` | Integration: full CRUD pipeline |
| P2 | `frontend/tests/PermissionGuard.test.tsx` | Unit: PermissionGuard component |
| P2 | `frontend/tests/e2e/auth-flow.spec.ts` | E2E: role-based navigation |

---

## Appendix A: Migration Flyway Scripts

See `src/main/resources/db/migration/` directory for all DDL scripts:

- `V1__initial_auth_schema.sql` — All entity tables (Section 2.2 DDL)
- `V2__seed_permissions_roles.sql` — Default system roles + permissions
- `V3__add_permission_cache.sql` — Wave 2 permission cache table

## Appendix B: Configuration Properties

```yaml
# application.yml
security:
  jwt:
    secret: ${JWT_SECRET:change-me-in-production}
    expiration-ms: 900000        # 15 minutes
    refresh-expiration-ms: 86400000  # 24 hours
  
  permission:
    evaluation-cache-enabled: false  # Wave 2 optimization
    super-admin-role-code: SUPER_ADMIN
```

## Appendix C: Rollback Plan

If F-275 rollback is needed:
1. Delete all `user_role` entries (cascade handles rest)
2. Delete all `role_permission` entries (cascade handles rest)
3. Drop `audit_log` partition data (by date)
4. Keep base tables (`permission`, `role`, `organization`, `user_account`) — they may have cross-feature references
