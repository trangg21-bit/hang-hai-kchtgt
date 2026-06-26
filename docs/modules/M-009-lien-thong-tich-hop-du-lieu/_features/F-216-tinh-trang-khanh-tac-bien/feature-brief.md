---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-216
name: Asset operational status
slug: tinh-trang-khanh-tac-bien
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Asset operational status

## Description

Chia sẻ trạng thái vận hành tài sản biển (Asset operational status) qua trục liên thông

## Business Intent

Cung cấp thông tin trạng thái tài sản biển cho các bên liên quan

## Flow Summary

PortCargoShareController.getAssetStatus() → GET /assets/status → trả về danh sách trạng thái tài sản với phân trang

## Acceptance Criteria

- Endpoint GET /assets/status trả về danh sách trạng thái tài sản
- Dữ liệu phân trang (Page<T>)
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ trạng thái tài sản qua API share endpoint (Wave 3)
- Token validation với IntegrationTokenAdvice
- Entity PortStatus với trạng thái tài sản biển

## Out of Scope

- Tạo/sửa/xóa trạng thái (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/assets/status | Trạng thái tài sản biển | Token |

## Architecture Notes

- Controller: PortCargoShareController
- Entity: PortStatus (shared with F-215)
- Pattern: Share endpoint (readonly, filter by token)
- Pagination: Page<T> default 20 items/page

## Entities

- **PortStatus**: id, assetId, assetType, operationalStatus, lastUpdated, createdAt
