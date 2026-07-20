---
id: F-118
name: "Quản lý Đài TT Hàng hải HN - Xóa"
slug: quan-ly-dai-tt-hang-hai-hn-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Xóa

## Description

Tính năng cho phép cán bộ nghiệp vụ thực hiện xóa mềm (soft-delete) một đài thông tin Hàng hải tại Hải Phòng (CoastalStationHaiphong) đã tồn tại trong hệ thống. Khác với xóa cứng, xóa mềm không xóa bản ghi khỏi cơ sở dữ liệu mà chỉ đánh dấu bằng cách đặt trường deletedAt với timestamp hiện tại. Hệ thống sử dụng Hibernate @SQLRestriction("deleted_at IS NULL") để tự động lọc tất cả các truy vấn không bao gồm các bản ghi đã bị xóa. Hành động xóa được thực hiện qua DELETE /api/v1/stations/haiphong/{id} với mã định danh UUID của đài. Sau khi xóa, hệ thống ghi nhận lịch sử hành động DELETE với thông tin mã đài, trạng thái trước đó là "Active" và nội dung "Haiphong station deleted".

## Business Intent

Quản lý vòng đời đài thông tin Hàng hải Hải Phòng khi thiết bị không còn hoạt động hoặc cần bảo trì dài hạn, đảm bảo dữ liệu được giữ lại trong hệ thống (soft-delete) để phục vụ kiểm toán, truy xuất lịch sử và không làm mất thông tin lịch sử liên quan đến đài.

## Flow Summary

1. Người dùng chọn đài TT Hàng hải HN cần xóa từ danh sách và gửi yêu cầu xóa qua DELETE /api/v1/stations/haiphong/{id}. 2. Hệ thống tìm kiếm bản ghi theo UUID trong bảng coastal_station_haiphong, nếu không tồn tại trả về lỗi 404. 3. Nếu tồn tại, hệ thống gọi phương thức softDelete() để đặt deletedAt = LocalDateTime.now(), lưu lại vào database, và ghi nhận lịch sử DELETE qua HistoryService với thông tin stationCode, actionType DELETE, previousValue "Active", newValue "Haiphong station deleted". 4. Bản ghi vẫn còn trong database nhưng bị ẩn khỏi tất cả các truy vấn liệt kê, tìm kiếm và chi tiết do @SQLRestriction("deleted_at IS NULL").

## Acceptance Criteria

- Hệ thống chấp nhận DELETE /api/v1/stations/haiphong/{id} với phương thức HTTP DELETE
- Khi UUID không tồn tại, hệ thống trả về lỗi "Haiphong station not found" và không thực hiện xóa
- Sau khi xóa thành công, hệ thống đặt deletedAt = LocalDateTime.now() trên bản ghi coastal_station_haiphong
- Hệ thống ghi nhận lịch sử hành động DELETE với thông tin stationCode, actionType DELETE, previousValue "Active"
- Bản ghi vẫn tồn tại trong database nhưng bị ẩn bởi @SQLRestriction("deleted_at IS NULL") trong findAll, search, findByPortName

## In Scope

(Xóa mềm bản ghi coastal_station_haiphong qua DELETE, đặt deletedAt, ghi nhận audit history)

## Out of Scope

(Xóa cứng khỏi database, tạo mới (F-116), phê duyệt (F-119), xem chi tiết (F-120))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Toàn quyền xóa |
| Chuyên viên nghiệp vụ (Operator) | Write | Được xóa đài đã tạo |
| Người xem (Viewer) | Read | Không được xóa |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), createdAt, updatedAt, deletedAt (soft-delete via @SQLRestriction("deleted_at IS NULL"), softDelete())
- CoastalStationHaiphong (coastal_station_haiphong) — portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deletedAt) | Delete | softDelete(), @SQLRestriction("deleted_at IS NULL") — BaseStation |
| BR-001 | Mã (code) phải là duy nhất | Delete | Không ảnh hưởng, chỉ cần tìm theo UUID |

## Testing Strategy

(populated by qa stage)
