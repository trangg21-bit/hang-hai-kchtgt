---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý tài khoản người dùng

## Description

Quản lý toàn bộ vòng đời tài khoản người dùng trong hệ thống, bao gồm tạo mới, chỉnh sửa thông tin, xóa mềm, khóa/mở khóa tài khoản và phân quyền theo vai trò (RBAC — Role-Based Access Control). Tính năng cung cấp giao diện quản lý tập trung cho tất cả người dùng hệ thống.

## Business Intent

Hệ thống cần cơ chế quản lý tài khoản người dùng an toàn và linh hoạt, cho phép các vai trò Quản trị hệ thống, Lãnh đạo và Chuyên viên thực hiện đầy đủ các thao tác tạo, sửa, xóa, khóa/mở khóa tài khoản theo quy trình nghiệp vụ được thiết định.

## Flow Summary

Quản trị hệ thống hoặc Lãnh đạo truy cập vào module Quản lý tài khoản từ sidebar chính → chọn thao tác tạo mới hoặc chỉnh sửa tài khoản hiện có → hệ thống xác thực quyền và kiểm tra tính hợp lệ của dữ liệu đầu vào (email unique, mật khẩu mạnh) → thực hiện thao tác CRUD → ghi nhận log audit → hiển thị thông báo thành công hoặc lỗi qua toast notification. Quy trình bao gồm: (1) tạo tài khoản với thông tin cơ bản và gán vai trò; (2) chỉnh sửa thông tin cá nhân hoặc phân quyền; (3) xóa mềm (không xóa cứng khi có dữ liệu liên quan); (4) khóa/mở khóa để ngăn/tiếp tục truy cập; (5) reset mật khẩu bằng admin hoặc tự động gửi link.

## Acceptance Criteria

- Tạo tài khoản người dùng mới thành công với đầy đủ thông tin (tên, email, mật khẩu, vai trò, đơn vị) và mật khẩu đáp ứng yêu cầu bảo mật (tối thiểu 8 ký tự, có chữ hoa, chữ thường, số)
- Phân quyền theo vai trò RBAC chính xác: mỗi vai trò (Admin, Lãnh đạo, Cán bộ, Cá nhân) chỉ có quyền truy cập phù hợp với phân cấp được quy định
- Khóa/Mở khóa tài khoản thành công: tài khoản bị khóa không thể đăng nhập, tài khoản mở khóa có thể đăng nhập lại bình thường
- Tìm kiếm và lọc danh sách người dùng theo tên, email, vai trò, trạng thái với kết quả phân trang chính xác
- Xóa mềm tài khoản không thành công khi tài khoản còn dữ liệu nghiệp vụ liên quan (phanhien, bao cao)

## In Scope

- Tạo tài khoản người dùng mới (tên, email, mật khẩu, vai trò, đơn vị)
- Chỉnh sửa thông tin tài khoản (tên, email, vai trò, đơn vị)
- Xóa tài khoản (cần xác nhận, không xóa nếu có dữ liệu liên quan)
- Khóa/Mở khóa tài khoản (ngăn/tiếp tục truy cập)
- Reset mật khẩu (tự động hoặc bằng admin)
- Phân quyền theo vai trò (RBAC — Role-Based Access Control)
- Xem danh sách người dùng với bộ lọc (tên, email, vai trò, trạng thái)
- Tìm kiếm người dùng (theo tên hoặc email)
- Phân trang danh sách người dùng
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Quản lý SSO/OAuth (tích hợp bên thứ ba)
- Quản lý Multi-Factor Authentication (MFA)
- Audit log cho hoạt động quản lý tài khoản (F-005 sẽ đảm nhận)
- Tự động provision từ danh bạ công ty

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa, khóa/mở khóa, reset mật khẩu, phân quyền |
| Lanh dao | View + Approve | Xem danh sách, duyệt yêu cầu tạo/xóa tài khoản |
| Can bo | View + Edit | Xem danh sách, chỉnh sửa thông tin, khóa/mở khóa |
| Ca nhan | Self only | Chỉ xem và sửa thông tin cá nhân |

## Entities

- **UserAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), roleId(BIGINT FK→Role), organizationId(BIGINT FK→Organization), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL), lastLoginAt(TIMESTAMP NULL)
- **Role**: id(BIGINT PK), name(VARCHAR 50 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), permissions(JSON), isSystem(BOOLEAN DEFAULT false)
- **Organization**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), parentId(BIGINT FK→Organization), type(VARCHAR 30), status(VARCHAR 20), coefficient(DECIMAL 5,2), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **UserRole**: id(BIGINT PK), userId(BIGINT FK→UserAccount), roleId(BIGINT FK→Role), assignedBy(BIGINT FK→UserAccount), assignedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL)
- **PasswordResetToken**: id(BIGINT PK), userId(BIGINT FK→UserAccount), token(VARCHAR 255 NOT NULL), expiresAt(TIMESTAMP NOT NULL), usedAt(TIMESTAMP NULL), createdAt(TIMESTAMP)
- **UserGroup**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), groupType(VARCHAR 30), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **GroupMember**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), userId(BIGINT FK→UserAccount), joinedBy(BIGINT FK→UserAccount), joinedAt(TIMESTAMP)
- **AdminAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), adminType(VARCHAR 30), moduleAccess(JSON), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), lastLoginAt(TIMESTAMP)
- **AccessLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount), username(VARCHAR 50), action(VARCHAR 30), targetResource(VARCHAR 100), ipAddress(VARCHAR 45), userAgent(TEXT), responseCode(INT), duration_ms(INT), status(VARCHAR 20), createdAt(TIMESTAMP)
- **MapSymbol**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), symbolType(VARCHAR 30), color(VARCHAR 7), size(INT), svgData(TEXT), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **DataConnection**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), connectionType(VARCHAR 30), endpointUrl(VARCHAR 500 NOT NULL), authType(VARCHAR 30), config(JSON), status(VARCHAR 20), healthCheckUrl(VARCHAR 500), lastHealthCheck(TIMESTAMP NULL), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/users | Danh sách người dùng (phân trang) | JWT |
| GET | /api/v1/users/{id} | Chi tiết người dùng | JWT |
| POST | /api/v1/users | Tạo người dùng mới | Admin |
| PUT | /api/v1/users/{id} | Chỉnh sửa người dùng | Admin, Can bo |
| DELETE | /api/v1/users/{id} | Xóa người dùng | Admin |
| PUT | /api/v1/users/{id}/lock | Khóa/mở khóa tài khoản | Admin |
| POST | /api/v1/users/{id}/reset-password | Reset mật khẩu | Admin |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| POST | /api/v1/roles | Tạo vai trò mới | Admin |
| PUT | /api/v1/roles/{id} | Chỉnh sửa vai trò | Admin |
| DELETE | /api/v1/roles/{id} | Xóa vai trò | Admin |
| GET | /api/v1/organizations | Danh sách đơn vị | JWT |
| POST | /api/v1/organizations | Tạo đơn vị mới | Admin |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| POST | /api/v1/groups | Tạo nhóm mới | Admin |
| POST | /api/v1/groups/{id}/members | Thêm thành viên vào nhóm | Admin |
| DELETE | /api/v1/groups/{id}/members/{userId} | Xóa thành viên khỏi nhóm | Admin |
| GET | /api/v1/admins | Danh sách tài khoản admin | Super Admin |
| POST | /api/v1/admins | Tạo tài khoản admin | Super Admin |
| GET | /api/v1/logs | Danh sách log truy cập | Admin, Security |
| GET | /api/v1/logs/export | Xuất log CSV | Admin |
| GET | /api/v1/symbols | Danh sách biểu tượng bản đồ | JWT |
| POST | /api/v1/symbols | Tạo biểu tượng mới | Admin |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |
| POST | /api/v1/connections | Tạo kết nối mới | Admin |
| PUT | /api/v1/connections/{id}/health | Health check | Admin |

## Architecture Notes

- **Pattern**: Repository Pattern (Spring Data JPA) cho data access
- **Auth**: Spring Security + JWT (Access token 30 phút, Refresh token 7 ngày)
- **RBAC**: Role-based với permission matrix (JSON column trong Role table)
- **Soft Delete**: deleted_at TIMESTAMP NULL trên tất cả bảng (không xóa cứng)
- **Pagination**: Spring Pageable → Page<T> với default 20 items/page, max 100
- **Validation**: Jakarta Validation (@NotNull, @Email, @Size) trên DTO
- **Audit**: @CreatedDate, @LastModifiedBy từ Spring Data JPA

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Email phải unique trong hệ thống | Create/Update User | UC-001 |
| BR-002 | Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số | Create/Update User | UC-001 |
| BR-003 | Không được xóa tài khoản có dữ liệu liên quan (phanhien, bao cao) | Delete User | UC-003 |
| BR-004 | Tài khoản bị khóa không được đăng nhập | Login | UC-005 |
| BR-005 | Chỉ Admin mới có quyền phân quyền cho vai trò khác | Role Assignment | UC-006 |
| BR-006 | Token reset mật khẩu hết hạn sau 1 giờ | Password Reset | UC-007 |
| BR-007 | Tài khoản tự động khóa sau 5 lần đăng nhập sai | Login Security | UC-005 |

## Testing Strategy

- Unit tests: Password validation, RBAC permission matrix, token expiry
- Integration tests: CRUD UserAccount with role and organization associations
- E2E tests: Create user → assign role → login → verify permissions
- UI tests: Sidebar responsive, toast notifications, modal confirmations, pagination, search, filter
