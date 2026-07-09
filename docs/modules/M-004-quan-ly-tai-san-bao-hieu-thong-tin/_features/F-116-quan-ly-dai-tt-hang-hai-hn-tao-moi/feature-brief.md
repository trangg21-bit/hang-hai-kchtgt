---
id: F-116
name: "Quản lý Đài TT Hàng hải HN - Tạo mới"
slug: quan-ly-dai-tt-hang-hai-hn-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-07T03:33:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Tạo mới

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) tạo mới một Đài Thông tin Hàng hải Hải Phòng (CoastalStationHaiphong) trong hệ thống quản lý tài sản báo hiệu và thông tin hàng hải. Người dùng nhập thông tin bao gồm: tên cảng (portName), quận/huyện (district), phường/xã (ward), giấy phép hoạt động (operationalLicense), hạn giấy phép (licenseExpiry), tên thanh tra viên (inspectorName), số điện thoại thanh tra (inspectorPhone), ngày kiểm tra gần nhất (lastInspectionDate), ngày kiểm tra tiếp theo (nextInspectionDate), vùng phủ sóng (coverageArea), loại thiết bị (equipmentType), tần số liên lạc (communicationFrequency), địa chỉ trạm (locationAddress), người liên hệ (contactPerson), số điện thoại (contactPhone) và các thông tin chung. Mã code phải duy nhất. Kết quả trả về CoastalStationHaiphong trạng thái DRAFT.

## Business Intent

Số hóa quy trình đăng ký và quản lý các Đài Thông tin Hàng hải Hải Phòng — trung tâm thông tin hàng hải khu vực cảng biển lớn nhất miền Bắc. Đảm bảo mỗi đài được khởi tạo với đầy đủ thông tin pháp lý (giấy phép, thanh tra), kỹ thuật (thiết bị, tần số) và hành chính (cảng, quận, phường), tạo cơ sở dữ liệu tập trung phục vụ quản lý nhà nước về hàng hải tại Hải Phòng.

## Flow Summary

Người dùng operator truy cập màn hình quản lý Đài TT Hàng hải Hải Phòng → Chọn "Thêm mới" → Form nhập liệu với các trường: code, name, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone, latitude, longitude, description → Nhấn "Lưu" → Kiểm tra validation (code unique, các trường bắt buộc) → Nếu hợp lệ, tạo bản ghi mới DRAFT, HTTP 200 → Nếu lỗi, HTTP 400.

## Acceptance Criteria

- **AC-01**: Nhập đầy đủ thông tin hợp lệ, tạo thành công Đài Hải Phòng (DRAFT), HTTP 200.
- **AC-02**: Nhập code đã tồn tại, hệ thống từ chối (HTTP 400).
- **AC-03**: Bỏ trống trường bắt buộc, hiển thị lỗi validation.
- **AC-04**: Nhập ngày không hợp lệ hoặc tọa độ ngoài phạm vi, trả về lỗi.

## In Scope

- Tạo mới Đài TT Hàng hải Hải Phòng
- Kiểm tra unique code
- Validation dữ liệu
- Ghi lịch sử tạo mới

## Out of Scope

- Phê duyệt (thuộc F-119)
- Tích hợp với hệ thống cảng biển thực tế

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền |
| operator | CRUD | Tạo mới |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationHaiphong**: portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, kế thừa BaseStation.
- **CoastalStationHaiphongRequest**: DTO tạo mới.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã (code) phải duy nhất, không để trống | CoastalStationHaiphong.code | @Column(unique=true) |
| BR-007 | Description ≤ 1000 ký tự | CoastalStationHaiphong.description | @Size(max=1000) |
| BR-009 | Chỉ soft-delete | CoastalStationHaiphong | @SQLRestriction |
| BR-015 | Trạng thái khởi tạo DRAFT | CoastalStationHaiphong.status | @Builder.Default |

## Testing Strategy

(populated by qa stage)
