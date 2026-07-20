---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-195
name: Chia se KCHTGT Khu neo dau
slug: chia-se-kchtgt-khu-neo-dau
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Khu neo dau

## Description

Chia sẻ dữ liệu Khu neo đậu (Anchorage) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin khu neo đậu cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getAnchorage() → GET /polygons/anchorage → trả về danh sách khu neo đậu có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /polygons/anchorage trả về danh sách khu neo đậu
- Dữ liệu có dạng GeoJSON Polygon
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ khu neo đậu qua API share endpoint
- Token validation với IntegrationTokenAdvice
- Dữ liệu có cấu trúc GeoJSON (tọa độ, ranh giới neo đậu)

## Out of Scope

- Tạo/sửa/xóa khu neo đậu (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/polygons/anchorage | Danh sách khu neo đậu | Token |

## Architecture Notes

- Controller: IntegrationShareController
- Pattern: Share endpoint (readonly, filter by token)
- Response format: GeoJSON Polygon
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Anchorage**: id, name, code, polygon(GeoJSON), capacity, status, createdAt, updatedAt
