---
id: F-120
name: "Xem chi tiết Đài TT Hàng hải HN"
slug: xem-chi-tiet-dai-tt-hang-hai-hn
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-07T03:33:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài TT Hàng hải HN

## Description

Tính năng xem chi tiết Đài TT Hàng hải Hải Phòng theo ID. Hiển thị: tên cảng, quận, phường, giấy phép, hạn giấy phép, thanh tra viên, ngày kiểm tra, vùng phủ sóng, thiết bị, tần số, địa chỉ, người liên hệ, tọa độ, trạng thái. API GET /api/v1/stations/haiphong/{id} trả về CoastalStationHaiphongResponse. HTTP 404 nếu không tìm thấy.

## Business Intent

Cung cấp giao diện tra cứu thông tin Đài TT Hàng hải Hải Phòng phục vụ quản lý cảng biển và an toàn hàng hải. Thông tin giấy phép, thanh tra và thiết bị rất quan trọng cho công tác kiểm định và cấp phép.

## Flow Summary

Người dùng chọn Đài Hải Phòng từ danh sách → GET /.../{id} → Service build response → HTTP 200/404.

## Acceptance Criteria

- **AC-01**: ID hợp lệ trả về HTTP 200 với đầy đủ thông tin.
- **AC-02**: ID không tồn tại trả về HTTP 404.
- **AC-03**: Tất cả vai trò xem được.

## In Scope

- Xem chi tiết theo ID
- Build response DTO

## Out of Scope

- Lịch sử (thuộc F-121)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem |
| operator | Read | Xem |
| approver_L1 | Read | Xem để duyệt |
| approver_L2 | Read | Xem để duyệt |
| viewer | Read | Xem |

## Entities

- **CoastalStationHaiphong**: Đối tượng dữ liệu.
- **CoastalStationHaiphongResponse**: DTO phản hồi.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Soft-delete không hiển thị | CoastalStationHaiphong | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
