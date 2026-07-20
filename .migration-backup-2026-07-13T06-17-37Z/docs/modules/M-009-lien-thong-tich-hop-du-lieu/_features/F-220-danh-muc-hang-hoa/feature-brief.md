---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-220
name: Danh muc hang hoa
slug: danh-muc-hang-hoa
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Danh muc hang hoa

## Description

Chia sẻ danh mục hàng hóa (Cargo type aggregate) qua trục liên thông

## Business Intent

Cung cấp thông tin danh mục hàng hóa cho các bên liên quan

## Flow Summary

PortCargoShareController.getCargoSummary() → GET /cargo/summary → trả về danh mục hàng hóa theo loại

## Acceptance Criteria

- API share trả về danh mục hàng hóa
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ danh mục hàng hóa qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity CargoAggregate với loại hàng hóa

## Out of Scope

- Tạo/sửa/xóa danh mục (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/cargo/types | Danh mục hàng hóa | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: CargoAggregate
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, cargoType, totalQuantity, period, createdAt
