---
id: F-079
name: "Quản lý Phao tiêu - Lịch sử"
slug: quan-ly-phao-tieu-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:33Z"
last-updated: "2026-07-07T03:32:33Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Phao tiêu - Lịch sử

## Description

Cho phép người dùng xem lịch sử thao tác trên các phao tiêu thông qua bảng beacon_history với điều kiện lọc beaconType = BUOY. Lịch sử ghi lại tất cả các hành động: CREATE (tạo mới), UPDATE (cập nhật — ghi danh sách trường thay đổi), APPROVE_L1 (phê duyệt cấp 1), APPROVE_L2 (phê duyệt cấp 2), REJECT (từ chối — ghi lý do), SOFT_DELETE (xóa mềm). Mỗi bản ghi lịch sử bao gồm: entityId, actionType, changedField, previousValue (JSON), newValue (JSON), changedBy, changedAt.

## Business Intent

Cung cấp khả năng kiểm toán và truy xuất nguồn gốc (audit trail) cho toàn bộ vòng đời của phao tiêu — từ khi tạo mới, qua các lần cập nhật, phê duyệt cho đến khi xóa. Đây là yêu cầu bắt buộc trong quản lý tài sản công, cho phép cơ quan quản lý và thanh tra tra cứu ai đã thay đổi gì, khi nào, phục vụ công tác giám sát và giải trình.

## Flow Summary

Người dùng truy cập màn hình lịch sử của module Phao tiêu. Hệ thống gọi endpoint GET /api/beacon-history với tham số type=BUOY để lấy danh sách tất cả các bản ghi lịch sử liên quan đến phao tiêu. Kết quả trả về danh sách beacon_history, sắp xếp theo thời gian (changedAt). Người dùng có thể xem chi tiết từng hành động: loại hành động, trường thay đổi, giá trị cũ/mới (dạng JSON), người thực hiện và thời gian.

## Acceptance Criteria

- AC-01: Xem danh sách lịch sử phao tiêu thành công — hệ thống trả về HTTP 200 với danh sách beacon_history có beaconType = BUOY.
- AC-02: Lịch sử hiển thị đầy đủ các actionType: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE.
- AC-03: Mỗi bản ghi lịch sử bao gồm: entityId, actionType, changedBy, changedAt, previousValue, newValue.
- AC-04: Đối với hành động UPDATE, trường changedField hiển thị danh sách các trường đã thay đổi (vd: "name, color, shape, nextInspectionDate").
- AC-05: Mọi vai trò (kể cả viewer) đều có thể xem lịch sử.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | read | Có quyền xem lịch sử |
| operator | read | Có quyền xem lịch sử |
| approver_L1 | read | Có quyền xem lịch sử |
| approver_L2 | read | Có quyền xem lịch sử |
| viewer | read | Có quyền xem lịch sử |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconHistory | beacon_history | Thực thể chính, lưu toàn bộ lịch sử thao tác với beaconType = BUOY |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Soft-delete được ghi nhận qua lịch sử SOFT_DELETE | BeaconHistory | `logHistory(actionType = SOFT_DELETE)` |

## Testing Strategy

(populated by qa stage)
