---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-224
name: Kich co hang hoa
slug: kich-co-hang-hoa
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Kich co hang hoa

## Description

Chia sẻ thống kê kích cỡ hàng hóa (Cargo size aggregate) qua trục liên thông

## Business Intent

Cung cấp thông tin kích cỡ hàng hóa cho các bên liên quan

## Flow Summary

PortCargoShareController.breakwaters-summary endpoint chia sẻ dữ liệu kích cỡ hàng hóa

## Acceptance Criteria

- API share trả về thống kê kích cỡ hàng hóa
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê kích cỡ hàng hóa qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/breakwaters/summary | Kích cỡ hàng hóa | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, sizeRange, totalQuantity, period, createdAt
