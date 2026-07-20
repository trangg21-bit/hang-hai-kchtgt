---
id: F-111
name: "Quản lý Đài LRIT - Cập nhật"
slug: quan-ly-dai-lrit-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ cập nhật thông tin của một đài thông tin LRIT (Long Range Identification and Tracking) đã tồn tại trong hệ thống. Người dùng chỉ định mã đài qua UUID trong URL và nhập các trường dữ liệu cần sửa đổi: terminalId (mã thiết bị đầu cuối), imoNumber (số IMO của tàu), reportingInterval (khoảng thời gian báo cáo tính bằng phút), antennaHeight (chiều cao ăng-ten mét), powerOutput (công suất phát watts), antennaType (loại ăng-ten), dataFormat (định dạng dữ liệu), communicationChannel (kênh truyền thông), coverageArea (khu vực phủ sóng), locationAddress (địa chỉ lắp đặt), contactPerson (người liên hệ), contactPhone (số điện thoại liên hệ). Hệ thống kiểm tra sự tồn tại của bản ghi qua repository, thực hiện update và ghi nhận lịch sử hành động UPDATE ngay sau khi lưu thành công vào bảng coastal_station_lrit.

## Business Intent

Cập nhật thông tin kỹ thuật của các đài thông tin LRIT khi có thay đổi về trang thiết bị, thông số kỹ thuật hoặc thông tin liên hệ, đảm bảo dữ liệu giám sát tàu biển luôn chính xác và kịp thời theo yêu cầu SOLAS.

## Flow Summary

1. Người dùng chọn đài LRIT cần cập nhật từ danh sách và truy cập trang chỉnh sửa với phương thức PUT /api/v1/stations/lrit/{id}. 2. Hệ thống tìm kiếm bản ghi theo UUID, nếu không tồn tại trả về lỗi 404. 3. Nếu tồn tại, hệ thống cập nhật các trường dữ liệu, lưu lại vào bảng coastal_station_lrit với timestamp updatedAt tự động điều chỉnh, và ghi nhận lịch sử UPDATE qua HistoryService. 4. Nếu cập nhật gây xung đột dữ liệu (ví dụ mã trùng lặp), hệ thống từ chối và thông báo lỗi chi tiết.

## Acceptance Criteria

- Hệ thống chấp nhận PUT /api/v1/stations/lrit/{id} với CoastalStationLRITUpdateRequest chứa các trường: stationCode, stationName, terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea
- Khi UUID không tồn tại, hệ thống trả về lỗi "LRIT station not found" và không thực hiện lưu dữ liệu
- Sau khi cập nhật thành công, hệ thống ghi nhận lịch sử UPDATE với nội dung "LRIT station updated", timestamp và người thực hiện
- Trạng thái của đài không tự động thay đổi sau khi cập nhật (giữ nguyên trạng thái hiện tại)

## In Scope

(Cập nhật bản ghi hiện có qua PUT /api/v1/stations/lrit/{id}, ghi nhận audit history)

## Out of Scope

(Tạo mới (F-110), phê duyệt (F-113), xem chi tiết (F-114), xóa (F-112))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Toàn quyền cập nhật |
| Chuyên viên nghiệp vụ (Operator) | Write | Được cập nhật đài của mình |
| Lãnh đạo phê duyệt L1 | Read | Chỉ xem, không sửa |
| Lãnh đạo phê duyệt L2 | Read | Chỉ xem, không sửa |
| Người xem (Viewer) | Read | Không được cập nhật |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt
- CoastalStationLRIT (coastal_station_lrit) — terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | Update | @Column(unique=true), @NotBlank, @Size(max=50) — BaseStation |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | Update | @NotBlank, @Size(max=200) — BaseStation |
| BR-008 | Mã code không thể thay đổi sau khi tạo | Update | Code comment trong UpdateBeaconLightRequest pattern (tham chiếu) |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | Update | @Size(max=1000) — BaseStation |

## Testing Strategy

(populated by qa stage)
