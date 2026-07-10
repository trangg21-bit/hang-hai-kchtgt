---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-218
name: Thong ke van chuyen noi dia
slug: thong-ke-van-chuyen-noiDia
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Thong ke van chuyen noi dia

## Description

Chia sẻ thống kê vận chuyển nội địa (Domestic cargo summary) qua trục liên thông

## Business Intent

Cung cấp thông tin thống kê vận chuyển nội địa cho các bên liên quan

## Flow Summary

PortCargoShareController.getBerthWharfSummary() → GET /ports/berth-wharf-summary → trả về thống kê bến cầu nội địa

## Acceptance Criteria

- Endpoint GET /ports/berth-wharf-summary trả về thống kê bến cầu
- Dữ liệu phân trang (Page<T>)
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thống kê vận chuyển nội địa qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity CargoAggregate với thống kê nội địa

## Out of Scope

- Tạo/sửa/xóa thống kê (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/ports/berth-wharf-summary | Thống kê bến cầu nội địa | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: CargoAggregate
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Pagination: Page<T> default 20 items/page

## Entities

- **CargoAggregate**: id, domesticCargoType, totalQuantity, period, createdAt
