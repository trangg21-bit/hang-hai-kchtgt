---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-206
name: Chia se du lieu - Maintenance info
slug: chia-se-du-lieu
module-id: M-009
status: implemented
classification: share
priority: medium
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se du lieu - Maintenance info

## Description

Chia sẻ thông tin bảo trì (Maintenance info) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin bảo trì công trình cho các bên liên quan

## Flow Summary

PortCargoShareController.getMaintenanceInfo() → GET /info/maintenance → trả về thông tin bảo trì

## Acceptance Criteria

- API share trả về thông tin bảo trì
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thông tin bảo trì qua API share endpoint
- Token validation với IntegrationTokenAdvice
- DTO MaintenanceInfoDto

## Out of Scope

- Tạo/sửa/xóa thông tin bảo trì (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/info/maintenance | Thông tin bảo trì | Token |

## Architecture Notes

- Controller: PortCargoShareController
- DTO: MaintenanceInfoDto
- Pattern: Share endpoint (readonly, filter by token)
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **MaintenanceInfo**: id, assetId, maintenanceDate, description, status, nextScheduledDate, createdAt
