---
id: F-110
name: "Quản lý Đài LRIT - Tạo mới"
slug: quan-ly-dai-lrit-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-08T00:00:00Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ tạo mới một đài thông tin LRIT (Long Range Identification and Tracking) phục vụ giám sát, định vị tàu biển. Người dùng nhập các trường dữ liệu đặc thù bao gồm: terminalId (mã thiết bị đầu cuối), imoNumber (số IMO của tàu), reportingInterval (khoảng thời gian báo cáo tính bằng phút), antennaHeight (chiều cao ăng-ten mét), powerOutput (công suất phát watts), antennaType (loại ăng-ten), dataFormat (định dạng dữ liệu), communicationChannel (kênh truyền thông), coverageArea (khu vực phủ sóng), locationAddress (địa chỉ lắp đặt), contactPerson (người liên hệ), contactPhone (số điện thoại liên hệ). Hệ thống tự động thiết lập trạng thái PENDING_APPROVAL và trạng thái phê duyệt PENDING khi tạo mới, ghi nhận lịch sử thay đổi CREATE ngay sau khi lưu thành công vào cơ sở dữ liệu bảng coastal_station_lrit.

## Business Intent

Quản lý thống kê các đài thông tin LRIT trên toàn tuyến bờ, phục vụ công tác giám sát và định vị tàu biển theo yêu cầu của SOLAS Chapter V Regulation 19-1, đảm bảo dữ liệu được lưu trữ có kiểm duyệt hai cấp trước khi công bố hoạt động.

## Flow Summary

1. Người dùng truy cập giao diện quản lý đài LRIT, chọn Tạo mới và nhập đầy đủ các trường dữ liệu bắt buộc vào form đăng ký đài thông tin. 2. Hệ thống kiểm tra tính hợp lệ của dữ liệu đầu vào theo các ràng buộc nghiệp vụ (mã đài duy nhất, tên không rỗng). 3. Nếu hợp lệ, hệ thống tạo bản ghi vào bảng coastal_station_lrit với trạng thái PENDING_APPROVAL, trạng thái phê duyệt PENDING và tự động ghi nhận lịch sử hành động CREATE. 4. Nếu dữ liệu không hợp lệ, hệ thống hiển thị thông báo lỗi chi tiết kèm tên trường vi phạm để người dùng chỉnh sửa.

## Acceptance Criteria

- Hệ thống hiển thị form tạo mới đài LRIT với đầy đủ 13 trường dữ liệu đặc thù (terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, locationAddress, contactPerson, contactPhone, cùng các trường thừa kế từ BaseStation: code, name, latitude, longitude, description, unitId)
- Khi tạo mới thành công, trạng thái tự động thiết lập là PENDING_APPROVAL và trạng thái phê duyệt là PENDING, dữ liệu được lưu vào bảng coastal_station_lrit
- Hệ thống ghi nhận lịch sử hành động CREATE ngay sau khi lưu thành công, với thông tin thay đổi, người thực hiện và thời gian
- Khi nhập mã đài (code) đã tồn tại, hệ thống từ chối và hiển thị thông báo lỗi mã trùng lặp

## In Scope

(Tạo bản ghi mới vào bảng coastal_station_lrit, thiết lập trạng thái mặc định, ghi nhận audit history)

## Out of Scope

(Sửa đổi sau tạo, phê duyệt (F-113), xem chi tiết (F-114), xóa (F-112))

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| Quản trị viên (Admin) | Full | Toàn quyền tạo mới |
| Chuyên viên nghiệp vụ (Operator) | Write | Được tạo mới, gửi phê duyệt |
| Người xem (Viewer) | Read | Không được tạo mới |

## Entities

- BaseStation (cơ sở, abstract) — id (UUID), code, name, latitude, longitude, description, unitId, isActive, status (StationStatus), approvalStatus (StationApprovalStatus), approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt, deletedAt (soft-delete via @SQLRestriction("deleted_at IS NULL"))
- CoastalStationLRIT (coastal_station_lrit) — terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, locationAddress, contactPerson, contactPhone, dataFormat, communicationChannel, coverageArea

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | Create | @Column(unique=true), @NotBlank, @Size(max=50) — BaseStation |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | Create | @NotBlank, @Size(max=200) — BaseStation |
| BR-015 | Trạng thái khởi tạo mặc định là PENDING_APPROVAL và approvalStatus là PENDING | Create | setDefaultStatus() trong CoastalStationLRIT.@PrePersist |
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deletedAt) | Create | @SQLRestriction("deleted_at IS NULL"), softDelete() — BaseStation |

## Testing Strategy

(populated by qa stage)
