---
id: F-073
name: "Quản lý Đèn biển - Lịch sử"
slug: quan-ly-den-bien-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: "2026-07-07T03:32:17Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đèn biển - Lịch sử

## Description

Cho phép người dùng xem lịch sử thao tác trên các đèn biển thông qua bảng beacon_history với điều kiện lọc beaconType = BEACON_LIGHT. Lịch sử ghi lại tất cả các hành động: CREATE (tạo mới), UPDATE (cập nhật — ghi danh sách trường thay đổi), APPROVE_L1 (phê duyệt cấp 1), APPROVE_L2 (phê duyệt cấp 2), REJECT (từ chối — ghi lý do), SOFT_DELETE (xóa mềm). Mỗi bản ghi lịch sử bao gồm thông tin: entityId, actionType, changedField, previousValue, newValue (dạng JSON), changedBy, changedAt.

## Business Intent

Cung cấp khả năng kiểm toán và truy xuất nguồn gốc (audit trail) cho toàn bộ vòng đời của đèn biển. Đây là yêu cầu bắt buộc trong quản lý tài sản công — cho phép cơ quan quản lý và thanh tra tra cứu ai đã thay đổi gì và khi nào, phục vụ công tác kiểm tra, giám sát và giải trình.

## Flow Summary

Người dùng truy cập màn hình lịch sử của module Đèn biển. Hệ thống gọi endpoint GET /api/beacon-history với tham số type=BEACON_LIGHT để lấy danh sách tất cả các bản ghi lịch sử liên quan đến đèn biển. Kết quả trả về danh sách các bản ghi beacon_history, sắp xếp theo thời gian (changedAt). Người dùng có thể xem chi tiết từng hành động: loại hành động, trường thay đổi, giá trị cũ/mới, người thực hiện và thời gian.

## Acceptance Criteria

- AC-01: Xem danh sách lịch sử đèn biển thành công — hệ thống trả về HTTP 200 với danh sách bản ghi beacon_history có beaconType = BEACON_LIGHT.
- AC-02: Lịch sử hiển thị đầy đủ các actionType: CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE.
- AC-03: Mỗi bản ghi lịch sử bao gồm: entityId, actionType, changedBy, changedAt, previousValue, newValue.
- AC-04: Đối với hành động UPDATE, trường changedField hiển thị danh sách các trường đã thay đổi (vd: "name, lightColor, nextMaintenanceDate").
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
| BeaconHistory | beacon_history | Thực thể chính, lưu toàn bộ lịch sử thao tác |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Soft-delete được ghi nhận qua lịch sử SOFT_DELETE | BeaconHistory | `logHistory(actionType = SOFT_DELETE)` |

## Testing Strategy

(populated by qa stage)
