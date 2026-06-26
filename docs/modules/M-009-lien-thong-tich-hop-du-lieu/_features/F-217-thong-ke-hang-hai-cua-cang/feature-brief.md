---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-217
name: Thong ke hang cua cang
slug: thong-ke-hang-hai-cua-cang
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Thong ke hang cua cang

## Description

Chia sẻ thống kê hàng hóa của cảng (Cargo aggregate) qua trục liên thông

## Business Intent

Cung cấp thông tin thống kê hàng hóa tại cảng cho các bên liên quan

## Flow Summary

PortCargoShareController.getCargoTotal() → GET /ports/cargo-total → trả về tổng quan hàng hóa theo cảng với phân trang

## Acceptance Criteria

- Endpoint GET /ports/cargo-total trả về tổng quan hàng hóa cảng
- Dữ liệu phân trang (Page<T>)
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê hàng hóa cảng qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity CargoAggregate với tổng quan hàng hóa

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync) — F-250 đảm nhận

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/ports/cargo-total | Tổng quan hàng hóa cảng | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: CargoAggregate (Spring Data JPA, Page<T> pagination)
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, portId, portName, cargoType, totalQuantity, period, createdAt
