---
id: F-108
name: "Xem chi tiết Đài COSPAS-SARSAT"
slug: xem-chi-tiet-dai-cospas-sarsat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đài COSPAS-SARSAT

## Description

Tính năng cho phép người dùng xem chi tiết thông tin của một Đài COSPAS-SARSAT theo ID. Hiển thị đầy đủ: tần số, vùng phủ sóng, giao thức beacon, kênh khẩn cấp, loại anten, tầm hiệu lực, chế độ vận hành, địa chỉ, người liên hệ, tọa độ, trạng thái. API GET /api/v1/stations/cospas-sarsat/{id} trả về CoastalStationCospasSarsatResponse. HTTP 404 nếu không tìm thấy.

## Business Intent

Cung cấp giao diện tra cứu thông tin Đài COSPAS-SARSAT phục vụ quản lý và điều phối tìm kiếm cứu nạn. Thông tin chi tiết về tần số, giao thức beacon và kênh khẩn cấp đặc biệt quan trọng cho công tác SAR.

## Flow Summary

Người dùng chọn Đài COSPAS-SARSAT từ danh sách → GET /.../{id} → Service tìm kiếm, build response → HTTP 200/404.

## Acceptance Criteria

- **AC-01**: ID hợp lệ trả về HTTP 200 kèm đầy đủ thông tin.
- **AC-02**: ID không tồn tại trả về HTTP 404.
- **AC-03**: Tất cả vai trò đều xem được.

## In Scope

- Xem chi tiết theo ID
- Build response DTO

## Out of Scope

- Lịch sử (thuộc F-109)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem |
| operator | Read | Xem |
| approver_L1 | Read | Xem để duyệt |
| approver_L2 | Read | Xem để duyệt |
| viewer | Read | Xem |

## Entities

- **CoastalStationCospasSarsat**: Đối tượng dữ liệu.
- **CoastalStationCospasSarsatResponse**: DTO phản hồi.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Soft-delete không hiển thị | CoastalStationCospasSarsat | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
