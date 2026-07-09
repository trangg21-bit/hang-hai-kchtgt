---
id: F-106
name: "Quản lý Đài COSPAS-SARSAT - Xóa"
slug: quan-ly-dai-cospas-sarsat-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài COSPAS-SARSAT - Xóa

## Description

Tính năng cho phép soft-delete một Đài COSPAS-SARSAT khỏi hệ thống. Bản ghi được đánh dấu thời điểm xóa (deletedAt) và ẩn khỏi truy vấn thông thường nhờ @SQLRestriction("deleted_at IS NULL"). Hành động xóa được ghi nhận trong lịch sử với actionType SOFT_DELETE kèm thông tin người thực hiện và thời gian.

## Business Intent

Quản lý vòng đời Đài COSPAS-SARSAT, cho phép loại bỏ các đài không còn hoạt động khỏi giao diện người dùng nhưng vẫn giữ dữ liệu lịch sử phục vụ kiểm toán và điều tra sự cố SAR.

## Flow Summary

Operator chọn Đài COSPAS-SARSAT → Xác nhận xóa → DELETE /api/v1/stations/cospas-sarsat/{id} → Soft-delete (đặt deletedAt) → Ghi lịch sử → HTTP 204.

## Acceptance Criteria

- **AC-01**: Xóa thành công, trả về HTTP 204, bản ghi ẩn khỏi danh sách.
- **AC-02**: Xóa đã xóa trước đó trả về HTTP 404.
- **AC-03**: Lịch sử xóa được ghi nhận với actionType SOFT_DELETE.

## In Scope

- Soft-delete
- Kiểm tra tồn tại
- Ghi lịch sử

## Out of Scope

- Hard-delete
- Khôi phục

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Xóa |
| operator | CRUD | Xóa |
| approver_L1 | Read | Không |
| approver_L2 | Read | Không |
| viewer | Read | Không |

## Entities

- **CoastalStationCospasSarsat**: softDelete().

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Chỉ soft-delete | CoastalStationCospasSarsat | @SQLRestriction |

## Testing Strategy

(populated by qa stage)
