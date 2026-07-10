---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-225
name: Hang hoa theo don vi kich co
slug: hang-hoa-theo-don-vi-kich-co
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Hang hoa theo don vi kich co

## Description

Chia sẻ thống kê hàng hóa theo đơn vị và kích cỡ (Cargo by unit+size) qua trục liên thông

## Business Intent

Cung cấp thông tin hàng hóa theo cả đơn vị đo và kích cỡ cho các bên liên quan

## Flow Summary

PortCargoShareController.break-seas-summary endpoint chia sẻ dữ liệu hàng hóa theo đơn vị+kích cỡ

## Acceptance Criteria

- API share trả về thống kê hàng hóa theo đơn vị và kích cỡ
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê hàng hóa đơn vị+kích cỡ qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/break-seas/summary | Hàng hóa theo đơn vị+kích cỡ | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, unit, sizeRange, totalQuantity, period, createdAt
