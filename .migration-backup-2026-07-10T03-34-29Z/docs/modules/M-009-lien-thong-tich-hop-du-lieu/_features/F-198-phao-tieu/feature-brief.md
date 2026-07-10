---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-198
name: Chia se KCHTGT Phao tieu
slug: chia-se-kchtgt-phao-tieu
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Phao tieu

## Description

Chia sẻ dữ liệu Phao tiêu (Buoy marker) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin phao tiêu cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getBuoyMarkers() → GET /points/buoy-markers → trả về danh sách phao tiêu có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/buoy-markers trả về danh sách phao tiêu
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ phao tiêu qua API share endpoint (Wave 2)
- Token validation với IntegrationTokenAdvice
- DTO BuoyMarkerDto
- Test: BuoyMarkersEndpoints.validToken_success()

## Out of Scope

- Tạo/sửa/xóa phao tiêu (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/buoy-markers | Danh sách phao tiêu | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: BuoyMarkerDto
- Wave 2: Endpoint được triển khai sau deferred từ Wave 1
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)
- Pagination: Page<T> default 20 items/page

## Entities

- **BuoyMarker**: id, name, code, location(GeoJSON), type, color, lightCharacteristic, status, createdAt, updatedAt
