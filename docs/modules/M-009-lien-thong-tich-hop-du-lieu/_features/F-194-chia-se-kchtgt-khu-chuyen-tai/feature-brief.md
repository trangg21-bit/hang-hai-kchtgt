---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-194
name: Chia se KCHTGT Khu chuyen tai
slug: chia-se-kchtgt-khu-chuyen-tai
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Khu chuyen tai

## Description

Chia sẻ dữ liệu Khu chuyển tải (Transport route) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin tuyến chuyển tải cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getShippingRoutes() → GET /lines/shipping-routes → trả về danh sách tuyến chuyển tải có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /lines/shipping-routes trả về danh sách tuyến chuyển tải
- Dữ liệu có dạng GeoJSON LineString
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ tuyến chuyển tải qua API share endpoint
- Token validation với IntegrationTokenAdvice
- Dữ liệu có cấu trúc GeoJSON (tọa độ, tuyến đường)

## Out of Scope

- Tạo/sửa/xóa tuyến (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/lines/shipping-routes | Danh sách tuyến chuyển tải | Token |

## Architecture Notes

- Controller: IntegrationShareController
- Pattern: Share endpoint (readonly, filter by token)
- Response format: GeoJSON LineString
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **TransportRoute**: id, name, code, line(GeoJSON), status, createdAt, updatedAt
