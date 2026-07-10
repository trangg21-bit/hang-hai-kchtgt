---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-203
name: Chia se du lieu - Bridge
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
# Feature: Chia se du lieu - Bridge

## Description

Chia sẻ dữ liệu Cầu (Bridge) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin cầu cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController share endpoints bao gồm cầu

## Acceptance Criteria

- API share trả về danh sách cầu
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ cầu qua API share endpoint (Wave 0 / generic)
- Token validation với IntegrationTokenAdvice
- DTO BridgeDto

## Out of Scope

- Tạo/sửa/xóa cầu (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/bridges | Danh sách cầu | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: BridgeDto
- Pattern: Wave 0 generic share endpoint
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Bridge**: id, name, code, location(GeoJSON), span, clearanceHeight, status, createdAt, updatedAt
