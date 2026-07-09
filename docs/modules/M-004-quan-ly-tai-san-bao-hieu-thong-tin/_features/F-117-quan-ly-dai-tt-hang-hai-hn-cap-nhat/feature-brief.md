---
id: F-117
name: "Quản lý Đài TT Hàng hải HN - Cập nhật"
slug: quan-ly-dai-tt-hang-hai-hn-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-07T03:33:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Cập nhật

## Description

Tính năng cho phép cập nhật thông tin Đài TT Hàng hải Hải Phòng đã tồn tại. Có thể chỉnh sửa: tên cảng, quận, phường, giấy phép, hạn giấy phép, thanh tra viên, số điện thoại thanh tra, ngày kiểm tra, vùng phủ sóng, loại thiết bị, tần số, địa chỉ, người liên hệ, tọa độ. Mã code là bất biến. Validation và ghi lịch sử được thực hiện đầy đủ.

## Business Intent

Duy trì tính chính xác của dữ liệu Đài TT Hàng hải Hải Phòng. Khi thông tin pháp lý (giấy phép, thanh tra), thông số kỹ thuật (thiết bị, tần số) hoặc nhân sự thay đổi, operator cần cập nhật kịp thời để phục vụ quản lý cảng biển và an toàn hàng hải.

## Flow Summary

Operator → Chi tiết Đài Hải Phòng → "Chỉnh sửa" → Form điền sẵn → Sửa đổi (trừ code) → "Lưu" → Validation → Cập nhật, ghi lịch sử → HTTP 200.

## Acceptance Criteria

- **AC-01**: Cập nhật hợp lệ thành công, HTTP 200, ghi lịch sử.
- **AC-02**: Thay đổi code bị từ chối.
- **AC-03**: Dữ liệu không hợp lệ trả về HTTP 400.

## In Scope

- Cập nhật thông tin pháp lý, kỹ thuật, hành chính
- Validation, ghi lịch sử

## Out of Scope

- Thay đổi code
- Phê duyệt lại

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Cập nhật |
| operator | CRUD | Cập nhật |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationHaiphong**: Các trường có thể cập nhật: name, portName, district, ward, operationalLicense, licenseExpiry, inspectorName, inspectorPhone, lastInspectionDate, nextInspectionDate, coverageArea, equipmentType, communicationFrequency, locationAddress, contactPerson, contactPhone, latitude, longitude, description.
- **CoastalStationHaiphongUpdateRequest**: DTO cập nhật.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-008 | Code immutable | CoastalStationHaiphong.code | Update request |

## Testing Strategy

(populated by qa stage)
