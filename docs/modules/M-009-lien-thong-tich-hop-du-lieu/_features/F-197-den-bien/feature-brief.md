---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-197
name: Chia se KCHTGT Den bien
slug: chia-se-kchtgt-den-bien
module-id: M-009
status: implemented
classification: share
priority: high
created: 2026-06-16T04:39:27Z
last-updated: 2026-06-23T01:32:48Z
locked-fields: []
consumed_by_modules: []
---
# Feature: Chia se KCHTGT Den bien

## Description

Chia sẻ dữ liệu Đèn biển (Beacon) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin đèn biển cho các bên liên quan theo chuẩn TT48/TT67/ND43

## Flow Summary

IntegrationShareController.getBeacons() → GET /points/beacons → trả về danh sách đèn biển có định dạng GeoJSON

## Acceptance Criteria

- Endpoint GET /points/beacons trả về danh sách đèn biển
- Dữ liệu có dạng GeoJSON Point
- Token xác thực hợp lệ được validate
- Phân trang hỗ trợ

## In Scope

- Chia sẻ đèn biển qua API share endpoint
- Token validation với IntegrationTokenAdvice
- DTO BeaconDto với thông tin đặc tính đèn

## Out of Scope

- Tạo/sửa/xóa đèn biển (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/points/beacons | Danh sách đèn biển | Token |

## Architecture Notes

- Controller: IntegrationShareController
- DTO: BeaconDto
- Pattern: Share endpoint (readonly, filter by token)
- Response format: GeoJSON Point
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **Beacon**: id, name, code, location(GeoJSON), type, lightCharacteristic, range, status, createdAt, updatedAt
