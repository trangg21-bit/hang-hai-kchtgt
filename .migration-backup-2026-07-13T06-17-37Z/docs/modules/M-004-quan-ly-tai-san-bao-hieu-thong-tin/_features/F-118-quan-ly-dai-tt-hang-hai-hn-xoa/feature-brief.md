---
id: F-118
name: "Quản lý Đài TT Hàng hải HN - Xóa"
slug: quan-ly-dai-tt-hang-hai-hn-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-07T03:33:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Xóa

## Description

Tính năng soft-delete một Đài TT Hàng hải Hải Phòng. Bản ghi được đánh dấu deletedAt, ẩn khỏi truy vấn nhờ @SQLRestriction. Hành động xóa được ghi nhận lịch sử với actionType SOFT_DELETE.

## Business Intent

Quản lý vòng đời Đài TT Hàng hải Hải Phòng, cho phép loại bỏ các đài không còn hoạt động khỏi giao diện người dùng nhưng giữ dữ liệu lịch sử phục vụ kiểm toán.

## Flow Summary

Operator → Chọn Đài Hải Phòng → Xác nhận xóa → DELETE /api/v1/stations/haiphong/{id} → softDelete() → Ghi lịch sử → HTTP 204.

## Acceptance Criteria

- **AC-01**: Xóa thành công, HTTP 204, ẩn khỏi danh sách.
- **AC-02**: Xóa đã xóa trước đó trả về HTTP 404.
- **AC-03**: Lịch sử xóa được ghi nhận.
- **AC-04**: Dữ liệu lịch sử vẫn còn sau khi xóa.

## In Scope

- Soft-delete
- Kiểm tra tồn tại
- Ghi lịch sử

## Out of Scope

- Hard-delete, khôi phục

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Xóa |
| operator | CRUD | Xóa |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationHaiphong**: softDelete().

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Chỉ soft-delete | CoastalStationHaiphong | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
