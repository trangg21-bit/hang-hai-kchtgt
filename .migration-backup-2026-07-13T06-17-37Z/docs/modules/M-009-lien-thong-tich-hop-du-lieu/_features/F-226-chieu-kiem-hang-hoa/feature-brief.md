---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-226
name: Kiem ke hang hoa
slug: chieu-kiem-hang-hoa
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Kiem ke hang hoa

## Description

Chia sẻ kiểm kê hàng hóa (Cargo inventory check) qua trục liên thông

## Business Intent

Cung cấp thông tin kiểm kê hàng hóa cho các bên liên quan

## Flow Summary

PortCargoShareController share endpoints cho kiểm kê hàng hóa

## Acceptance Criteria

- API share trả về thông tin kiểm kê hàng hóa
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ kiểm kê hàng hóa qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity CargoAggregate với dữ liệu kiểm kê

## Out of Scope

- Tạo/sửa/xóa kiểm kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/cargo/inventory | Kiểm kê hàng hóa | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: CargoAggregate
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, cargoType, expectedQuantity, actualQuantity, variance, period, createdAt
