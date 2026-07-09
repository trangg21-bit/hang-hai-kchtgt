---
id: F-099
name: "Quản lý Đài Inmarsat - Cập nhật"
slug: quan-ly-dai-inmarsat-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài Inmarsat - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) cập nhật thông tin của một Đài Inmarsat đã tồn tại. Người dùng có thể chỉnh sửa các trường: loại modem (modemType), tần số hoạt động (frequency), vùng phủ sóng (coverageZone), mã SAR (sarCode), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại (contactPhone), tọa độ (latitude/longitude) và các thông tin chung. Mã code và mã thiết bị (deviceCode) là trường bất biến không thể thay đổi sau khi tạo. Dữ liệu được kiểm tra validation trước khi cập nhật và lịch sử thay đổi được ghi nhận đầy đủ.

## Business Intent

Duy trì tính chính xác của dữ liệu Đài Inmarsat trong hệ thống. Khi các thông số kỹ thuật (modem, tần số, vùng phủ sóng) hoặc nhân sự liên hệ thay đổi, operator cần cập nhật kịp thời để đảm bảo hệ thống thông tin vệ tinh phục vụ tìm kiếm cứu nạn và quản lý hàng hải luôn chính xác.

## Flow Summary

Người dùng operator truy cập chi tiết Đài Inmarsat → Chọn "Chỉnh sửa" → Form hiển thị dữ liệu hiện tại → Sửa đổi các trường (trừ code/deviceCode) và nhấn "Lưu" → Hệ thống kiểm tra validation → Nếu hợp lệ, cập nhật bản ghi, ghi lịch sử (UPDATE action) → Trả về HTTP 200 kèm đối tượng cập nhật → Nếu lỗi, trả về HTTP 400.

## Acceptance Criteria

- **AC-01**: Cập nhật thông tin hợp lệ thành công, trả về HTTP 200 kèm dữ liệu mới.
- **AC-02**: Cố gắng thay đổi code/deviceCode bị từ chối (immutable field).
- **AC-03**: Cập nhật tọa độ ngoài phạm vi trả về lỗi validation.
- **AC-04**: Lịch sử thay đổi ghi nhận chính xác trường thay đổi, giá trị cũ, giá trị mới.

## In Scope

- Cập nhật thông số kỹ thuật và hành chính Đài Inmarsat
- Validation dữ liệu đầu vào
- Ghi nhận lịch sử thay đổi

## Out of Scope

- Thay đổi code/deviceCode (immutable)
- Phê duyệt lại sau cập nhật

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền |
| operator | CRUD | Có thể cập nhật |
| approver_L1 | Read | Không có quyền |
| approver_L2 | Read | Không có quyền |
| viewer | Read | Không có quyền |

## Entities

- **CoastalStationInmarsat**: Các trường có thể cập nhật: name, modemType, frequency, coverageZone, sarCode, locationAddress, contactPerson, contactPhone, latitude, longitude, description, unitId, isActive.
- **CoastalStationInmarsatUpdateRequest**: DTO cập nhật, @Valid.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-008 | Mã code/deviceCode không thể thay đổi sau khi tạo | CoastalStationInmarsat | Immutable field |
| BR-003 | Vĩ độ trong [-90, 90] | CoastalStationInmarsat.latitude | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ trong [-180, 180] | CoastalStationInmarsat.longitude | @DecimalMin, @DecimalMax |

## Testing Strategy

(populated by qa stage)
