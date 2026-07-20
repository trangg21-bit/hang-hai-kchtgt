---
id: F-098
name: "Quản lý Đài Inmarsat - Tạo mới"
slug: quan-ly-dai-inmarsat-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài Inmarsat - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài Inmarsat (trạm thông tin vệ tinh) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập đầy đủ thông tin nghiệp vụ của đài bao gồm: mã thiết bị (deviceCode), loại modem (modemType), tần số hoạt động (frequency), vùng phủ sóng (coverageZone), mã SAR (sarCode), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại liên hệ (contactPhone), tọa độ (latitude/longitude) và các thông tin chung khác (description, unitId). Dữ liệu được kiểm tra tính hợp lệ trước khi lưu — mã code phải duy nhất. Kết quả trả về đối tượng CoastalStationInmarsat đã được tạo với trạng thái mặc định DRAFT.

## Business Intent

Số hóa quy trình đăng ký và quản lý các Đài Inmarsat (thông tin vệ tinh) phục vụ công tác quản lý nhà nước về hàng hải. Đảm bảo mỗi đài vệ tinh Inmarsat được khởi tạo với đầy đủ thông số kỹ thuật (thiết bị, modem, tần số, vùng phủ sóng) và hành chính, tạo cơ sở dữ liệu tập trung cho việc theo dõi vùng phủ sóng và hỗ trợ tìm kiếm cứu nạn (SAR).

## Flow Summary

Người dùng operator truy cập màn hình quản lý Đài Inmarsat → Chọn "Thêm mới" → Hệ thống hiển thị form nhập liệu với các trường: deviceCode, modemType, frequency, coverageZone, sarCode, locationAddress, contactPerson, contactPhone, latitude, longitude, description, unitId → Người dùng điền dữ liệu và nhấn "Lưu" → Hệ thống kiểm tra validation phía server (code không trùng, các trường bắt buộc, tọa độ hợp lệ) → Nếu hợp lệ, tạo bản ghi CoastalStationInmarsat mới trạng thái DRAFT, trả về HTTP 200 → Nếu không hợp lệ, trả về HTTP 400 kèm thông báo lỗi.

## Acceptance Criteria

- **AC-01**: Khi nhập đầy đủ thông tin hợp lệ, hệ thống tạo thành công Đài Inmarsat mới trạng thái DRAFT, trả về HTTP 200 kèm đối tượng vừa tạo.
- **AC-02**: Khi nhập mã code đã tồn tại, hệ thống từ chối tạo mới (HTTP 400) với thông báo mã đã được sử dụng.
- **AC-03**: Khi bỏ trống trường bắt buộc, hệ thống hiển thị lỗi validation và không tạo bản ghi.
- **AC-04**: Khi nhập tọa độ ngoài phạm vi cho phép, hệ thống trả về lỗi validation.

## In Scope

- Tạo mới Đài Inmarsat với đầy đủ thông số kỹ thuật và hành chính
- Kiểm tra tính duy nhất của deviceCode/code
- Validation dữ liệu đầu vào
- Ghi nhận lịch sử tạo mới

## Out of Scope

- Quy trình phê duyệt (thuộc F-101)
- Tích hợp với hệ thống vệ tinh thực tế
- Tạo hàng loạt

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền |
| operator | CRUD | Có thể tạo mới |
| approver_L1 | Read | Không có quyền tạo |
| approver_L2 | Read | Không có quyền tạo |
| viewer | Read | Không có quyền tạo |

## Entities

- **CoastalStationInmarsat**: Đại diện Đài Inmarsat với các trường: deviceCode, modemType, frequency, coverageZone, sarCode, kế thừa từ BaseStation (code, name, latitude, longitude, description, unitId, isActive, status, approvalStatus).
- **CoastalStationInmarsatRequest**: DTO tạo mới, được kiểm tra @Valid.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã (code) phải duy nhất, không để trống, tối đa 50 ký tự | CoastalStationInmarsat.code | @Column(unique=true), @NotBlank, @Size(max=50) |
| BR-003 | Vĩ độ trong [-90, 90] | CoastalStationInmarsat.latitude | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ trong [-180, 180] | CoastalStationInmarsat.longitude | @DecimalMin, @DecimalMax |
| BR-009 | Soft-delete (đặt deleted_at) | CoastalStationInmarsat | @SQLRestriction |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | CoastalStationInmarsat.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
