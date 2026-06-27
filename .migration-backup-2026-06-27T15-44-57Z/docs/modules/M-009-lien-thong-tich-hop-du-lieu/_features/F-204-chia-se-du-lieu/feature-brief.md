---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-204
name: Chia se du lieu - Pier
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
# Feature: Chia se du lieu - Pier

## Description

Chia sẻ dữ liệu Bến tàu (Pier) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin bến tàu cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController share endpoints bao gồm bến tàu

## Acceptance Criteria

- API share trả về danh sách bến tàu
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ bến tàu qua API share endpoint (Wave 0 / generic)
- Token validation với IntegrationTokenAdvice
- DTO PierDto

## Out of Scope

- Tạo/sửa/xóa bến tàu (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/piers | Danh sách bến tàu | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: PierDto
- Pattern: Wave 0 generic share endpoint
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Pier**: id, name, code, location(GeoJSON), length, type, capacity, status, createdAt, updatedAt
