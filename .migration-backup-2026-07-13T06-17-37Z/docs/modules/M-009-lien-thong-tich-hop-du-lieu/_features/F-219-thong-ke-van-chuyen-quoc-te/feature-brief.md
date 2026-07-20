---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-219
name: Thong ke van chuyen quoc te
slug: thong-ke-van-chuyen-quoc-te
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Thong ke van chuyen quoc te

## Description

Chia sẻ thống kê vận chuyển quốc tế (International cargo summary) qua trục liên thông

## Business Intent

Cung cấp thông tin thống kê vận chuyển quốc tế cho các bên liên quan

## Flow Summary

PortCargoShareController.getCargoSummary() → GET /cargo/summary → trả về thống kê hàng hóa tổng hợp (bao gồm quốc tế)

## Acceptance Criteria

- Endpoint GET /cargo/summary trả về thống kê hàng hóa
- Dữ liệu phân trang (Page<T>)
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê vận chuyển quốc tế qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity CargoAggregate với thống kê quốc tế

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/cargo/summary | Thống kê hàng hóa (quốc tế + nội địa) | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: CargoAggregate
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, cargoType, totalQuantity, period, international(BOOLEAN), createdAt
