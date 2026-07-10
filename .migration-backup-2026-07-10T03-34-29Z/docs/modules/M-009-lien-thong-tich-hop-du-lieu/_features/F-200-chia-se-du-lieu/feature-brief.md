---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-200
name: Chia se du lieu - Waterway
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
# Feature: Chia se du lieu - Waterway

## Description

Chia sẻ dữ liệu Đường thủy (Waterway) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin đường thủy cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getWaterways() → GET /lines/waterways → trả về danh sách đường thủy có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /lines/waterways trả về danh sách đường thủy
- Dữ liệu có dạng GeoJSON LineString
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ đường thủy qua API share endpoint (Wave 0 / generic)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa đường thủy (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/lines/waterways | Danh sách đường thủy | Token |

## Architecture Notes

- Controller: IntegrationShareController
- Pattern: Wave 0 generic share endpoint
- Response format: GeoJSON LineString
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Waterway**: id, name, code, line(GeoJSON), width, depth, status, createdAt, updatedAt
