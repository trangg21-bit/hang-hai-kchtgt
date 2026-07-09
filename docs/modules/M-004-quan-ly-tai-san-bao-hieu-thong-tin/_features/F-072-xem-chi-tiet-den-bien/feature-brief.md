---
id: F-072
name: "Xem chi tiết Đèn biển"
slug: xem-chi-tiet-den-bien
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: "2026-07-07T03:32:17Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Đèn biển

## Description

Cho phép người dùng xem toàn bộ thông tin chi tiết của một đèn biển dựa trên mã định danh (UUID). Thông tin hiển thị bao gồm: mã code, tên, loại đèn (LIGHTHOUSE / BEACON_LIGHT / BEACON_MARK), tọa độ WGS84 (kinh độ, vĩ độ), tầm hiệu lực ánh sáng, màu ánh sáng, đặc tính ánh sáng, tầm nhìn xa, mô tả, đơn vị quản lý (kèm tên đơn vị), ngày bảo trì gần nhất và kế tiếp, trạng thái hoạt động, trạng thái phê duyệt và thông tin audit (ngày tạo, ngày cập nhật).

## Business Intent

Cung cấp cái nhìn tổng quan và đầy đủ về một đèn biển cụ thể cho tất cả các vai trò (admin, operator, approver, viewer). Thông tin chi tiết giúp người dùng đánh giá tình trạng kỹ thuật, lịch bảo trì và trạng thái phê duyệt trước khi thực hiện các thao tác tiếp theo.

## Flow Summary

Người dùng click vào một đèn biển trong danh sách hoặc truy cập trực tiếp đường dẫn /api/beacon-lights/{id}. Hệ thống tìm kiếm đèn biển theo UUID, nếu không tìm thấy trả về lỗi "Đèn biển không tìm thấy". Nếu tìm thấy, hệ thống trả về toàn bộ thông tin bao gồm tên đơn vị quản lý (unitName) được tra cứu từ bảng org_unit. Kết quả trả về dạng JSON qua ApiResponse.

## Acceptance Criteria

- AC-01: Xem chi tiết thành công đèn biển hợp lệ — hệ thống trả về HTTP 200 với đầy đủ thông tin (code, name, type, latitude, longitude, lightRange, lightColor, lightCharacteristic, range, description, unitId, unitName, lastMaintenanceDate, nextMaintenanceDate, isActive, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt).
- AC-02: Hệ thống trả về lỗi 404 nếu đèn biển không tồn tại hoặc đã bị xóa (deleted_at IS NOT NULL).
- AC-03: Mọi vai trò (kể cả viewer) đều có thể xem chi tiết đèn biển.
- AC-04: Trường unitName được hiển thị (tra cứu từ OrgUnit) nếu unitId có giá trị.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | read | Có quyền xem chi tiết mọi đèn biển |
| operator | read | Có quyền xem chi tiết |
| approver_L1 | read | Có quyền xem chi tiết để phê duyệt |
| approver_L2 | read | Có quyền xem chi tiết để phê duyệt |
| viewer | read | Có quyền xem chi tiết |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconLight | beacon_light | Thực thể chính, nguồn dữ liệu chi tiết |
| OrgUnit | org_unit | Tra cứu tên đơn vị quản lý |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code phải là duy nhất, không được để trống, tối đa 50 ký tự | BeaconLight.code | `@NotBlank`, `@Column(unique=true)` |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | BeaconLight.name | `@NotBlank`, `@Size(max=200)` |
| BR-009 | Soft-delete — bản ghi có deleted_at bị ẩn khỏi truy vấn | BeaconLight | `@SQLRestriction("deleted_at IS NULL")` |

## Testing Strategy

(populated by qa stage)
