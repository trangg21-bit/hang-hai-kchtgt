---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-202
name: Chia se du lieu - Buoy berth
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
# Feature: Chia se du lieu - Buoy berth

## Description

Chia sẻ dữ liệu Bến phao (Buoy berth) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin bến phao cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getBuoys() → GET /points/buoys → trả về danh sách bến phao có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/buoys trả về danh sách bến phao
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ bến phao qua API share endpoint (Wave 0 / generic)
- Token validation với IntegrationTokenAdvice
- DTO BuoyBerthDto

## Out of Scope

- Tạo/sửa/xóa bến phao (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/buoys | Danh sách bến phao | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: BuoyBerthDto
- Pattern: Wave 0 generic share endpoint
- Response format: GeoJSON Point
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **BuoyBerth**: id, name, code, location(GeoJSON), type, capacity, status, createdAt, updatedAt
