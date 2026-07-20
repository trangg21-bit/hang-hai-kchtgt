---
id: F-094
name: "Quản lý Đài TTDH - Xóa"
slug: quan-ly-dai-ttdh-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-07T03:32:57Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Xóa

## Description

Tính năng cho phép cán bộ nghiệp vụ (operator) thực hiện xóa (soft-delete) một Đài Thông tin Duyên hải (VTS) khỏi hệ thống. Theo cơ chế soft-delete, bản ghi không bị xóa vĩnh viễn khỏi cơ sở dữ liệu mà chỉ được đánh dấu thời điểm xóa (deletedAt) và bị ẩn khỏi các truy vấn tìm kiếm thông thường nhờ cơ chế @SQLRestriction("deleted_at IS NULL"). Điều này cho phép khôi phục dữ liệu khi cần thiết và đảm bảo toàn vẹn tham chiếu với các bảng lịch sử liên quan. Hành động xóa được ghi nhận vào lịch sử với actionType là SOFT_DELETE.

## Business Intent

Quản lý vòng đời của Đài TTDH trong hệ thống, cho phép loại bỏ các đài không còn hoạt động hoặc được thay thế khỏi giao diện người dùng mà vẫn giữ lại dữ liệu gốc phục vụ kiểm toán và truy xuất sau này. Soft-delete đảm bảo không mất dữ liệu lịch sử và cho phép admin khôi phục khi cần.

## Flow Summary

Người dùng operator truy cập danh sách Đài TTDH → Chọn một đài cần xóa → Hệ thống hiển thị hộp thoại xác nhận xóa → Người dùng xác nhận → Hệ thống gọi API DELETE /api/v1/stations/coastal/{id} → Service thực hiện softDelete(): đặt trường deletedAt = current time → Bản ghi bị ẩn khỏi mọi truy vấn danh sách (nhờ @SQLRestriction) → Hệ thống ghi nhận lịch sử với actionType = SOFT_DELETE → Trả về HTTP 204 No Content.

## Acceptance Criteria

- **AC-01**: Khi xóa một Đài TTDH đang tồn tại, hệ thống thực hiện soft-delete (đặt deletedAt), trả về HTTP 204 và bản ghi biến mất khỏi danh sách tìm kiếm.
- **AC-02**: Khi xóa một đài đã bị xóa trước đó (deletedAt != null), hệ thống trả về lỗi không tìm thấy bản ghi (HTTP 404).
- **AC-03**: Sau khi xóa, dữ liệu lịch sử của đài vẫn có thể tra cứu được qua API lịch sử (F-097).
- **AC-04**: Hành động xóa được ghi nhận trong bảng lịch sử với actionType SOFT_DELETE, ghi rõ người thực hiện và thời gian.

## In Scope

- Soft-delete Đài TTDH (đặt deletedAt, ẩn khỏi truy vấn)
- Kiểm tra bản ghi tồn tại trước khi xóa
- Ghi nhận lịch sử xóa

## Out of Scope

- Xóa vĩnh viễn (hard-delete) khỏi cơ sở dữ liệu
- Khôi phục đài đã xóa
- Xóa hàng loạt

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | CRUD | Full quyền, có thể xóa |
| operator | CRUD | Có thể xóa đài TTDH |
| approver_L1 | Read | Không có quyền xóa |
| approver_L2 | Read | Không có quyền xóa |
| viewer | Read | Không có quyền xóa |

## Entities

- **CoastalStationVTS**: Bản ghi bị soft-delete khi trường deletedAt được đặt khác null. Cột deletedAt được thêm annotation @SQLRestriction("deleted_at IS NULL") để tự động lọc.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | CoastalStationVTS | softDelete(), @SQLRestriction |

## Testing Strategy

(populated by qa stage)
