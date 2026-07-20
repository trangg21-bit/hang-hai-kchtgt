---
id: F-092
name: "Quản lý Đài TTDH - Tạo mới"
slug: quan-ly-dai-ttdh-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ tạo mới một đài thông tin duyên hải loại VTS (Very High Frequency) thông qua giao diện quản lý. Đài TTDH được lưu trữ trong bảng `coastal_station_vts` với các trường đặc thù bao gồm: tần số hoạt động (frequencyBand), công suất phát (transmitPower), loại thiết bị (equipmentType), địa chỉ lắp đặt (locationAddress), người liên hệ (contactPerson) và số điện thoại liên hệ (contactPhone). Bên cạnh đó, hệ thống tự động ghi nhận các trường kế thừa từ BaseStation như mã đài (code), tên đài (name), tọa độ GPS (latitude, longitude), mô tả (description), ID đơn vị quản lý (unitId), trạng thái hoạt động (isActive). Hệ thống tự động thiết lập trạng thái `PENDING_APPROVAL` và trạng thái phê duyệt `PENDING` ngay khi đài được tạo mới, đảm bảo quy trình kiểm soát chất lượng dữ liệu trước khi đưa vào sử dụng chính thức.

## Business Intent

Quản lý hệ thống đài thông tin duyên hải loại VTS phục vụ công tác thông tin liên lạc, chỉ đạo điều hành giao thông thủy, an toàn hàng hải và hỗ trợ công tác cứu hộ cứu nạn trên vùng biển thuộc phạm vi quản lý.

## Flow Summary

1. Người dùng đăng nhập vào hệ thống với vai trò cán bộ nghiệp vụ (Operator) và truy cập giao diện quản lý đài TTDH. 2. Người dùng chọn nút "Tạo mới", điền đầy đủ các trường thông tin bao gồm mã đài (duy nhất), tên đài, tần số, công suất phát, loại thiết bị, tọa độ và thông tin liên hệ. 3. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào: mã đài không được để trống và phải duy nhất (unique constraint theo `@Column(unique=true)`), tọa độ nằm trong khoảng hợp lệ (latitude: -90.0 đến 90.0, longitude: -180.0 đến 180.0), mô tả không vượt quá 1000 ký tự. 4. Nếu dữ liệu hợp lệ, hệ thống tạo mới bản ghi trong bảng `coastal_station_vts` với trạng thái mặc định `PENDING_APPROVAL` và `approvalStatus = PENDING`, đồng thời ghi nhận thời điểm tạo (`createdAt`). 5. Nếu dữ liệu không hợp lệ, hệ thống trả về thông báo lỗi chi tiết tương ứng với từng trường vi phạm. 6. Hệ thống ghi nhận hoạt động tạo mới vào lịch sử thay đổi (audit history) với action type `CREATE`.

## Acceptance Criteria

- Hệ thống hiển thị form tạo mới đài VTS với đầy đủ các trường: mã đài (code, unique, max 50 ký tự, bắt buộc), tên đài (name, max 200 ký tự, bắt buộc), tần số (frequencyBand), công suất phát (transmitPower, số thực), loại thiết bị (equipmentType), địa chỉ lắp đặt (locationAddress, max 1000 ký tự), người liên hệ (contactPerson), số điện thoại liên hệ (contactPhone), tọa độ (latitude, longitude), mô tả (description, max 1000 ký tự)
- Khi tạo mới thành công, đài có trạng thái `PENDING_APPROVAL` và `approvalStatus = PENDING`, phản hồi HTTP 200 với toàn bộ thông tin đài vừa tạo (bao gồm UUID id, timestamp createdAt)
- Khi mã đài đã tồn tại, hệ thống trả về lỗi 4xx (Conflict/ValidationError) với thông báo mã đài đã được sử dụng
- Khi tọa độ vượt ra ngoài khoảng hợp lệ (latitude ngoài [-90, 90] hoặc longitude ngoài [-180, 180]), hệ thống trả về lỗi validation với thông báo chi tiết trường vi phạm
- API endpoint: `POST /api/v1/stations/coastal` sử dụng `CoastalStationVTSRequest` DTO, có tích hợp `jakarta.validation.Valid` để kiểm tra đầu vào

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| Quản trị viên (Admin) | Full | Toàn quyền tạo, sửa, xóa, phê duyệt |
| Chuyên viên nghiệp vụ (Operator) | Write | Tạo mới, sửa đổi đài của đơn vị mình |
| Lãnh đạo phê duyệt L1 | Approve_L1 | Phê duyệt cấp 1 sau khi xem xét |
| Lãnh đạo phê duyệt L2 | Approve_L2 | Phê duyệt cấp 2, đưa vào sử dụng |
| Người xem (Viewer) | Read | Chỉ xem chi tiết, không tạo/sửa/xóa |

## Entities

- **CoastalStationVTS** (`coastal_station_vts`) — Kế thừa từ BaseStation: id (UUID), code (String, unique, max 50), name (String, max 200), latitude (Double), longitude (Double), description (String, max 1000), unitId (UUID), isActive (Boolean), status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel (Integer), approvedBy (Long), approvedDate (LocalDateTime), rejectionReason (String, max 1000), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (LocalDateTime) — Trường đặc thù VTS: frequencyBand (String), transmitPower (Double), equipmentType (String), locationAddress (String, max 1000), contactPerson (String), contactPhone (String)

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã đài (code) phải duy nhất trên toàn hệ thống, không được để trống, tối đa 50 ký tự | Create, Update | `@Column(unique=true)`, `@NotBlank`, `@Size(max=50)` trong BaseStation |
| BR-002 | Tên đài (name) không được để trống, tối đa 200 ký tự | Create, Update | `@NotBlank`, `@Size(max=200)` trong BaseStation |
| BR-003 | Tọa độ latitude phải trong khoảng -90.0 đến 90.0 | Create, Update | `@DecimalMin("-90.0")`, `@DecimalMax("90.0")` |
| BR-004 | Tọa độ longitude phải trong khoảng -180.0 đến 180.0 | Create, Update | `@DecimalMin("-180.0")`, `@DecimalMax("180.0")` |
| BR-005 | Mô tả (description) tối đa 1000 ký tự | Create, Update | `@Column(length=1000)` trong BaseStation |
| BR-006 | Trạng thái mặc định khi tạo mới là PENDING_APPROVAL với approvalStatus = PENDING | Create | `setDefaultStatus()` trong `@PrePersist` của CoastalStationVTS |
| BR-007 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deletedAt) | Delete | `softDelete()` và `@SQLRestriction("deleted_at IS NULL")` |

## Testing Strategy

(populated by qa stage)
