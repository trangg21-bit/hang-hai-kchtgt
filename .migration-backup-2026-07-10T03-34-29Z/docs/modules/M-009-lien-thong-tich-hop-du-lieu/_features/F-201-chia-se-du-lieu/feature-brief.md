---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-201
name: Chia se du lieu - Port
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
# Feature: Chia se du lieu - Port

## Description

Chia sẻ dữ liệu Cảng (Port) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin cảng cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getPorts() → GET /points/ports → trả về danh sách cảng có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/ports trả về danh sách cảng
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ cảng qua API share endpoint (Wave 0 / generic)
- Token validation với IntegrationTokenAdvice

## Out of Scope

- Tạo/sửa/xóa cảng (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/ports | Danh sách cảng | Token |

## Architecture Notes

- Controller: IntegrationShareController
- Pattern: Wave 0 generic share endpoint
- Response format: GeoJSON Point
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Port**: id, name, code, location(GeoJSON), type, capacity, status, createdAt, updatedAt
