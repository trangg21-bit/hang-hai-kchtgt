---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-199
name: Chia se KCHTGT He thong VTS
slug: chia-se-kchtgt-he-thong-vts
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT He thong VTS

## Description

Chia sẻ dữ liệu Hệ thống VTS (VTS system) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin hệ thống VTS cho các bên liên quan

## Flow Summary

IntegrationShareController.getVtsSystems() → GET /points/vts-systems → trả về danh sách hệ thống VTS có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/vts-systems trả về danh sách hệ thống VTS
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ hệ thống VTS qua API share endpoint (Wave 2)
- Token validation với IntegrationTokenAdvice
- DTO VtsSystemDto
- Test: VtsSystemsEndpoints.validToken_success()

## Out of Scope

- Tạo/sửa/xóa hệ thống VTS (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/vts-systems | Danh sách hệ thống VTS | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: VtsSystemDto
- Wave 2: Endpoint được triển khai sau deferred từ Wave 1
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)
- Pagination: Page<T> default 20 items/page

## Entities

- **VtsSystem**: id, name, code, location(GeoJSON), type, coverageArea, status, createdAt, updatedAt
