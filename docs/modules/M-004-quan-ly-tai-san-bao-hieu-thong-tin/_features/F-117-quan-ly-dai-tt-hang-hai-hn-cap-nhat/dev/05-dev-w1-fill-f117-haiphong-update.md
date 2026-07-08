---
id: F-117
name: "Quản lý Đài TT Hàng hải HN - Cập nhật"
slug: quan-ly-dai-tt-hang-hai-hn-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ cập nhật thông tin của một đài thông tin Hàng hải tại Hải Phòng (CoastalStationHaiphong) đã tồn tại trong hệ thống. Người dùng chỉ định mã đài qua UUID trong URL và nhập các trường dữ liệu cần sửa đổi: portName (tên cảng), district (quận/huyện), ward (phường/xã), operationalLicense (giấy phép hoạt động), licenseExpiry (hạn giấy phép), inspectorName (tên thanh tra viên), inspectorPhone (số điện thoại thanh tra viên), lastInspectionDate (ngày thanh tra cuối), nextInspectionDate (ngày thanh tra kế tiếp), coverageArea (khu vực phủ sóng), equipmentType (loại thiết bị), communicationFrequency (tần số truyền thông), locationAddress (địa chỉ lắp đặt), contactPerson (người liên hệ), contactPhone (số điện thoại liên hệ). Hệ thống kiểm tra sự tồn tại của bản ghi qua repository, thực hiện update và ghi nhận lịch sử hành động UPDATE ngay sau khi lưu thành công vào bảng coastal_station_haiphong.

## Business Intent

Cập nhật thông tin kỹ thuật và quản lý của các đài thông tin Hàng hải Hải Phòng khi có thay đổi về thông tin thanh tra, giấy phép hoạt động, hoặc thông số kỹ thuật, đảm bảo dữ liệu quản lý hàng hải địa phương luôn chính xác và kịp thời.

## Flow Summary

1. Người dùng chọn đài TT Hàng hải HN cần cập nhật từ danh sách và truy cập trang chỉnh sửa với phương thức PUT /api/v1/stations/haiphong/{id}. 2. Hệ thống tìm kiếm bản ghi theo UUID, nếu không tồn tại trả về lỗi 404. 3. Nếu tồn tại, hệ thống cập nhật các trường dữ liệu, lưu lại vào bảng coastal_station_haiphong với timestamp updatedAt tự động điều chỉnh, và ghi nhận lịch sử UPDATE qua HistoryService. 4. Nếu cập nhật gây xung đột dữ liệu (ví dụ mã trùng lặp), hệ thống từ chối và thông báo lỗi chi tiết.

## Acceptance Criteria

- Hệ thống chấp nhận PUT /api/v1/stations/haiphong/{id} với CoastalStationHaiphongUpdateRequest chứa các trường: stationCode, stationName, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone
- Khi UUID không tồn tại, hệ thống trả về lỗi "Haiphong station not found" và không thực hiện lưu dữ liệu
- Sau khi cập nhật thành công, hệ thống ghi nhận lịch sử UPDATE với nội dung "Haiphong station updated", timestamp và người thực hiện
- Trạng thái của đài không tự động thay đổi sau khi cập nhật (giữ nguyên trạng thái hiện tại)

## In Scope

(Cập nhật bản ghi hiện có qua PUT /api/v1/stations/haiphong/{id}, ghi nhận audit history)

## Out of Scope

(Tạo mới (F-116), phê duyệt (F-119), xem chi tiết (F-120), xóa (F-118))

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
- CoastalStationHaiphong (coastal_station_haiphong) — portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | Update | @Column(unique=true), @NotBlank, @Size(max=50) — BaseStation |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | Update | @NotBlank, @Size(max=200) — BaseStation |
| BR-008 | Mã code không thể thay đổi sau khi tạo | Update | Code comment pattern (tham chiếu từ BeaconLight Update) |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | Update | @Size(max=1000) — BaseStation |

## Testing Strategy

(populated by qa stage)
