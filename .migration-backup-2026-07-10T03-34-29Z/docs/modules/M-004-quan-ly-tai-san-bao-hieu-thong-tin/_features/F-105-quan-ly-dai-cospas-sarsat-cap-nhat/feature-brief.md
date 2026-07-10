---
id: F-105
name: "Quản lý Đài COSPAS-SARSAT - Cập nhật"
slug: quan-ly-dai-cospas-sarsat-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài COSPAS-SARSAT - Cập nhật

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) cập nhật thông tin của một Đài COSPAS-SARSAT đã tồn tại. Người dùng có thể chỉnh sửa các trường: tần số hoạt động (frequency), vùng phủ sóng (coverageArea), giao thức beacon (beaconProtocol), kênh khẩn cấp (emergencyChannel), loại anten (antennaType), tầm hiệu lực tín hiệu (signalRange), chế độ vận hành (operatingMode), địa chỉ, người liên hệ, số điện thoại, tọa độ. Mã code là trường bất biến. Dữ liệu được kiểm tra validation trước khi cập nhật và lịch sử thay đổi được ghi nhận đầy đủ.

## Business Intent

Duy trì tính chính xác của dữ liệu Đài COSPAS-SARSAT — hệ thống quan trọng phục vụ tìm kiếm cứu nạn hàng hải. Khi các thông số kỹ thuật (tần số, giao thức, vùng phủ sóng) thay đổi, operator cần cập nhật kịp thời để đảm bảo thông tin SAR luôn chính xác và sẵn sàng.

## Flow Summary

Operator → Chi tiết Đài COSPAS-SARSAT → Chọn "Chỉnh sửa" → Form hiển thị dữ liệu hiện tại → Sửa đổi (trừ code) → Nhấn "Lưu" → Kiểm tra validation → Cập nhật, ghi lịch sử → Trả về HTTP 200.

## Acceptance Criteria

- **AC-01**: Cập nhật thông tin hợp lệ thành công, trả về HTTP 200, ghi lịch sử.
- **AC-02**: Thay đổi code bị từ chối (immutable).
- **AC-03**: Cập nhật dữ liệu không hợp lệ trả về HTTP 400.

## In Scope

- Cập nhật thông số kỹ thuật và hành chính
- Validation dữ liệu
- Ghi lịch sử thay đổi

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

- **CoastalStationCospasSarsat**: Các trường có thể cập nhật: name, frequency, coverageArea, beaconProtocol, emergencyChannel, antennaType, signalRange, operatingMode, locationAddress, contactPerson, contactPhone, latitude, longitude, description.
- **CoastalStationCospasSarsatUpdateRequest**: DTO cập nhật.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-008 | Code immutable | CoastalStationCospasSarsat.code | Update request không có code |

## Testing Strategy

(populated by qa stage)
