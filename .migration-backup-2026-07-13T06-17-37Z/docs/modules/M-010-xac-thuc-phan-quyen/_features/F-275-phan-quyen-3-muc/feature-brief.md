---
id: F-275
name: Phân quyền 3 mức
slug: phan-quyen-3-muc
module-id: M-010
status: done
classification: local
priority: high
created: 2026-06-16T04:42:05Z
last-updated: 2026-06-25T09:18:45Z
stage: completed
locked-fields: []
consumed_by_modules: []
qa-pass-rate: 100
qa-notes: 86
qa-verdict: Pass
---
# Feature: Phân quyền 3 mức

## Description

Hệ thống phân quyền 3 mức (ACL — Access Control List) bao gồm: **Mức 1 — Chức năng** (feature-level: user có thể truy cập module/nhóm chức năng nào), **Mức 2 — Thao tác** (operation-level: CRUD + business actions được phép trên mỗi chức năng), **Mức 3 — Dữ liệu** (data-level: dữ liệu nào user được xem/chỉnh sửa dựa trên đơn vị, phân cấp tổ chức, và ownership). Mô hình hỗ trợ RBAC (Role-Based Access Control) làm nền tảng, kết hợp ACL fine-grained cho từng permission. Đây là module cốt lõi đảm bảo tất cả các tính năng nghiệp vụ khác (M-001, M-007, M-009, v.v.) đều được bảo vệ bởi lớp phân quyền này.

## Business Intent

Bảo đảm mỗi người dùng chỉ truy cập đúng những chức năng, thao tác và dữ liệu mà vai trò + đơn vị tổ chức của họ được cấp phép. Ngăn chặn truy cập chéo giữa các đơn vị, giới hạn admin theo phân cấp tổ chức, và hỗ trợ phân quyền động theo tổ chức bộ máy (Cục → Cảng vụ → Chi cục → Đơn vị).

## Flow Summary

1. User đăng nhập → hệ thống tạo JWT payload chứa `userId`, `roleId`, `organizationId`, `permissionSet` (JSON array của tất cả permissions từ role + direct grant).
2. Mỗi request đến API → JWT middleware giải mã token → xác thực user tồn tại + chưa bị khóa.
3. Permission middleware kiểm tra `permissionSet` so với required permission của endpoint (ví dụ: `feature:phanhien,action:write`).
4. Nếu thiếu → trả về 403 Forbidden. Nếu đủ → tiếp tục.
5. Data-level filtering: controller/service áp dụng query filter dựa trên `organizationId` (scope theo đơn vị), `hierarchyId` (scope theo phân cấp tổ chức), và `ownerId` (scope theo ownership).
6. Toàn bộ quyết định permissions và scope được ghi vào audit log.

## Acceptance Criteria

- Người dùng chỉ truy cập được chức năng đã được gán qua vai trò (feature-level check)
- Thao tác CRUD + business action được kiểm soát ở mức operation (operation-level check)
- Dữ liệu hiển thị/filter theo organization scope và hierarchy (data-level check)
- Super Admin có full access toàn hệ thống
- System Admin chỉ quản lý được module được cấp
- Security Admin chỉ xem được audit log + bảo mật
- Admin đơn vị chỉ quản lý được dữ liệu của đơn vị mình và các đơn vị con (hierarchical scope)
- Phân quyền được enforce ở cả API layer và UI layer
- Audit log ghi lại toàn bộ truy cập bị từ chối (403)
- Permission có thể được cấp trực tiếp (direct grant) ngoài vai trò (role override)

## In Scope

- **Thiết kế permission model 3 cấp**:
  - Feature-level: module/function endpoint access control
  - Operation-level: CRUD + business action permissions per feature
  - Data-level: row-level security theo organization hierarchy
- **Role management CRUD**: tạo, sửa, xóa, clone role, assign permissions
- **Permission assignment API**: assign role to user, direct permission grant, revoke permission
- **Permission evaluation middleware**: Spring Security interceptor / JWT filter chain
- **Data scope filter**: JPA `@Specification` hoặc interceptor cho row-level filtering
- **API endpoints**: phân quyền cho user, role, group, organization
- **Audit logging**: ghi lại mọi quyết định cấp/từ chối truy cập
- **UI integration**: PermissionGuard component cho React, hide/disable buttons theo permission
- **Role hierarchy**: Super Admin > System Admin > Security Admin > Regular Admin
- **Organization hierarchy**: Cục → Cảng vụ → Chi cục → Đơn vị (parent-child scope inheritance)

## Out of Scope

- Attribute-Based Access Control (ABAC) — tạm thời không hỗ trợ điều kiện động (thời gian, địa điểm, device)
- Dynamic permission evaluation at runtime (permission change requires token refresh)
- Cross-tenant access (multi-tenant) — hệ thống chỉ hỗ trợ single-tenant với org hierarchy
- Self-service permission request/approval workflow (sẽ là feature riêng)
- SSO/OIDC/external identity provider integration (M-010 module khác đảm nhận)
- LDAP/Active Directory sync cho user provisioning
- Permission caching layer (Redis) — Wave 2 optimization
- Performance optimization cho permission evaluation > 10ms (Wave 2)

## Roles + Permissions

| Role | Feature Level | Operation Level | Data Level | Notes |
|---|---|---|---|---|
| **Super Admin** | Full — tất cả module/chức năng | Full CRUD + approve + delete + admin management | Full — toàn bộ dữ liệu hệ thống | Không bị giới hạn bởi org scope, có thể quản lý mọi admin |
| **System Admin** | Module-level — được gán danh sách module | CRUD theo module được cấp | Toàn bộ dữ liệu của các module được cấp | Không can thiệp hệ thống (không quản lý Super Admin) |
| **Security Admin** | Chỉ module bảo mật + audit | Read audit log, manage security policies | Chỉ dữ liệu audit log + security events | Không sửa dữ liệu nghiệp vụ |
| **Cảng vụ / Chi cục** | Module nghiệp vụ được cấp | CRUD + approve theo quy trình | Data scope: đơn vị trực thuộc + các chi cục dưới quyền | Có quyền phê duyệt L1 cho đơn vị con |
| **Đơn vị** | Module nghiệp vụ cơ bản | CRUD + submit theo quy trình | Data scope: chỉ dữ liệu của đơn vị mình | Không xem được dữ liệu đơn vị khác |
| **Chuyên viên** | View + Edit (theo task assignment) | Read + Write (own records) | Data scope: bản ghi do mình tạo hoặc được chia sẻ | Giới hạn edit ở record ownership |
| **Lãnh đạo** | Dashboard + Reports + Approve | Read + Approve/Reject | Data scope: toàn bộ đơn vị trực thuộc | Không tạo/sửa/xóa dữ liệu nghiệp vụ trực tiếp |
| **Khách vãng lai** | Không có | Không có | Không có | Unauthenticated / guest |

## Entities

- **Permission**: id(BIGINT PK), code(VARCHAR 100 UNIQUE NOT NULL), feature(VARCHAR 50 NOT NULL), operation(VARCHAR 30 NOT NULL), description(TEXT), createdAt(TIMESTAMP), updatedAt(TIMESTAMP). *Mã permission định dạng: `{feature}:{operation}` — ví dụ: `phanhien:read`, `phanhien:write`, `phanhien:approve`*
- **Role**: id(BIGINT PK), name(VARCHAR 50 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), level(INT DEFAULT 0), isSystem(BOOLEAN DEFAULT false), hierarchyDepth(INT DEFAULT 0), createdAt(TIMESTAMP), updatedAt(TIMESTAMP). *level=0=Super Admin, 1=System Admin, 2=Security Admin, 3+=Business roles*
- **RolePermission**: id(BIGINT PK), roleId(BIGINT FK→Role), permissionId(BIGINT FK→Permission), grantedBy(BIGINT FK→UserAccount), grantedAt(TIMESTAMP). *Mảng join table — một role có nhiều permissions, một permission có nhiều roles*
- **User**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), organizationId(BIGINT FK→Organization), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL).
- **UserRole**: id(BIGINT PK), userId(BIGINT FK→User), roleId(BIGINT FK→Role), assignedBy(BIGINT FK→User), assignedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL), isDirectGrant(BOOLEAN DEFAULT false). *isDirectGrant=true khi permission được cấp trực tiếp, không qua role*
- **Organization**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), parentId(BIGINT FK→Organization NULL), hierarchyPath(VARCHAR 500), hierarchyDepth(INT DEFAULT 0), status(VARCHAR 20), coefficient(DECIMAL 5,2), createdAt(TIMESTAMP), updatedAt(TIMESTAMP). *hierarchyPath lưu đường dẫn tổ chức (ví dụ: `/001/005/012`) cho efficient subtree query*
- **AuditLog**: id(BIGINT PK), userId(BIGINT FK→User NULL), username(VARCHAR 50), action(VARCHAR 50), resource(VARCHAR 200), requiredPermission(VARCHAR 100), granted(BOOLEAN), ipAddress(VARCHAR 45), userAgent(TEXT), details(JSON), createdAt(TIMESTAMP).
- **PermissionCache** (Wave 2): id(BIGINT PK), userId(BIGINT FK→User), permissionSet(JSON NOT NULL), version(INT DEFAULT 1), expiresAt(TIMESTAMP), createdAt(TIMESTAMP). *Cache cho permission evaluation để giảm DB load*

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/permissions | Danh sách permissions (có filter theo feature) | Admin |
| GET | /api/v1/permissions/{id} | Chi tiết permission | Admin |
| POST | /api/v1/permissions | Tạo permission mới | Super Admin |
| PUT | /api/v1/permissions/{id} | Chỉnh sửa permission | Super Admin |
| DELETE | /api/v1/permissions/{id} | Xóa permission | Super Admin |
| GET | /api/v1/roles | Danh sách roles (có filter theo level) | Admin |
| GET | /api/v1/roles/{id} | Chi tiết role + permissions đã gán | Admin |
| POST | /api/v1/roles | Tạo role mới | Super Admin |
| PUT | /api/v1/roles/{id} | Chỉnh sửa role | Super Admin |
| DELETE | /api/v1/roles/{id} | Xóa role | Super Admin |
| GET | /api/v1/roles/{id}/permissions | Permissions của role | Admin |
| POST | /api/v1/roles/{id}/permissions | Gán permissions cho role | Super Admin |
| DELETE | /api/v1/roles/{id}/permissions/{permissionId} | Revocation permission khỏi role | Super Admin |
| GET | /api/v1/users/{id}/roles | Roles của user | Admin, Self |
| POST | /api/v1/users/{id}/roles | Gán role cho user | Super Admin |
| DELETE | /api/v1/users/{id}/roles/{roleId} | Revocation role khỏi user | Super Admin |
| POST | /api/v1/users/{id}/permissions | Cấp trực tiếp permission cho user | Super Admin |
| DELETE | /api/v1/users/{id}/permissions/{permissionId} | Revocation direct permission | Super Admin |
| GET | /api/v1/permissions/evaluate/{userId} | Test permission evaluation result | Admin |
| GET | /api/v1/audit-logs?granted=false | Audit logs — truy cập bị từ chối | Security Admin |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-275-01 | Permission code phải tuân thủ định dạng `{feature}:{operation}` (vd: `phanhien:read`, `baocao:write`) | Permission creation/validation | FR-275-1 |
| BR-275-02 | Super Admin luôn có full access, không thể bị revoke permission | Permission evaluation | FR-275-2 |
| BR-275-03 | Role system (isSystem=true) không thể bị xóa, chỉ có thể disable | Role management | FR-275-3 |
| BR-275-04 | Data scope filter áp dụng theo org hierarchy: user được xem dữ liệu của chính mình + tất cả đơn vị con (subtree) | Data-level access | FR-275-4 |
| BR-275-05 | Không được gán role có level cao hơn cho user có level thấp hơn (VD: không gán System Admin cho user Đơn vị thông thường) | Role assignment | FR-275-5 |
| BR-275-06 | Khi revoke last role của user, user tự động mất toàn bộ permissions (trừ direct grants) | Permission evaluation | FR-275-6 |
| BR-275-07 | Mọi thay đổi permission/role phải được ghi vào AuditLog (granted=true/false) | Audit logging | FR-275-7 |
| BR-275-08 | Permission cache version tăng mỗi khi có thay đổi — token refresh yêu cầu nếu version thay đổi | Permission caching | FR-275-8 |
| BR-275-09 | UI phải ẩn/disable button/feature dựa trên permission set từ JWT payload trước khi render | UI security | FR-275-9 |
| BR-275-10 | Data filter ở API layer phải áp dụng mặc định — không được bỏ qua (defense in depth) | API security | FR-275-10 |
| BR-275-11 | 403 Forbidden phải trả về kèm permission code cần thiết (ví dụ: `phanhien:write`) để debug | Error handling | FR-275-11 |
| BR-275-12 | Khi org hierarchy thay đổi (user chuyển đơn vị), token cũ bị invalidate — user phải login lại | Token management | FR-275-12 |

## Testing Strategy

- **Unit tests**:
  - Permission evaluation engine: test 100+ permission combinations (feature × operation × role)
  - Role hierarchy validation: verify level constraint enforcement (BR-275-05)
  - Data scope filter: verify org subtree filtering logic (BR-275-04)
  - Permission cache versioning: test invalidation on role/permission change (BR-275-08)
  - Role system protection: verify cannot delete system roles (BR-275-03)

- **Integration tests**:
  - CRUD pipeline: create role → assign permissions → assign to user → verify access
  - Direct grant override: direct permission grants must work even without role
  - Org hierarchy: create org tree → assign users → verify data scope correctly limits results
  - Permission evaluation: simulate request → verify middleware returns 403 for unauthorized, 200 for authorized
  - Audit log: verify every permission decision (grant/deny) is recorded

- **E2E tests**:
  - Super Admin: login → access all features → create/modify all roles → full data access
  - System Admin: login → access assigned modules only → 403 on unassigned modules
  - Security Admin: login → can only access audit/security modules → 403 on business data
  - Unit-level user: login → access own unit data only → 403 on other unit data
  - Role revocation: remove all roles → verify all permissions lost → verify audit log entry
  - Org transfer: change user's organization → verify old tokens invalidated → must re-login

- **Security tests**:
  - JWT tampering: verify modified token rejected by permission middleware
  - Horizontal privilege escalation: verify user cannot access another user's data in same org
  - Vertical privilege escalation: verify user cannot access data above their org level
  - Direct permission bypass: verify direct grants cannot exceed role hierarchy limits
  - Missing authorization: verify all API endpoints have permission checks (no endpoint is unprotected)
tected)
