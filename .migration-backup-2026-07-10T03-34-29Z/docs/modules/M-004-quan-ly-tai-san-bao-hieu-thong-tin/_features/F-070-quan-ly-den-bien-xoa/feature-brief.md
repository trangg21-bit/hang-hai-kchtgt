---
id: F-070
name: "Quản lý Đèn biển - Xóa"
slug: quan-ly-den-bien-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: "2026-07-07T03:32:17Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đèn biển - Xóa

## Description

Cho phép người dùng xóa một đèn biển khỏi hệ thống. Đây là xóa mềm (soft-delete): bản ghi vẫn tồn tại trong cơ sở dữ liệu nhưng bị ẩn khỏi mọi truy vấn thông qua cơ chế @SQLRestriction("deleted_at IS NULL"). Trường deletedAt được gán thời gian hiện tại và trạng thái chuyển thành DELETED. Không thể xóa đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL, APPROVED_L1, APPROVED_L2). Khi xóa, điểm GIS tương ứng trên bản đồ M-007 bị ẩn đi.

## Business Intent

Đảm bảo khả năng quản lý vòng đời tài sản đèn biển: loại bỏ các đèn biển không còn hoạt động khỏi danh sách tác nghiệp nhưng vẫn lưu trữ dữ liệu lịch sử để phục vụ kiểm toán, truy xuất nguồn gốc. Việc cấm xóa đèn biển đang trong quy trình phê duyệt ngăn chặn mất dữ liệu đang xử lý.

## Flow Summary

Người dùng chọn một đèn biển từ danh sách và nhấn "Xóa". Hệ thống kiểm tra đèn biển tồn tại, chưa bị xóa trước đó và không đang trong quy trình phê duyệt (PENDING_APPROVAL / APPROVED_L1 / APPROVED_L2). Nếu hợp lệ, hệ thống thực hiện soft-delete: gán deletedAt = thời gian hiện tại, set status = DELETED và lưu lại. Ghi lịch sử với actionType = SOFT_DELETE. Đồng bộ sang hệ thống GIS M-007 để ẩn điểm bản đồ tương ứng.

## Acceptance Criteria

- AC-01: Xóa thành công đèn biển ở trạng thái DRAFT hoặc PUBLISHED — hệ thống trả về HTTP 200 với thông báo "Đã xóa đèn biển thành công".
- AC-02: Hệ thống từ chối xóa nếu đèn biển đã bị xóa trước đó (status = DELETED) — trả về lỗi "Đèn biển này đã bị xóa trước đó".
- AC-03: Hệ thống từ chối xóa nếu đèn biển đang trong quy trình phê duyệt (PENDING_APPROVAL / APPROVED_L1 / APPROVED_L2) — trả về lỗi "Không thể xóa đèn biển đang chờ phê duyệt".
- AC-04: Sau khi xóa, record không xuất hiện trong danh sách tìm kiếm hoặc xem chi tiết.
- AC-05: Điểm GIS trên bản đồ (M-007) bị ẩn sau khi xóa (không bị xóa vĩnh viễn).
- AC-06: Lịch sử SOFT_DELETE được ghi vào bảng beacon_history.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền xóa đèn biển |
| operator | delete | Có quyền xóa đèn biển do mình tạo |
| approver_L1 | none | Không có quyền xóa |
| approver_L2 | none | Không có quyền xóa |
| viewer | none | Không có quyền xóa |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconLight | beacon_light | Thực thể chính, thực hiện soft-delete |
| BeaconHistory | beacon_history | Ghi lịch sử SOFT_DELETE |
| PointObject (M-007) | point_objects | Điểm GIS bị ẩn đồng bộ |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | BeaconLight | `softDelete()`, `@SQLRestriction("deleted_at IS NULL")` |
| BR-014 | Khi xóa BeaconLight, điểm GIS tương ứng bị ẩn (không xóa) | BeaconLight + PointObject | `PointObjectSyncService.hideFromMap()` |
| BR-010 | Không thể xóa đèn biển đang trong quy trình phê duyệt | BeaconLight.status | Service check `isInApprovalProcess()` |

## Testing Strategy

(populated by qa stage)
