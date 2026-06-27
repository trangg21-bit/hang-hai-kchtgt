---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-196
name: Chia se KCHTGT Co so sua chua
slug: chia-se-kchtgt-co-so-sua-chua
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Co so sua chua

## Description

Chia sẻ dữ liệu Cơ sở sửa chữa (Repair facility) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin cơ sở sửa chữa tàu thuyền cho các bên liên quan

## Flow Summary

IntegrationShareController.getRepairFacilities() → GET /points/repair-facilities → trả về danh sách cơ sở sửa chữa có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/repair-facilities trả về danh sách cơ sở sửa chữa
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ cơ sở sửa chữa qua API share endpoint (Wave 2)
- Token validation với IntegrationTokenAdvice
- DTO RepairFacilityDto và DtoMapper methods
- Test: RepairFacilitiesEndpoints.validToken_success()

## Out of Scope

- Tạo/sửa/xóa cơ sở (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/repair-facilities | Danh sách cơ sở sửa chữa | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: RepairFacilityDto
- Wave 2: Endpoint được triển khai sau deferred từ Wave 1
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)
- Pagination: Page<T> default 20 items/page

## Entities

- **RepairFacility**: id, name, code, location(GeoJSON), capacity, status, createdAt, updatedAt
