---
id: F-088
name: "Quản lý Nhà trạm đèn - Xóa"
slug: quan-ly-nha-tram-den-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Nhà trạm đèn - Xóa

## Description

Cho phép cán bộ nghiệp vụ xóa (soft-delete) một nhà trạm đèn khỏi hệ thống. Khi xóa, dữ liệu không bị mất vĩnh viễn khỏi cơ sở dữ liệu mà chỉ được đánh dấu với thời điểm xóa (deletedAt) và bị ẩn khỏi mọi truy vấn thông thường nhờ cơ chế @SQLRestriction("deleted_at IS NULL"). Hệ thống kiểm tra quyền sở hữu và trạng thái hiện tại của nhà trạm đèn trước khi cho phép xóa: chỉ cho phép xóa nếu trạng thái là DRAFT hoặc PENDING_APPROVAL; không cho phép xóa tài sản đã công bố (PUBLISHED). Sau khi xóa, hệ thống ghi nhật ký lịch sử hành động SOFT_DELETE với thông tin changedBy, changedAt.

## Business Intent

Đảm bảo khả năng loại bỏ các nhà trạm đèn không còn sử dụng hoặc được tạo nhầm ra khỏi danh sách vận hành, nhưng vẫn giữ lại dữ liệu lịch sử phục vụ kiểm toán. Soft-delete bảo vệ dữ liệu khỏi mất mát do thao tác nhầm và đảm bảo tính toàn vẹn tham chiếu với các bảng liên quan.

## Flow Summary

Người dùng chọn nhà trạm đèn cần xóa và gửi request DELETE đến endpoint /api/v1/nhatram/den/{id}. Hệ thống kiểm tra id có tồn tại không, kiểm tra trạng thái hiện tại (chỉ cho phép xóa nếu trạng thái là DRAFT hoặc PENDING_APPROVAL; không cho phép xóa nếu đã APPROVED, PUBLISHED). Nếu hợp lệ, hệ thống thực hiện softDelete: gán deletedAt = thời gian hiện tại, cập nhật trạng thái thành DELETED. Dữ liệu vẫn tồn tại trong bảng nha_tram_den nhưng bị loại trừ khỏi tất cả truy vấn mặc định. Hệ thống ghi một bản ghi lịch sử với actionType=SOFT_DELETE. Kết quả trả về thông báo xóa thành công.

## Acceptance Criteria

- AC-01: Gửi request DELETE với id tồn tại, nhà trạm đèn ở trạng thái DRAFT, hệ thống xóa thành công (soft-delete), trả về HTTP 200.
- AC-02: Gửi request DELETE với id đã được PUBLISHED, hệ thống từ chối xóa và trả về lỗi HTTP 400.
- AC-03: Gửi request DELETE với id không tồn tại, hệ thống trả về HTTP 404.
- AC-04: Sau khi xóa, truy vấn GET /api/v1/nhatram/den không còn hiển thị nhà trạm đèn đã xóa.
- AC-05: Khi xóa thành công, hệ thống ghi bản ghi lịch sử với actionType=SOFT_DELETE.

## In Scope

- Soft-delete nhà trạm đèn
- Kiểm tra trạng thái cho phép xóa
- Ghi lịch sử SOFT_DELETE

## Out of Scope

- Xóa vĩnh viễn (hard-delete)
- Khôi phục dữ liệu đã xóa

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | CRUD | Có thể xóa mọi nhà trạm đèn |
| operator | CRUD | Có thể xóa nhà trạm đèn do mình tạo (DRAFT/PENDING_APPROVAL) |
| viewer | Read | Không có quyền xóa |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramDen (nha_tram_den) | Table | Thực hiện softDelete, cập nhật deletedAt |
| BaseNhaTram | Superclass | Cung cấp phương thức softDelete() và trường deletedAt |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký hành động SOFT_DELETE |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | NhaTramDen | softDelete(), @SQLRestriction |
| BR-015 | Chỉ xóa được khi trạng thái là DRAFT hoặc PENDING_APPROVAL | NhaTramDen.status | Service validation logic |

## Testing Strategy

(populated by qa stage)
