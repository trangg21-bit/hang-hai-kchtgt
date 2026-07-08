---
id: F-100
name: "Quản lý Đài Inmarsat - Xóa"
slug: quan-ly-dai-inmarsat-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài Inmarsat - Xóa

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) thực hiện soft-delete một Đài Inmarsat khỏi hệ thống. Bản ghi không bị xóa vĩnh viễn khỏi cơ sở dữ liệu mà chỉ được đánh dấu thời điểm xóa (deletedAt) và bị ẩn khỏi các truy vấn thông thường nhờ @SQLRestriction("deleted_at IS NULL"). Điều này cho phép khôi phục khi cần và đảm bảo toàn vẹn dữ liệu lịch sử. Hành động xóa được ghi nhận trong lịch sử với actionType SOFT_DELETE, bao gồm thông tin người thực hiện và thời gian.

## Business Intent

Quản lý vòng đời Đài Inmarsat trong hệ thống, cho phép loại bỏ các đài không còn hoạt động khỏi giao diện người dùng mà vẫn giữ dữ liệu gốc phục vụ kiểm toán. Soft-delete đảm bảo không mất dữ liệu lịch sử quan trọng về vùng phủ sóng vệ tinh và thông tin SAR đã được ghi nhận.

## Flow Summary

Operator chọn Đài Inmarsat cần xóa → Xác nhận xóa → Hệ thống gọi DELETE /api/v1/stations/inmarsat/{id} → Service.softDelete() đặt deletedAt → Bản ghi ẩn khỏi mọi truy vấn → Ghi lịch sử SOFT_DELETE → Trả về HTTP 204.

## Acceptance Criteria

- **AC-01**: Xóa Đài Inmarsat hợp lệ, hệ thống soft-delete và trả về HTTP 204.
- **AC-02**: Xóa đài đã xóa trước đó trả về HTTP 404.
- **AC-03**: Lịch sử xóa được ghi nhận với actionType SOFT_DELETE.

## In Scope

- Soft-delete Đài Inmarsat
- Kiểm tra tồn tại trước khi xóa
- Ghi nhận lịch sử

## Out of Scope

- Hard-delete
- Khôi phục đài đã xóa

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Có thể xóa |
| operator | CRUD | Có thể xóa |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationInmarsat**: softDelete() đặt deletedAt.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Chỉ soft-delete, không xóa vĩnh viễn | CoastalStationInmarsat | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
