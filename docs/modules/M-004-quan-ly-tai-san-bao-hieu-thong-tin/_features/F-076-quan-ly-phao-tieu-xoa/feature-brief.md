---
id: F-076
name: "Quản lý Phao tiêu - Xóa"
slug: quan-ly-phao-tieu-xoa
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:33Z"
last-updated: "2026-07-07T03:32:33Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Phao tiêu - Xóa

## Description

Cho phép người dùng xóa một phao tiêu khỏi hệ thống thông qua soft-delete. Bản ghi vẫn tồn tại trong cơ sở dữ liệu nhưng bị ẩn nhờ @SQLRestriction("deleted_at IS NULL"). Trường deletedAt được gán thời gian hiện tại, trạng thái chuyển thành DELETED. Không thể xóa phao tiêu đang trong quy trình phê duyệt (PENDING_APPROVAL / APPROVED_L1 / APPROVED_L2). Khi xóa, điểm GIS tương ứng trên bản đồ M-007 bị ẩn thông qua PointObjectSyncService.

## Business Intent

Đảm bảo khả năng quản lý vòng đời tài sản phao tiêu: loại bỏ các phao tiêu không còn hoạt động khỏi danh sách tác nghiệp nhưng vẫn lưu trữ dữ liệu lịch sử phục vụ kiểm toán. Việc cấm xóa phao tiêu đang trong quy trình phê duyệt ngăn chặn mất dữ liệu đang xử lý. Đồng bộ GIS đảm bảo bản đồ hàng hải luôn phản ánh hiện trạng thực tế.

## Flow Summary

Người dùng chọn một phao tiêu từ danh sách và nhấn "Xóa". Hệ thống kiểm tra phao tiêu tồn tại, chưa bị xóa trước đó và không đang trong quy trình phê duyệt. Nếu hợp lệ, hệ thống thực hiện soft-delete: gán deletedAt = thời gian hiện tại, set status = DELETED, lưu lại. Ghi lịch sử với actionType = SOFT_DELETE. Đồng bộ sang GIS M-007 để ẩn điểm bản đồ tương ứng qua PointObjectSyncService.hideFromMapBuoy().

## Acceptance Criteria

- AC-01: Xóa thành công phao tiêu ở trạng thái DRAFT hoặc PUBLISHED — hệ thống trả về HTTP 200 với thông báo "Đã xóa phao tiêu thành công".
- AC-02: Hệ thống từ chối xóa nếu phao tiêu đã bị xóa trước đó (status = DELETED).
- AC-03: Hệ thống từ chối xóa nếu phao tiêu đang trong quy trình phê duyệt (PENDING_APPROVAL / APPROVED_L1 / APPROVED_L2).
- AC-04: Sau khi xóa, phao tiêu không xuất hiện trong danh sách hoặc tìm kiếm.
- AC-05: Điểm GIS trên bản đồ M-007 bị ẩn sau khi xóa.
- AC-06: Lịch sử SOFT_DELETE được ghi vào bảng beacon_history với beaconType = BUOY.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền xóa phao tiêu |
| operator | delete | Có quyền xóa phao tiêu do mình tạo |
| approver_L1 | none | Không có quyền xóa |
| approver_L2 | none | Không có quyền xóa |
| viewer | none | Không có quyền xóa |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| Buoy | buoy | Thực thể chính, thực hiện soft-delete |
| BeaconHistory | beacon_history | Ghi lịch sử SOFT_DELETE |
| PointObject (M-007) | point_objects | Điểm GIS bị ẩn đồng bộ |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Không thể xóa vĩnh viễn — chỉ soft-delete (đặt deleted_at) | Buoy | `softDelete()`, `@SQLRestriction("deleted_at IS NULL")` |
| BR-014 | Khi xóa Buoy, điểm GIS tương ứng bị ẩn (không xóa) | Buoy + PointObject | `PointObjectSyncService.hideFromMapBuoy()` |

## Testing Strategy

(populated by qa stage)
