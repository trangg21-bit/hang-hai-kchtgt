---
status: implemented
last-updated: 2026-06-23T01:32:48Z
---
---
id: F-205
name: Chia se du lieu - Comprehensive info
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
# Feature: Chia se du lieu - Comprehensive info

## Description

Chia sẻ thông tin tổng hợp (Comprehensive info) từ hệ thống LGSP qua trục liên thông

## Business Intent

Cung cấp thông tin tổng hợp đa lĩnh vực cho các bên liên quan

## Flow Summary

PortCargoShareController.getComprehensiveInfo() → GET /info/comprehensive → trả về thông tin tổng hợp

## Acceptance Criteria

- API share trả về thông tin tổng hợp
- Token xác thực hợp lệ được validate

## In Scope

- Chia sẻ thông tin tổng hợp qua API share endpoint
- Token validation với IntegrationTokenAdvice
- DTO ComprehensiveInfoDto

## Out of Scope

- Tạo/sửa/xóa thông tin (chỉ đọc)
- Tích hợp ngược (inbound sync)

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /api/v1/share/info/comprehensive | Thông tin tổng hợp | Token |

## Architecture Notes

- Controller: PortCargoShareController
- DTO: ComprehensiveInfoDto
- Pattern: Share endpoint (readonly, filter by token)
- Token validation: IntegrationTokenAdvice (@ControllerAdvice)

## Entities

- **ComprehensiveInfo**: id, name, description, data(GeoJSON), type, status, createdAt, updatedAt
