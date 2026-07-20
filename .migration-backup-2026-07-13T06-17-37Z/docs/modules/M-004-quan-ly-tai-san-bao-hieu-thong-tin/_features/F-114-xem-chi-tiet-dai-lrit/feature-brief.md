---
id: F-114
name: "Xem chi tiết Đài LRIT"
slug: xem-chi-tiet-dai-lrit
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-07T03:33:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài LRIT

## Description

Tính năng xem chi tiết Đài LRIT theo ID. Hiển thị: terminalId, imoNumber, reportingInterval, antennaHeight, powerOutput, antennaType, dataFormat, communicationChannel, coverageArea, địa chỉ, người liên hệ, tọa độ, trạng thái, phê duyệt. API GET /api/v1/stations/lrit/{id} trả về CoastalStationLRITResponse. HTTP 404 nếu không tìm thấy.

## Business Intent

Cung cấp giao diện tra cứu thông tin Đài LRIT phục vụ quản lý giám sát tàu tầm xa. Thông tin terminalId, IMO và anten rất quan trọng cho công tác nhận dạng và theo dõi tàu thuyền quốc tế.

## Flow Summary

Người dùng chọn Đài LRIT từ danh sách → GET /.../{id} → Service build response → HTTP 200/404.

## Acceptance Criteria

- **AC-01**: ID hợp lệ trả về HTTP 200 với đầy đủ thông tin.
- **AC-02**: ID không tồn tại trả về HTTP 404.
- **AC-03**: Tất cả vai trò xem được.

## In Scope

- Xem chi tiết theo ID
- Build response DTO

## Out of Scope

- Lịch sử (thuộc F-115)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem |
| operator | Read | Xem |
| approver_L1 | Read | Xem để duyệt |
| approver_L2 | Read | Xem để duyệt |
| viewer | Read | Xem |

## Entities

- **CoastalStationLRIT**: Đối tượng dữ liệu.
- **CoastalStationLRITResponse**: DTO phản hồi.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Soft-delete không hiển thị | CoastalStationLRIT | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
