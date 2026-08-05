# BA Spec: Quản trị hệ thống (M-001)

## 1. Tổng quan (Overview)

| Field | Value |
|-------|-------|
| **Module ID** | M-001 |
| **Feature Name** | Quản trị hệ thống |
| **Business Goal** | Quản lý tài khoản người dùng, phân quyền RBAC, quản lý nhóm, đơn vị, admin và audit log truy cập |
| **Dependencies** | None |
| **Scope** | 4 features (F-001, F-002, F-003, F-005) |
| **Status** | done |

---

## 2. Features in Scope & Business Rules

### F-001: Quản lý tài khoản người dùng (User & Auth)

| Method | Path | Action | Permission |
|---|---|---|---|
| `GET` | `/api/users` | List users (search, filter role/status, pagination) | `admin:manage` |
| `GET` | `/api/users/{id}` | Get user detail | `admin:manage` |
| `POST` | `/api/users` | Create user (admin-only) | `admin:manage` |
| `PUT` | `/api/users/{id}` | Update user (admin-only) | `admin:manage` |
| `DELETE` | `/api/users/{id}` | Delete user | `admin:manage` |
| `PATCH` | `/api/users/{id}/status` | Change account status (Active/Inactive/Locked) | `admin:manage` |
| `POST` | `/api/users/{id}/lock` | Lock account | `admin:manage` |
| `POST` | `/api/users/{id}/unlock` | Unlock account | `admin:manage` |
| `GET` | `/api/users/me` | Get self profile | Authenticated (Self) |
| `PUT` | `/api/users/me` | Update self profile (exclude role/orgUnit) | Authenticated (Self) |
| `POST` | `/api/users/{id}/reset-password` | Admin reset password (policy: ≥8, letter+digit) | `admin:manage` |
| `GET` | `/api/users/{id}/pending-status` | Check approval status | Authenticated |
| `POST` | `/api/auth/login` | Phase 1: Authenticate credentials | Public |
| `POST` | `/api/auth/login/totp` | Phase 2: Verify TOTP | Public |

**Business Rules:**
- **Identity:** Username và Email phải là duy nhất. Username (3-100 ký tự), Email (định dạng email chuẩn).
- **Role Constraint:** Mỗi user chỉ có **1 role chính** theo business rule (truy xuất qua `getPrimaryRoleCode()`).
- **Self-edit:** User chỉ được tự sửa thông tin cơ bản, không được thay đổi role hoặc organization qua `/me`.
- **Password Policy:** Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt. Điểm sức mạnh mật khẩu (0-100).
- **Security Lockout:** Theo dõi `failedLoginCount` và `failedTotpCount`. Tự động khóa tài khoản (`account_locked_until`) nếu vượt ngưỡng.
- **Password Versioning:** Mỗi lần đổi mật khẩu, `password_hash_version` sẽ tăng để vô hiệu hóa các JWT cũ.

### F-002: Quản lý nhóm người dùng (Group)

| Method | Path | Action | Permission |
|---|---|---|---|
| `GET` | `/api/groups` | List groups (search, filter, `myGroups`) | Any authenticated |
| `GET` | `/api/groups/{id}` | Get group detail | Any authenticated |
| `POST` | `/api/groups` | Create group | `group:create` |
| `PUT` | `/api/groups/{id}` | Update group | `group:edit` |
| `DELETE` | `/api/groups/{id}` | Delete group | `group:delete` |
| `POST` | `/api/groups/{id}/members` | Add member to group | `group:member:manage` |
| `DELETE` | `/api/groups/{groupId}/members/{userId}` | Remove member | `group:member:manage` |
| `GET` | `/api/groups/{id}/members` | List members (paginated) | `group:member:manage` |
| `POST` | `/api/groups/{id}/copy` | Clone group + members (Transactional) | `group:copy` |
| `GET` | `/api/groups/{id}/history` | View audit history | `group:history` |

**Business Rules:**
- **Naming:** Name và Code của group phải là duy nhất.
- **Delete Guard:** Không được xóa group nếu vẫn còn members (BR-009).
- **Membership Check:** Ngăn thêm member trùng lặp vào cùng một group (BR-010).
- **Transactional Copy:** Việc nhân bản group phải đồng thời nhân bản tất cả members trong một transaction duy nhất (BR-014).
- **Audit Trail:** Mọi thay đổi (mutation) về group đều phải ghi lại lịch sử `GroupHistory` kèm thông tin người vận hành (BR-015).

### F-003: Quản lý đơn vị (OrgUnit)

| Method | Path | Action | Permission |
|---|---|---|---|
| `GET` | `/api/org-units` | List hierarchy | `admin:manage` |
| `GET` | `/api/org-units/{id}` | Get detail | `admin:manage` |
| `POST` | `/api/org-units` | Create new unit | `admin:manage` |
| `PUT` | `/api/org-units/{id}` | Update unit | `admin:manage` |
| `DELETE` | `/api/org-units/{id}` | Delete unit | `admin:manage` |

**Business Rules:**
- **Hierarchy:** Sử dụng **Materialized Path** (Đường dẫn vật chất hóa) để quản lý hệ thống phân cấp, cho phép truy vấn các đơn vị con/nhiều cấp hiệu quả.
- **Approval:** Các thay đổi về cấu trúc đơn vị phải đi qua quy trình phê duyệt.
- **Audit:** Mọi thay đổi cấu trúc được ghi lại trong `UnitHistory`.

### F-005: Quản lý log truy cập (AccessLog)

| Method | Path | Action | Permission |
|---|---|---|---|
| `GET` | `/api/access-logs` | Filter logs (type, severity, keyword, date) | `admin:manage` |
| `GET` | `/api/access-logs/{id}` | Get log detail | `admin:manage` |
| `GET` | `/api/logs/export/csv` | Export CSV (Max 10k rows, streaming) | `admin:manage` |
| `GET` | `/api/logs/alerts/failures` | Alert if ≥5 login failures in 1h | `admin:manage` |
| `GET` | `/api/logs/stats/daily` | Daily aggregated stats | `admin:manage` |
| `GET` | `/api/logs/retention` | Get retention policy | `admin:manage` |
| `PUT` | `/api/logs/retention` | Update retention policy | `admin:manage` |

**Business Rules:**
- **Immutability (BR-025):** `AccessLog` là thực thể **chỉ ghi**. Các thao tác POST/PUT/DELETE trực tiếp vào API `/access-logs` sẽ bị chặn (403).
- **Data Source:** Chỉ `AccessLogInterceptor` (thông qua `AsyncLogAppender`) mới có thể ghi log thực tế.
- **Alerting:** Gửi cảnh báo nếu phát hiện ≥5 lần đăng nhập thất bại trong 1 giờ.
- **Retention:** Chính sách lưu trữ tùy chỉnh, có job tự động dọn dẹp log cũ.

> **Note:** F-006 (Quản lý admin / AdminAccount) đã được gỡ khỏi module — quyền admin nay chỉ là một `Role` trong RBAC của F-001 (xem migration `V28__cleanup_f006_redundant_tables.sql`). Bảng `AdminAuditLog` được giữ lại và do F-005 (AccessLogInterceptor) sử dụng.

---

## 3. Security & RBAC Strategy

| Mechanism | Implementation |
|-----------|----------------|
| **Authentication** | JWT Dual-Tokens (Access + Refresh). 2-Phase MFA (TOTP). |
| **Authorization** | Spring Security `@PreAuthorize` với `PermissionAuthorizationManager` tùy chỉnh. |
| **Lockout** | `account_locked_until` chặn login/2FA khi `failed_login_count` vượt ngưỡng. |
| **Password Security** | BCrypt hash, `password_hash_version` tăng khi đổi pass để vô hiệu hóa JWT cũ. |
| **Audit** | Annotation `@AuditLog` trên controllers. Logging truy cập bằng Interceptor. |

---

## 4. Permission Invalidation Strategy (Critical)

Để giải quyết các vấn đề về **Permission Drift**, **Hiệu năng (Performance)** và **Độ ưu tiên (Precedence)**, module này phải tuân thủ các quy tắc sau:

### 4.1. Permission Versioning (Solves Drift)
- Entity `User` bắt buộc phải có trường `permission_version` (Integer, mặc định 0).
- Bất kỳ thay đổi nào vào `Role`, `Group` hoặc `UserPermissionOverride` của một user đều phải kích hoạt tăng `permission_version`.
- **Cơ chế:** Trong `JwtAuthFilter`, khi giải mã token, hệ thống so sánh `permission_version` trong JWT với `permission_version` trong DB.
  - Nếu `Version_JWT < Version_DB` → **Reject request** (bắt buộc user re-login để lấy token mới).
  - Nếu `Version_JWT >= Version_DB` → Tiếp tục xử lý.

### 4.2. Caching Strategy (Solves Performance)
- Danh sách `permissions` (dạng List/Set các permission code string) của mỗi user phải được cache (Redis).
- Key cache: `user_perms:{user_id}`.
- TTL (Thời gian sống): 5-10 phút.
- **Cơ chế:** Khi `permission_version` thay đổi (từ mục 1), hệ thống phải đồng thời **xóa (invalidate)** cache cũ.

### 4.3. Permission Precedence Logic (Solves Conflicts)
- **Quy tắc gộp quyền (Union Logic):**
  1.  **`UserPermissionOverride`** (Quyền riêng biệt): **Ưu tiên cao nhất**. Nếu Override cho phép, user luôn có quyền đó bất kể Role/Group là gì.
  2.  **`Group`** (Nhóm): Ưu tiên thứ 2. Các quyền từ tất cả các Group user tham gia được gộp lại.
  3.  **`Role`** (Vai trò): Ưu tiên thứ 3. Các quyền từ Role chính của user.
- **Định nghĩa:** `Permission = Override_Permissions ∪ Group_Permissions ∪ Role_Permissions`.
- Nếu `Override` xác định `Disallow` (không cho phép) một hành động nào đó đang được Role/Group cho phép, `Disallow` phải thắng (deny-by-default trên top of allow-by-role).

---

## 5. Data Model Relationships

```
User ──────── many-to-many ──────── Role ──────── many-to-many ──────── Permission
  │                                         │
  │                                         └─── RolePermissions (join table)
  │
  └─── many-to-many ──────── UserGroup ──────── many-to-many ──────── GroupMembers
              │                                         │
              └─── UserGroupMembership (join table)      └─── GroupMember (entity)
                                                          └─── many → Permission keys

User ──────── one-to-many ──────── LoginAuditLog
User ──────── one-to-many ──────── PendingApproval
User ──────── one-to-many ──────── AccountRegistrationAudit

AccessLog ──── written by ──── AccessLogInterceptor (async via AsyncLogAppender)
```
