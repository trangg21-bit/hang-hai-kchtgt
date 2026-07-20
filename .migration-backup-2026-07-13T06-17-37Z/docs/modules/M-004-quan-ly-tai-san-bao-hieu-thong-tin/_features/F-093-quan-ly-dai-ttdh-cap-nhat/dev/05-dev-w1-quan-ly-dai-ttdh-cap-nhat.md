---
id: F-093
name: "Quản lý Đài TTDH - Cập nhật"
slug: quan-ly-dai-ttdh-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ hoặc quản trị viên cập nhật thông tin của một đài thông tin duyên hải loại VTS đã tồn tại trong hệ thống. Khi cập nhật, người dùng gửi yêu cầu PUT đến endpoint với ID của đài và payload chứa `CoastalStationVTSUpdateRequest`. Hệ thống hỗ trợ cập nhật các trường: tần số hoạt động (frequencyBand), công suất phát (transmitPower), loại thiết bị (equipmentType), địa chỉ lắp đặt (locationAddress), người liên hệ (contactPerson), số điện thoại liên hệ (contactPhone), cùng với các trường kế thừa từ BaseStation như tên, tọa độ, mô tả, trạng thái hoạt động. Mã đài (code) không thể thay đổi sau khi tạo (immutable) theo quy tắc nghiệp vụ BR-008. Trạng thái hoạt động (`isActive`) có thể được cập nhật để tạm ngưng sử dụng đài. Hệ thống tự động cập nhật trường `updatedAt` mỗi khi có thay đổi thông qua `@PreUpdate` callback. Việc cập nhật được ghi nhận vào lịch sử thay đổi để đảm bảo khả năng truy vết.

## Business Intent

Cho phép cập nhật thông tin kỹ thuật và liên hệ của đài VTS khi có thay đổi về thiết bị, vị trí lắp đặt hoặc nhân sự phụ trách, đảm bảo dữ liệu luôn chính xác và kịp thời phục vụ công tác chỉ đạo điều hành.

## Flow Summary

1. Người dùng đăng nhập với vai trò có quyền viết (Admin hoặc Operator) và truy cập danh sách đài VTS. 2. Người dùng chọn một đài cụ thể và nhấn nút "Cập nhật", hệ thống hiển thị form với các giá trị hiện tại của đài. 3. Người dùng sửa đổi các trường cần thay đổi (tần số, công suất, loại thiết bị, địa chỉ, liên hệ, tọa độ, mô tả, isActive). 4. Hệ thống kiểm tra tính hợp lệ của dữ liệu: validate các trường bắt buộc, giới hạn ký tự, khoảng tọa độ. 5. Nếu dữ liệu hợp lệ, hệ thống cập nhật bản ghi trong bảng `coastal_station_vts`, tự động cập nhật `updatedAt` timestamp, và trả về bản ghi đã cập nhật với HTTP 200. 6. Nếu dữ liệu không hợp lệ, hệ thống trả về lỗi 4xx với thông báo lỗi chi tiết cho từng trường. 7. Hệ thống ghi nhận hành động cập nhật vào audit history với action type `UPDATE`.

## Acceptance Criteria

- Khi cập nhật thành công, hệ thống trả về HTTP 200 với toàn bộ thông tin đài đã được cập nhật (bao gồm updated updatedAt timestamp)
- Mã đài (code) không thể thay đổi sau khi tạo — nếu cố gắng thay đổi code trong payload cập nhật, hệ thống trả về lỗi validation (theo quy tắc BR-008 immutable)
- Khi ID đài không tồn tại, hệ thống trả về HTTP 404 (Not Found)
- Các trường đặc thù VTS (frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone) có thể cập nhật độc lập với các trường BaseStation
- API endpoint: `PUT /api/v1/stations/coastal/{id}` sử dụng `CoastalStationVTSUpdateRequest` DTO, có tích hợp `jakarta.validation.Valid`

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Toàn quyền cập nhật mọi thông tin |
| Chuyên viên nghiệp vụ (Operator) | Write | Cập nhật thông tin đài của đơn vị mình |
| Lãnh đạo phê duyệt L1/L2 | Read | Chỉ xem chi tiết, không cập nhật |
| Người xem (Viewer) | Read | Không có quyền cập nhật |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code (String, immutable), name (String, max 200), latitude (Double), longitude (Double), description (String, max 1000), unitId (UUID), isActive (Boolean), status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel (Integer), approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String, max 1000), createdAt (LocalDateTime), updatedAt (LocalDateTime, tự động cập nhật), deletedAt (LocalDateTime) — Trường đặc thù VTS: frequencyBand (String), transmitPower (Double), equipmentType (String), locationAddress (String, max 1000), contactPerson (String), contactPhone (String)

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã đài (code) phải duy nhất, không thể thay đổi sau khi tạo | Update | `@Column(unique=true)` trong BaseStation; comment immutable trong UpdateDTO |
| BR-002 | Tên đài (name) không được để trống, tối đa 200 ký tự | Update | `@NotBlank`, `@Size(max=200)` |
| BR-003 | Tọa độ latitude phải trong khoảng -90.0 đến 90.0 | Update | `@DecimalMin("-90.0")`, `@DecimalMax("90.0")` |
| BR-004 | Tọa độ longitude phải trong khoảng -180.0 đến 180.0 | Update | `@DecimalMin("-180.0")`, `@DecimalMax("180.0")` |
| BR-005 | Mô tả (description) tối đa 1000 ký tự | Update | `@Column(length=1000)` trong BaseStation |
| BR-008 | Mã code không thể thay đổi sau khi tạo (immutable) | Update | Comment trong UpdateBeaconLightRequest — áp dụng chung cho CoastalStation* |

## Testing Strategy

(populated by qa stage)
