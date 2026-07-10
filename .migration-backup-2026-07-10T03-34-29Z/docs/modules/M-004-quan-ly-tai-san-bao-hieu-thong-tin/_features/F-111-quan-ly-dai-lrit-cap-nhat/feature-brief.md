---
id: F-111
name: "Quản lý Đài LRIT - Cập nhật"
slug: quan-ly-dai-lrit-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-07T03:33:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Cập nhật

## Description

Tính năng cho phép cập nhật thông tin Đài LRIT đã tồn tại. Có thể chỉnh sửa: số IMO, khoảng báo cáo, chiều cao anten, công suất phát, loại anten, định dạng dữ liệu, kênh liên lạc, vùng phủ sóng, địa chỉ, người liên hệ, tọa độ. terminalId và code là trường bất biến. Validation và ghi lịch sử thay đổi được thực hiện đầy đủ.

## Business Intent

Duy trì tính chính xác của dữ liệu Đài LRIT — hệ thống quan trọng cho giám sát tàu thuyền tầm xa theo SOLAS. Khi thông số kỹ thuật thay đổi, operator cần cập nhật để đảm bảo hệ thống nhận dạng và theo dõi tàu luôn chính xác.

## Flow Summary

Operator → Chi tiết Đài LRIT → "Chỉnh sửa" → Form điền sẵn dữ liệu → Sửa đổi (trừ code/terminalId) → "Lưu" → Validation → Cập nhật và ghi lịch sử → HTTP 200.

## Acceptance Criteria

- **AC-01**: Cập nhật hợp lệ thành công, HTTP 200, ghi lịch sử.
- **AC-02**: Thay đổi code/terminalId bị từ chối.
- **AC-03**: Dữ liệu không hợp lệ trả về HTTP 400.

## In Scope

- Cập nhật thông số kỹ thuật LRIT
- Validation, ghi lịch sử

## Out of Scope

- Thay đổi terminalId/code
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

- **CoastalStationLRIT**: Các trường có thể cập nhật: name, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, locationAddress, contactPerson, contactPhone, latitude, longitude, description.
- **CoastalStationLRITUpdateRequest**: DTO cập nhật.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-008 | Code immutable, terminalId immutable | CoastalStationLRIT | Design constraint |

## Testing Strategy

(populated by qa stage)
