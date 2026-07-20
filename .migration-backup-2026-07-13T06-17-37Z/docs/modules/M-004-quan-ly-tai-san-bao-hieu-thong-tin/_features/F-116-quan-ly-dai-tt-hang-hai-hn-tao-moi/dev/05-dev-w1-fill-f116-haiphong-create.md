---
id: F-116
name: "Quản lý Đài TT Hàng hải HN - Tạo mới"
slug: quan-ly-dai-tt-hang-hai-hn-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ tạo mới một đài thông tin Hàng hải tại Hải Phòng (CoastalStationHaiphong) phục vụ quản lý hàng hải địa phương. Người dùng nhập các trường dữ liệu đặc thù bao gồm: portName (tên cảng), district (quận/huyện), ward (phường/xã), operationalLicense (giấy phép hoạt động), licenseExpiry (hạn giấy phép), inspectorName (tên thanh tra viên), inspectorPhone (số điện thoại thanh tra viên), lastInspectionDate (ngày thanh tra cuối), nextInspectionDate (ngày thanh tra kế tiếp), coverageArea (khu vực phủ sóng), equipmentType (loại thiết bị), communicationFrequency (tần số truyền thông), locationAddress (địa chỉ lắp đặt), contactPerson (người liên hệ), contactPhone (số điện thoại liên hệ). Hệ thống tự động thiết lập trạng thái PENDING_APPROVAL và trạng thái phê duyệt PENDING khi tạo mới, ghi nhận lịch sử thay đổi CREATE ngay sau khi lưu thành công vào cơ sở dữ liệu bảng coastal_station_haiphong.

## Business Intent

Quản lý thống kê các đài thông tin Hàng hải tại TP. Hải Phòng, phục vụ công tác quản lý nhà nước về hàng hải địa phương, đảm bảo dữ liệu được lưu trữ có kiểm duyệt hai cấp trước khi công bố hoạt động.

## Flow Summary

1. Người dùng truy cập giao diện quản lý đài TT Hàng hải HN, chọn Tạo mới và nhập đầy đủ các trường dữ liệu vào form đăng ký đài thông tin. 2. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào theo các ràng buộc nghiệp vụ (mã đài duy nhất, tên không rỗng). 3. Nếu hợp lệ, hệ thống tạo bản ghi vào bảng coastal_station_haiphong với trạng thái PENDING_APPROVAL, trạng thái phê duyệt PENDING và tự động ghi nhận lịch sử hành động CREATE. 4. Nếu dữ liệu không hợp lệ, hệ thống hiển thị thông báo lỗi chi tiết kèm tên trường vi phạm để người dùng chỉnh sửa.

## Acceptance Criteria

- Hệ thống hiển thị form tạo mới đài TT Hàng hải HN với đầy đủ 15 trường dữ liệu đặc thù (portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone) cùng các trường thừa kế từ BaseStation: code, name, latitude, longitude, description, unitId
- Khi tạo mới thành công, trạng thái tự động thiết lập là PENDING_APPROVAL và trạng thái phê duyệt là PENDING, dữ liệu được lưu vào bảng coastal_station_haiphong
- Hệ thống ghi nhận lịch sử hành động CREATE ngay sau khi lưu thành công, với thông tin thay đổi, người thực hiện và thời gian
- Khi nhập mã đài (code) đã tồn tại, hệ thống từ chối và hiển thị thông báo lỗi mã trùng lặp

## In Scope

(Tạo bản ghi mới vào bảng coastal_station_haiphong, thiết lập trạng thái mặc định, ghi nhận audit history)

## Out of Scope

(Sửa đổi sau tạo, phê duyệt (F-119), xem chi tiết (F-120), xóa (F-118))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Toàn quyền tạo mới |
| Chuyên viên nghiệp vụ (Operator) | Write | Được tạo mới, gửi phê duyệt |
| Người xem (Viewer) | Read | Không được tạo mới |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt (soft-delete via @SQLRestriction("deleted_at IS NULL"))
- CoastalStationHaiphong (coastal_station_haiphong) — portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | Create | @Column(unique=true), @NotBlank, @Size(max=50) — BaseStation |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | Create | @NotBlank, @Size(max=200) — BaseStation |
| BR-015 | Trạng thái khởi tạo mặc định là PENDING_APPROVAL và approvalStatus là PENDING | Create | setDefaultStatus() trong CoastalStationHaiphong.@PrePersist |
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deletedAt) | Create | @SQLRestriction("deleted_at IS NULL"), softDelete() — BaseStation |

## Testing Strategy

(populated by qa stage)
