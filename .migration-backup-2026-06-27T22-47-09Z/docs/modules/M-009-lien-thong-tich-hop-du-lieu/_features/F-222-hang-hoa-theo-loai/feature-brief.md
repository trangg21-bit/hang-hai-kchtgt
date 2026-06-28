---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-222
name: Hang hoa theo loai
slug: hang-hoa-theo-loai
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Hang hoa theo loai

## Description

Chia sẻ thống kê hàng hóa theo loại (Cargo by type) qua trục liên thông

## Business Intent

Cung cấp thông tin hàng hóa theo từng loại cho các bên liên quan

## Flow Summary

PortCargoShareController buoy-signal-summary endpoint chia sẻ dữ liệu hàng hóa theo loại

## Acceptance Criteria

- API share trả về thống kê hàng hóa theo loại
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê hàng hóa loại qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/buoy-signal-summary | Hàng hóa theo loại | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, cargoType, totalQuantity, period, createdAt
