---
id: F-002
name: Quản lý nhóm người dùng
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-06-26T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quản lý nhóm người dùng

## Description

Quản lý tập trung các nhóm người dùng trong hệ thống, cho phép tạo mới, chỉnh sửa, xóa các nhóm theo loại (department/project/custom), quản lý thành viên nhóm (thêm/xóa), và sao chép nhóm để tạo nhanh các nhóm có cấu trúc tương tự. Tính năng hỗ trợ tra cứu, tìm kiếm và phân trang danh sách nhóm với các bộ lọc thông minh.

## Business Intent

Quản trị hệ thống cần cơ chế phân nhóm người dùng linh hoạt để tổ chức cán bộ theo đơn vị, dự án hoặc nhóm công việc đặc thù, giúp tối ưu hóa việc gán quyền, chia sẻ dữ liệu và phối hợp nghiệp vụ giữa các thành viên trong cùng nhóm.

## Flow Summary

Quản trị hệ thống truy cập module Quản lý nhóm từ sidebar → chọn tạo nhóm mới hoặc quản lý nhóm hiện có → điền thông tin nhóm (tên, mã, loại nhóm, mô tả) → hệ thống kiểm tra tên nhóm unique → tạo nhóm thành công → thêm/xóa thành viên từ danh sách người dùng hệ thống → hệ thống ghi nhận lịch sử thay đổi nhóm → hiển thị danh sách nhóm với khả năng lọc theo tên, loại nhóm, số lượng thành viên và phân trang. Quy trình mở rộng bao gồm: sao chép nhóm để tạo nhanh nhóm tương tự, xem chi tiết thành viên từng nhóm, và quản lý quyền hạn của thành viên trong nhóm (roleInGroup).

## Acceptance Criteria

- Tạo/sửa/xóa nhóm thành công với tên nhóm unique trong hệ thống, nhóm chỉ có thể xóa khi không còn thành viên
- Thêm/Xóa người dùng vào khỏi nhóm chính xác, người dùng có thể thuộc nhiều nhóm cùng lúc, ghi nhận lịch sử thay đổi thành viên
- Sao chép nhóm (duplicate) thành công để tạo nhanh nhóm có cấu trúc tương tự với toàn bộ thành viên gốc
- Tìm kiếm và lọc danh sách nhóm theo tên, loại nhóm, số lượng thành viên với kết quả phân trang chính xác

## In Scope

- Tạo nhóm người dùng mới (tên nhóm, mô tả, loại nhóm)
- Thêm/Xóa người dùng khỏi nhóm
- Chỉnh sửa thông tin nhóm (tên, mô tả, loại nhóm)
- Xóa nhóm (không xóa nếu còn thành viên)
- Sao chép nhóm (duplicate để tạo nhóm tương tự nhanh)
- Xem danh sách nhóm với bộ lọc (tên, loại, thành viên)
- Tìm kiếm nhóm (theo tên)
- Phân trang danh sách nhóm
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Nhóm phân quyền tĩnh (F-001 Roles đảm nhận)
- Tự động thêm thành viên theo điều kiện (rule-based membership)
- Phân cấp nhóm cha/con (nhiều cấp)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa nhóm, thêm/xóa thành viên |
| Lanh dao | View | Xem danh sách nhóm, xem thành viên |
| Can bo | View + Edit | Xem danh sách, thêm/xóa thành viên, sửa thông tin |
| Ca nhan | Self only | Xem nhóm cá nhân thuộc về |

## Entities

- **UserGroup**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), groupType(VARCHAR 30), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **GroupMember**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), userId(BIGINT FK→UserAccount), joinedBy(BIGINT FK→UserAccount), joinedAt(TIMESTAMP), roleInGroup(VARCHAR 30)
- **GroupHistory**: id(BIGINT PK), groupId(BIGINT FK→UserGroup), action(VARCHAR 30), performedBy(BIGINT FK→UserAccount), performedAt(TIMESTAMP), notes(TEXT)
- **UserAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), email(VARCHAR 100 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), roleId(BIGINT FK→Role), organizationId(BIGINT FK→Organization), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), deletedAt(TIMESTAMP NULL), lastLoginAt(TIMESTAMP NULL)
- **Role**: id(BIGINT PK), name(VARCHAR 50 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), description(TEXT), permissions(JSON), isSystem(BOOLEAN DEFAULT false)
- **Organization**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), parentId(BIGINT FK→Organization), type(VARCHAR 30), status(VARCHAR 20), coefficient(DECIMAL 5,2), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **UserRole**: id(BIGINT PK), userId(BIGINT FK→UserAccount), roleId(BIGINT FK→Role), assignedBy(BIGINT FK→UserAccount), assignedAt(TIMESTAMP), expiresAt(TIMESTAMP NULL)
- **PasswordResetToken**: id(BIGINT PK), userId(BIGINT FK→UserAccount), token(VARCHAR 255 NOT NULL), expiresAt(TIMESTAMP NOT NULL), usedAt(TIMESTAMP NULL), createdAt(TIMESTAMP)
- **AdminAccount**: id(BIGINT PK), username(VARCHAR 50 UNIQUE NOT NULL), passwordHash(VARCHAR 255 NOT NULL), adminType(VARCHAR 30), moduleAccess(JSON), status(VARCHAR 20), mfaEnabled(BOOLEAN DEFAULT false), lastLoginAt(TIMESTAMP)
- **AccessLog**: id(BIGINT PK), userId(BIGINT FK→UserAccount), username(VARCHAR 50), action(VARCHAR 30), targetResource(VARCHAR 100), ipAddress(VARCHAR 45), userAgent(TEXT), responseCode(INT), duration_ms(INT), status(VARCHAR 20), createdAt(TIMESTAMP)
- **MapSymbol**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), symbolType(VARCHAR 30), color(VARCHAR 7), size(INT), svgData(TEXT), status(VARCHAR 20), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)
- **DataConnection**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), connectionType(VARCHAR 30), endpointUrl(VARCHAR 500 NOT NULL), authType(VARCHAR 30), config(JSON), status(VARCHAR 20), healthCheckUrl(VARCHAR 500), lastHealthCheck(TIMESTAMP NULL), createdAt(TIMESTAMP), updatedAt(TIMESTAMP)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/groups | Danh sách nhóm (phân trang) | JWT |
| GET | /api/v1/groups/{id} | Chi tiết nhóm | JWT |
| POST | /api/v1/groups | Tạo nhóm mới | Admin |
| PUT | /api/v1/groups/{id} | Chỉnh sửa nhóm | Admin |
| DELETE | /api/v1/groups/{id} | Xóa nhóm | Admin |
| POST | /api/v1/groups/{id}/members | Thêm thành viên | Admin |
| DELETE | /api/v1/groups/{id}/members/{userId} | Xóa thành viên | Admin |
| POST | /api/v1/groups/{id}/copy | Sao chép nhóm | Admin |
| GET | /api/v1/groups/{id}/members | Danh sách thành viên | JWT |
| GET | /api/v1/users | Danh sách người dùng (phân trang) | JWT |
| POST | /api/v1/users | Tạo người dùng mới | Admin |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| PUT | /api/v1/users/{id}/lock | Khóa/mở khóa tài khoản | Admin |
| GET | /api/v1/logs | Danh sách log truy cập | Admin, Security |
| GET | /api/v1/symbols | Danh sách biểu tượng bản đồ | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-008 | Tên nhóm phải unique trong hệ thống | Create/Update Group | UC-008 |
| BR-009 | Không được xóa nhóm còn thành viên | Delete Group | UC-010 |
| BR-010 | Người dùng có thể thuộc nhiều nhóm cùng lúc | Membership | UC-009 |
| BR-011 | Chỉ Admin mới có quyền xóa nhóm | Delete Group | UC-010 |
| BR-012 | GroupType phân loại: department/project/custom | Create Group | UC-008 |

## Testing Strategy

- Unit tests: Unique name validation, member count check on delete
- Integration tests: CRUD UserGroup with membership associations
- E2E tests: Create group → add members → verify group list → remove member
- UI tests: Responsive sidebar, sticky header, pagination, search, toast notifications
