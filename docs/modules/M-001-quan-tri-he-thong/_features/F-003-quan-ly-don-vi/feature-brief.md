---
status: proposed
last-updated: 2026-06-17T03:23:16Z
---
---
id: F-003
name: Quan ly don vi
slug: quan-ly-don-vi
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:53Z
last-updated: 2026-06-17T01:35:44Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Quan ly don vi

## Description

Quan ly don vi Cuc, Chi cuc, Cang vu, TCT theo he thung cap phat

## Business Intent

Quan tri he thong - Quan ly don vi Cuc, Chi cuc, Cang vu, TCT

## Flow Summary

Quan tri he thong - Quan ly don vi Cuc, Chi cuc, Cang vu, TCT

## Acceptance Criteria

- Quan ly thong tin don vi
- Phan cap quyen don vi

## In Scope

- Tạo đơn vị mới (tên, mã, loại đơn vị, mô tả, địa chỉ, hệ số)
- Chỉnh sửa thông tin đơn vị
- Xóa đơn vị (không xóa nếu có cán bộ/đối tượng liên quan)
- Duyệt/Chấp thuận đơn vị (workflow approval)
- Xem danh sách đơn vị với bộ lọc (tên, mã, loại, hệ số)
- Tìm kiếm đơn vị (theo tên hoặc mã)
- Phân trang danh sách đơn vị
- UI: Sidebar cố định, header avatar, table sticky header, toast notification, modal xác nhận

## Out of Scope

- Tổ chức lại cơ cấu đơn vị (reorg)
- Tích hợp danh bạ công ty
- Tự động tạo đơn vị theo dự án

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Admin | Full access | Tạo, sửa, xóa, duyệt đơn vị |
| Lanh dao | Approve | Duyệt hoặc từ chối yêu cầu tạo/xóa đơn vị |
| Can bo | View + Create | Xem danh sách, tạo yêu cầu mới |
| Ca nhan | View | Chỉ xem đơn vị của mình |

## Entities

- **Unit**: id(BIGINT PK), name(VARCHAR 100 NOT NULL), code(VARCHAR 30 UNIQUE NOT NULL), unitType(VARCHAR 30 NOT NULL), description(TEXT), address(TEXT), coefficient(DECIMAL 5,2), status(VARCHAR 20), parentId(BIGINT FK→Unit NULL), level(INT DEFAULT 1), sortOrder(INT DEFAULT 0), createdAt(TIMESTAMP), updatedAt(TIMESTAMP), approvedAt(TIMESTAMP NULL), deletedAt(TIMESTAMP NULL)
- **UnitHistory**: id(BIGINT PK), unitId(BIGINT FK→Unit), action(VARCHAR 30 NOT NULL), performedBy(BIGINT FK→UserAccount), performedAt(TIMESTAMP), notes(TEXT)
- **OrganizationChart**: id(BIGINT PK), unitId(BIGINT FK→Unit UNIQUE), parentId(BIGINT FK→Unit NULL), level(INT), sortOrder(INT), effectiveDate(DATE)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/units | Danh sách đơn vị (phân trang) | JWT |
| GET | /api/v1/units/{id} | Chi tiết đơn vị | JWT |
| POST | /api/v1/units | Tạo đơn vị mới | Admin |
| PUT | /api/v1/units/{id} | Chỉnh sửa đơn vị | Admin |
| DELETE | /api/v1/units/{id} | Xóa đơn vị | Admin |
| POST | /api/v1/units/{id}/approve | Duyệt đơn vị | Admin |
| POST | /api/v1/units/{id}/reject | Từ chối đơn vị | Admin |
| GET | /api/v1/units/tree | Cây tổ chức (tree structure) | JWT |
| GET | /api/v1/users | Danh sách người dùng | JWT |
| GET | /api/v1/groups | Danh sách nhóm | JWT |
| GET | /api/v1/roles | Danh sách vai trò | JWT |
| GET | /api/v1/symbols | Danh sách biểu tượng bản đồ | JWT |
| GET | /api/v1/connections | Danh sách kết nối liên thông | Admin |

## Architecture Notes

- **Pattern**: Repository Pattern (Spring Data JPA) + Specification pattern cho query động
- **Tree Structure**: Materialized Path (path字段 trong Unit) hoặc Nested Sets cho đơn vị phân cấp
- **Soft Delete**: deleted_at TIMESTAMP NULL, không xóa cứng khi có data liên quan
- **Approval Workflow**: State machine với 3 trạng thái: pending → approved/rejected
- **Pagination**: Spring Pageable → Page<T> với default 20, max 100
- **Validation**: Jakarta Validation (@NotNull, @Email, @Size) trên DTO
- **Audit**: @CreatedDate, @LastModifiedBy từ Spring Data JPA

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-013 | Mã đơn vị phải unique trong hệ thống | Create/Update Unit | UC-011 |
| BR-014 | Không được xóa đơn vị có cán bộ/đối tượng liên quan | Delete Unit | UC-013 |
| BR-015 | Chỉ Admin mới có quyền duyệt đơn vị | Approval | UC-014 |
| BR-016 | Đơn vị có thể phân cấp cha/con (tree structure) | Hierarchy | UC-011 |
| BR-017 | Hệ số (coefficient) phải > 0 và có tối đa 2 chữ số thập phân | Unit Data | UC-011 |

## Testing Strategy

- Unit tests: Unique code validation, hierarchy tree build, coefficient format
- Integration tests: CRUD Unit with approval workflow
- E2E tests: Create unit → submit for approval → approve → verify
- UI tests: Responsive sidebar, sticky header, pagination, search, toast notifications
