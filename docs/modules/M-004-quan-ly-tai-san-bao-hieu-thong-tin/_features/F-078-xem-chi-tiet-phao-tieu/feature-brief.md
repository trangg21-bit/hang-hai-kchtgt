---
id: F-078
name: "Xem chi tiết Phao tiêu"
slug: xem-chi-tiet-phao-tieu
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:33Z"
last-updated: "2026-07-07T03:32:33Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Phao tiêu

## Description

Cho phép người dùng xem toàn bộ thông tin chi tiết của một phao tiêu dựa trên mã định danh (UUID). Thông tin hiển thị bao gồm: mã code, tên, loại phao (CARDINAL / SECTOR / SPECIAL / SAFE_WATER / ISOLATED_DANGER), tọa độ WGS84, màu sắc, hình dáng, đặc tính ánh sáng, tầm nhìn xa, mô tả, đơn vị quản lý (kèm tên đơn vị), ngày kiểm tra gần nhất và kế tiếp, trạng thái hoạt động, trạng thái phê duyệt (status, approvalStatus, approvalLevel), thông tin phê duyệt (approvedBy, approvedDate, rejectionReason) và thông tin audit (createdAt, updatedAt).

## Business Intent

Cung cấp cái nhìn tổng quan và đầy đủ về một phao tiêu cụ thể cho tất cả các vai trò. Thông tin chi tiết về thông số kỹ thuật (màu sắc, hình dáng, ánh sáng) giúp người dùng đánh giá đặc tính báo hiệu của phao tiêu, phục vụ công tác quản lý và đảm bảo an toàn hàng hải.

## Flow Summary

Người dùng click vào một phao tiêu trong danh sách hoặc truy cập trực tiếp đường dẫn GET /api/buoys/{id}. Hệ thống tìm kiếm phao tiêu theo UUID, nếu không tìm thấy trả về lỗi "Phao tiêu không tìm thấy". Nếu tìm thấy, hệ thống trả về toàn bộ thông tin bao gồm tên đơn vị quản lý (unitName) tra cứu từ bảng org_unit. Kết quả trả về dạng JSON qua ApiResponse.

## Acceptance Criteria

- AC-01: Xem chi tiết thành công phao tiêu hợp lệ — hệ thống trả về HTTP 200 với đầy đủ thông tin (code, name, type, latitude, longitude, color, shape, lightCharacteristic, range, description, unitId, unitName, lastInspectionDate, nextInspectionDate, isActive, status, approvalStatus, approvalLevel, approvedBy, approvedDate, rejectionReason, createdAt, updatedAt).
- AC-02: Hệ thống trả về lỗi 404 nếu phao tiêu không tồn tại hoặc đã bị xóa (deleted_at IS NOT NULL).
- AC-03: Mọi vai trò (kể cả viewer) đều có thể xem chi tiết phao tiêu.
- AC-04: Trường unitName được hiển thị (tra cứu từ OrgUnit) nếu unitId có giá trị.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | read | Có quyền xem chi tiết mọi phao tiêu |
| operator | read | Có quyền xem chi tiết |
| approver_L1 | read | Có quyền xem chi tiết để phê duyệt |
| approver_L2 | read | Có quyền xem chi tiết để phê duyệt |
| viewer | read | Có quyền xem chi tiết |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| Buoy | buoy | Thực thể chính, nguồn dữ liệu chi tiết |
| OrgUnit | org_unit | Tra cứu tên đơn vị quản lý |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code phải là duy nhất, không được để trống, tối đa 50 ký tự | Buoy.code | `@NotBlank`, `@Column(unique=true)` |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | Buoy.name | `@NotBlank`, `@Size(max=200)` |
| BR-009 | Soft-delete — bản ghi có deleted_at bị ẩn khỏi truy vấn | Buoy | `@SQLRestriction("deleted_at IS NULL")` |
| BR-016 | Màu sắc tối đa 50 ký tự | Buoy.color | `@Size(max=50)` |
| BR-017 | Hình dáng tối đa 50 ký tự | Buoy.shape | `@Size(max=50)` |

## Testing Strategy

(populated by qa stage)
