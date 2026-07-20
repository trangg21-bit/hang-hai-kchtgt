---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-221
name: Hang hoa theo khong vung
slug: hang-hoa-theo-khong-vung
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Hang hoa theo khong vung

## Description

Chia sẻ thống kê hàng hóa theo không gian (Cargo by region/space) qua trục liên thông

## Business Intent

Cung cấp thông tin hàng hóa theo từng vùng không gian cho các bên liên quan

## Flow Summary

PortCargoShareController transport-anchorage-summary endpoint chia sẻ dữ liệu hàng hóa theo không gian

## Acceptance Criteria

- API share trả về thống kê hàng hóa theo không gian
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê hàng hóa không gian qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/transport-anchorage-summary | Hàng hóa theo không gian | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, region, cargoType, totalQuantity, period, createdAt
