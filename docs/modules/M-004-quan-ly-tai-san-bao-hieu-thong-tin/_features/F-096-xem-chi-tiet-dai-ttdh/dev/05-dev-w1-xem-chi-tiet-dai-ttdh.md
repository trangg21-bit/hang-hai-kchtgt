---
id: F-096
name: "Xem chi tiết Đài TTDH"
slug: xem-chi-tiet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài TTDH

## Description

Tính năng cho phép tất cả các vai trò (admin, operator, approver L1/L2, viewer) xem thông tin chi tiết của một đài thông tin duyên hải loại VTS cụ thể theo định danh UUID. Hệ thống trả về dữ liệu dưới dạng `CoastalStationVTSResponse` DTO được build từ thực thể `CoastalStationVTS` thông qua service method `buildResponse()`. Phản hồi bao gồm toàn bộ thông tin kế thừa từ BaseStation (id, code, name, latitude, longitude, description, unitId, isActive, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt) cùng các trường đặc thù của VTS (frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone). Người dùng cũng có thể truy vấn danh sách tất cả đài VTS đang hoạt động (status không phải DELETED) thông qua endpoint `GET /api/v1/stations/coastal` để xem danh sách tóm tắt. Hệ thống lọc tự động các bản ghi đã bị xóa mềm (`deleted_at IS NULL`) thông qua `@SQLRestriction` của Hibernate.

## Business Intent

Cho phép các bên liên quan xem thông tin chi tiết của đài VTS để phục vụ công tác quản lý, theo dõi, ra quyết định phê duyệt, và tham chiếu trong các hoạt động điều hành giao thông thủy hàng hải.

## Flow Summary

1. Người dùng đăng nhập vào hệ thống và truy cập vào mục quản lý đài VTS. 2. Từ danh sách đài, người dùng nhấn vào tên hoặc nút "Xem chi tiết" của một đài. 3. Hệ thống gửi yêu cầu `GET /api/v1/stations/coastal/{id}` lên backend. 4. Backend tìm đài theo UUID trong bảng `coastal_station_vts` — nếu không tìm thấy hoặc đã xóa mềm, trả về HTTP 404. 5. Nếu tìm thấy, service build đối tượng `CoastalStationVTSResponse` từ entity và trả về HTTP 200 với toàn bộ thông tin chi tiết. 6. Giao diện hiển thị đầy đủ thông tin: mã đài, tên đài, tần số, công suất, loại thiết bị, địa chỉ, liên hệ, tọa độ, trạng thái phê duyệt và lịch sử phê duyệt (nếu có). 7. Người dùng cũng có thể sử dụng tính năng tìm kiếm (`GET /api/v1/stations/coastal/search?keyword=...`) để tìm nhanh đài theo tên hoặc mã.

## Acceptance Criteria

- Khi gửi GET `/api/v1/stations/coastal/{id}` với ID hợp lệ, hệ thống trả về HTTP 200 với `CoastalStationVTSResponse` chứa đầy đủ các trường: id, code, name, latitude, longitude, frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone, status, approvalStatus, description, isActive, createdAt, updatedAt
- Khi ID không tồn tại hoặc đài đã bị xóa mềm, hệ thống trả về HTTP 404
- Khi gửi `GET /api/v1/stations/coastal` (không có ID), hệ thống trả về danh sách tất cả đài VTS đang hoạt động (không xóa mềm) với HTTP 200
- Khi gửi `GET /api/v1/stations/coastal/search?keyword=...`, hệ thống trả về danh sách các đài trùng khớp với từ khóa tìm kiếm
- Khi gửi `GET /api/v1/stations/coastal/by-code/{code}`, hệ thống trả về đài tìm thấy theo mã (HTTP 200) hoặc 404 nếu không tìm thấy

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Xem toàn bộ đài trong hệ thống |
| Chuyên viên nghiệp vụ (Operator) | Read | Xem chi tiết đài của đơn vị mình |
| Lãnh đạo phê duyệt L1/L2 | Read | Xem chi tiết đài để xem xét phê duyệt |
| Người xem (Viewer) | Read | Xem chi tiết tất cả đài đã xuất bản |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code (String, unique, max 50), name (String, max 200), latitude (Double), longitude (Double), description (String, max 1000), unitId (UUID), isActive (Boolean), status (StationStatus: DRAFT/PENDING_APPROVAL/APPROVED_L1/APPROVED_L2/PUBLISHED/DELETED), approvalStatus (StationApprovalStatus: PENDING/APPROVED_L1/APPROVED_L2/REJECTED), approvalLevel (Integer), approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String, max 1000), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (LocalDateTime) — Trường đặc thù VTS: frequencyBand (String), transmitPower (Double), equipmentType (String), locationAddress (String, max 1000), contactPerson (String), contactPhone (String)

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã đài (code) phải duy nhất | Read | `@Column(unique=true)` trong BaseStation |
| BR-007 | Không thể xóa vĩnh viễn — chỉ soft-delete | Read | `@SQLRestriction("deleted_at IS NULL")` — đài xóa mềm không xuất hiện trong kết quả đọc |

## Testing Strategy

(populated by qa stage)
