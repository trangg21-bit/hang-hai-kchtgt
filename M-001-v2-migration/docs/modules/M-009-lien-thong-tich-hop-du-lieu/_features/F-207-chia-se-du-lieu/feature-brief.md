---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-207
name: Chia se du lieu - Asset status
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
# Feature: Chia se du lieu - Asset status

## Description

Chia sẻ trạng thái tài sản (Asset status) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin trạng thái tài sản cho các bên liên quan

## Flow Summary

PortCargoShareController.getAssetStatus() → GET /assets/status → trả về danh sách trạng thái tài sản

## Acceptance Criteria

- API share trả về danh sách trạng thái tài sản
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ trạng thái tài sản qua API share endpoint
- Token validation với IntegrationTokenAdvice
- DTO AssetStatusDto

## Out of Scope

- Tạo/sửa/xóa trạng thái tài sản (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/assets/status | Trạng thái tài sản | Token |

## Architecture Notes

- Controller: PortCargoShareController
- DTO: AssetStatusDto
- Pattern: Share endpoint (readonly, filter by token)
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **AssetStatus**: id, assetId, assetType, status, lastUpdated, createdAt
