---
id: F-093
name: "Quản lý Đài TTDH - Cập nhật"
slug: quan-ly-dai-ttdh-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-07T03:32:57Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) cập nhật thông tin của một Đài Thông tin Duyên hải (VTS) đã tồn tại trong hệ thống. Người dùng có thể chỉnh sửa các trường thông tin như tên đài, dải tần số hoạt động (frequencyBand), công suất phát (transmitPower), loại thiết bị (equipmentType), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại (contactPhone), tọa độ (latitude/longitude), mô tả và các thông tin khác. Lưu ý rằng mã đài (code) là trường bất biến không thể thay đổi sau khi tạo. Dữ liệu được kiểm tra tính hợp lệ trước khi cập nhật và lịch sử thay đổi được ghi nhận đầy đủ để phục vụ kiểm tra và truy xuất nguồn gốc.

## Business Intent

Duy trì tính chính xác và cập nhật của dữ liệu Đài TTDH trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Khi các thông số kỹ thuật, nhân sự liên hệ hoặc vị trí địa lý của đài thay đổi, operator cần có khả năng cập nhật kịp thời để đảm bảo cơ sở dữ liệu luôn phản ánh đúng thực trạng hoạt động của các đài ven biển.

## Flow Summary

Người dùng operator truy cập màn hình chi tiết Đài TTDH → Chọn chức năng "Chỉnh sửa" → Hệ thống hiển thị form với dữ liệu hiện tại được điền sẵn → Người dùng sửa đổi các trường (ngoại trừ code) và nhấn "Lưu" → Hệ thống kiểm tra tính hợp lệ của dữ liệu mới → Nếu hợp lệ, hệ thống cập nhật bản ghi, ghi lại lịch sử thay đổi (UPDATE action với changedField, previousValue, newValue) và trả về HTTP 200 kèm đối tượng đã cập nhật → Nếu không hợp lệ, trả về lỗi chi tiết.

## Acceptance Criteria

- **AC-01**: Khi cập nhật thông tin hợp lệ, hệ thống cập nhật thành công bản ghi Đài TTDH, trả về HTTP 200 kèm dữ liệu mới và ghi nhận lịch sử thay đổi.
- **AC-02**: Khi cố gắng thay đổi mã đài (code), hệ thống từ chối và giữ nguyên giá trị code cũ (trường bất biến theo BR-008).
- **AC-03**: Khi nhập tọa độ ngoài phạm vi cho phép, hệ thống trả về lỗi validation và không cập nhật bản ghi.
- **AC-04**: Khi cập nhật thành công, lịch sử thay đổi ghi nhận chính xác trường nào thay đổi, giá trị cũ và giá trị mới.

## In Scope

- Cập nhật các trường thông tin kỹ thuật và hành chính của Đài TTDH
- Kiểm tra validation dữ liệu đầu vào trước khi cập nhật
- Ghi nhận lịch sử thay đổi (who, what field, old value, new value, when)
- Giữ nguyên mã code (trường bất biến)

## Out of Scope

- Thay đổi mã code (code là immutable field)
- Quy trình phê duyệt lại sau khi cập nhật
- Xóa đài (thuộc F-094)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền, có thể cập nhật |
| operator | CRUD | Có thể cập nhật đài TTDH |
| approver_L1 | Read | Không có quyền cập nhật |
| approver_L2 | Read | Không có quyền cập nhật |
| viewer | Read | Không có quyền cập nhật |

## Entities

- **CoastalStationVTS**: Đại diện cho Đài Thông tin Duyên hải VTS. Các trường có thể cập nhật: name, frequencyBand, transmitPower, equipmentType, locationAddress, contactPerson, contactPhone, latitude, longitude, description, unitId, isActive.
- **CoastalStationVTSUpdateRequest**: DTO chứa các trường cho phép cập nhật, được kiểm tra @Valid trước khi xử lý.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-008 | Mã code không thể thay đổi sau khi tạo (immutable) | CoastalStationVTS.code | Update request không bao gồm code |
| BR-003 | Vĩ độ (latitude) phải trong khoảng -90.0 đến 90.0 | CoastalStationVTS.latitude | @DecimalMin("-90.0"), @DecimalMax("90.0") |
| BR-004 | Kinh độ (longitude) phải trong khoảng -180.0 đến 180.0 | CoastalStationVTS.longitude | @DecimalMin("-180.0"), @DecimalMax("180.0") |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | CoastalStationVTS.description | @Size(max=1000) |
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete | CoastalStationVTS | softDelete(), @SQLRestriction |

## Testing Strategy

(populated by qa stage)
