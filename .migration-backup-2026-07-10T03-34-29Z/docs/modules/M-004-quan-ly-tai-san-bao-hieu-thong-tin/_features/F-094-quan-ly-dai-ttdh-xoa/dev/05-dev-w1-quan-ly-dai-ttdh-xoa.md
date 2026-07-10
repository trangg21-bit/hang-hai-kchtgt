---
id: F-094
name: "Quản lý Đài TTDH - Xóa"
slug: quan-ly-dai-ttdh-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Xóa

## Description

Tính năng cho phép quản trị viên hoặc cán bộ nghiệp vụ xóa một đài thông tin duyên hải loại VTS khỏi danh sách sử dụng hiện hành thông qua cơ chế soft-delete (xóa mềm). Thay vì xóa vĩnh viễn bản ghi ra khỏi database, hệ thống chỉ đặt timestamp vào trường `deletedAt` — tất cả các truy vấn đều có bộ lọc `@SQLRestriction("deleted_at IS NULL")` nên đài bị xóa mềm sẽ tự động ẩn khỏi danh sách và kết quả tìm kiếm nhưng vẫn được lưu trữ để đảm bảo khả năng phục hồi dữ liệu và truy vết lịch sử. Khi xóa, hệ thống kiểm tra sự tồn tại của đài theo ID, đặt `deletedAt` bằng thời điểm hiện tại thông qua phương thức `softDelete()` của BaseStation, và trả về HTTP 204 No Content khi thành công. Dữ liệu đài bị xóa mềm vẫn có thể được khôi phục bằng cách đặt lại `deletedAt = null` thông qua công cụ quản trị cơ sở dữ liệu hoặc API khôi phục chuyên biệt. Việc xóa được ghi nhận vào audit history với action type `SOFT_DELETE`.

## Business Intent

Cho phép tạm ngưng sử dụng đài VTS không còn hoạt động hoặc cần bảo trì, đồng thời giữ lại dữ liệu lịch sử để đảm bảo tính toàn vẹn của hệ thống thông tin và phục vụ công tác kiểm toán, truy vết sau này.

## Flow Summary

1. Người dùng đăng nhập với vai trò có quyền xóa (Admin hoặc Operator) và truy cập danh sách đài VTS. 2. Người dùng chọn một đài cần xóa và nhấn nút "Xóa", hệ thống hiển thị hộp thoại xác nhận với thông tin: "Bạn có chắc chắn muốn xóa đài [tên]?" kèm cảnh báo dữ liệu sẽ không hiển thị trong hệ thống nhưng không bị xóa vĩnh viễn. 3. Người dùng xác nhận bằng cách nhấn "Xác nhận xóa". 4. Hệ thống thực hiện DELETE request tới `DELETE /api/v1/stations/coastal/{id}`. 5. Backend kiểm tra sự tồn tại của đài theo ID: nếu không tìm thấy, trả về HTTP 404; nếu tìm thấy, gọi `softDelete()` để đặt `deletedAt = LocalDateTime.now()`. 6. Hệ thống trả về HTTP 204 No Content khi xóa mềm thành công. 7. Đài đã xóa mềm tự động biến mất khỏi tất cả danh sách (`getAllStations`, `searchStations`) do `@SQLRestriction("deleted_at IS NULL")`. 8. Hệ thống ghi nhận hành động xóa vào audit history với action type `SOFT_DELETE`.

## Acceptance Criteria

- Khi xóa mềm thành công, hệ thống trả về HTTP 204 No Content và đài không còn xuất hiện trong danh sách `getAllStations` hay kết quả `searchStations`
- Khi ID đài không tồn tại hoặc đã bị xóa mềm trước đó, hệ thống trả về HTTP 404 (Not Found)
- Dữ liệu đài bị xóa mềm vẫn tồn tại trong bảng `coastal_station_vts` (chỉ `deletedAt` được đặt timestamp)
- Đài bị xóa mềm không thể được cập nhật hoặc phê duyệt tiếp — hành động này sẽ trả về lỗi
- API endpoint: `DELETE /api/v1/stations/coastal/{id}` trả về `ResponseEntity<Void>` với status 204

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Toàn quyền xóa mềm mọi đài |
| Chuyên viên nghiệp vụ (Operator) | Delete | Xóa mềm đài của đơn vị mình |
| Lãnh đạo phê duyệt L1/L2 | Read | Không có quyền xóa |
| Người xem (Viewer) | Read | Không có quyền xóa |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code (String, unique), name (String, max 200), latitude (Double), longitude (Double), description (String, max 1000), unitId (UUID), isActive (Boolean), status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel (Integer), approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String, max 1000), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (LocalDateTime — được đặt khi xóa mềm) — Trường đặc thù VTS: frequencyBand (String), transmitPower (Double), equipmentType (String), locationAddress (String, max 1000), contactPerson (String), contactPhone (String)

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deletedAt timestamp) | Delete | `softDelete()` và `@SQLRestriction("deleted_at IS NULL")` trong BaseStation |
| BR-001 | Mã đài (code) phải duy nhất — vẫn áp dụng ngay cả với đài bị xóa mềm (unique constraint trên DB) | Delete | `@Column(unique=true)` trong BaseStation |

## Testing Strategy

(populated by qa stage)
