---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-193
name: Chia se KCHTGT Khu tranh bao
slug: chia-se-kchtgt-khu-tranh-bao
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Khu tranh bao

## Description

Chia sẻ dữ liệu Khu tranh bao (Storm shelter) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin khu tranh bao cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getStormShelter() → GET /polygons/storm-shelter → trả về danh sách khu tranh bao có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /polygons/storm-shelter trả về danh sách khu tranh bao
- Dữ liệu có dạng GeoJSON Polygon
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ khu tranh bao qua API share endpoint
- Token validation với IntegrationTokenAdvice
- Dữ liệu có cấu trúc GeoJSON (tọa độ, ranh giới)

## Out of Scope

- Tạo/sửa/xóa khu tranh bao (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/polygons/storm-shelter | Danh sách khu tranh bao | Token |

## Architecture Notes

- Controller: IntegrationShareController
- Pattern: Share endpoint (readonly, filter by token)
- Response format: GeoJSON Polygon
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **StormShelter**: id, name, code, polygon(GeoJSON), status, createdAt, updatedAt
