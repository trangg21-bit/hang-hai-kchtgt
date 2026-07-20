---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-215
name: Port operational status
slug: tinh-trang-khanh-tac-cang
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Port operational status

## Description

Chia sẻ trạng thái vận hành cảng (Port operational status) qua trục liên thông

## Business Intent

Cung cấp thông tin trạng thái vận hành cảng cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

PortCargoShareController.getPortsStatus() → GET /ports/status → trả về danh sách trạng thái vận hành cảng với phân trang

## Acceptance Criteria

- Endpoint GET /ports/status trả về danh sách trạng thái cảng
- Dữ liệu phân trang (Page<T>)
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ trạng thái vận hành cảng qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity PortStatus với trạng thái cảng (đang hoạt động, tạm dừng, bảo trì)

## Out of Scope

- Tạo/sửa/xóa trạng thái (chỉ đọc)
- Tích hợp ngược (inbound sync) — F-247 đảm nhận

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/ports/status | Trạng thái vận hành cảng | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: PortStatus (Spring Data JPA, Page<T> pagination)
- Wave 3: Port & Cargo Aggregation sharing endpoints
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)
- Pagination: Page<T> default 20 items/page, max 100

## Entities

- **PortStatus**: id, portId, portName, operationalStatus, berthCount, availableBerths, lastUpdated, createdAt
