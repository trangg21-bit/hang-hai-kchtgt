---
id: F-075
name: "Quản lý Phao tiêu - Cập nhật"
slug: quan-ly-phao-tieu-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:32Z"
last-updated: "2026-07-07T03:32:32Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Phao tiêu - Cập nhật

## Description

Cho phép người dùng cập nhật thông tin của một phao tiêu đã tồn tại. Các trường có thể thay đổi bao gồm: tên, loại phao, tọa độ, màu sắc, hình dáng, đặc tính ánh sáng, tầm nhìn xa, mô tả, đơn vị quản lý, ngày kiểm tra và trạng thái hoạt động. Mã code không thể thay đổi sau khi tạo. Nếu phao tiêu đã ở trạng thái đã phê duyệt (APPROVED_L1 / APPROVED_L2 / PUBLISHED), hệ thống tự động đưa về trạng thái DRAFT và yêu cầu phê duyệt lại. Hệ thống ghi lại lịch sử các thay đổi để truy vết.

## Business Intent

Đảm bảo thông tin phao tiêu luôn được cập nhật kịp thời khi có thay đổi về thông số kỹ thuật (màu sắc, hình dáng, đặc tính ánh sáng), lịch kiểm tra hoặc thông tin quản lý. Việc tự động đưa về DRAFT khi sửa phao tiêu đã được phê duyệt đảm bảo mọi thay đổi đều trải qua quy trình kiểm duyệt.

## Flow Summary

Người dùng chọn một phao tiêu từ danh sách và nhấn "Sửa". Hệ thống hiển thị form với dữ liệu hiện tại. Người dùng thay đổi các trường mong muốn và gửi yêu cầu PUT /api/buoys/{id}. Hệ thống kiểm tra entity tồn tại và chưa bị xóa, validate tọa độ, kiểm tra loại phao không thay đổi nếu đã phê duyệt L2/PUBLISHED. Nếu entity đang ở trạng thái đã phê duyệt, tự động hạ về DRAFT. Lịch sử UPDATE được ghi với danh sách các trường thay đổi.

## Acceptance Criteria

- AC-01: Cập nhật thành công các trường thông tin của phao tiêu — hệ thống trả về HTTP 200 và thông tin đã cập nhật.
- AC-02: Hệ thống từ chối cập nhật nếu mã code được gửi trong request — code là trường immutable.
- AC-03: Hệ thống từ chối thay đổi loại phao (type) nếu phao tiêu đã ở trạng thái APPROVED_L2 hoặc PUBLISHED.
- AC-04: Nếu phao tiêu đã được phê duyệt, sau khi cập nhật status tự động chuyển về DRAFT và approvalStatus về PENDING.
- AC-05: Hệ thống từ chối cập nhật nếu phao tiêu đã bị xóa (status = DELETED).
- AC-06: Sau khi cập nhật, lịch sử được ghi với actionType = UPDATE và danh sách trường thay đổi.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền cập nhật mọi phao tiêu |
| operator | update | Có quyền cập nhật phao tiêu do mình tạo |
| approver_L1 | none | Không có quyền cập nhật |
| approver_L2 | none | Không có quyền cập nhật |
| viewer | none | Không có quyền cập nhật |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| Buoy | buoy | Thực thể chính, cập nhật thông tin |
| BeaconHistory | beacon_history | Ghi lại lịch sử thay đổi UPDATE |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code là duy nhất, không thể thay đổi sau khi tạo | Buoy.code | Immutable trong UpdateBuoyRequest |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | Buoy.name | `@NotBlank`, `@Size(max=200)` |
| BR-003 | Vĩ độ phải trong khoảng -90.0 đến 90.0 | Buoy.latitude | `@DecimalMin` / `@DecimalMax` |
| BR-004 | Kinh độ phải trong khoảng -180.0 đến 180.0 | Buoy.longitude | `@DecimalMin` / `@DecimalMax` |
| BR-006 | Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý | Buoy.range | `@DecimalMin("0.01")`, `@DecimalMax("100.0")` |
| BR-007 | Mô tả tối đa 1000 ký tự | Buoy.description | `@Size(max=1000)` |
| BR-008 | Mã code không thể thay đổi sau khi tạo | Buoy.code | Immutable trong UpdateBuoyRequest |
| BR-016 | Màu sắc tối đa 50 ký tự | Buoy.color | `@Size(max=50)` |
| BR-017 | Hình dáng tối đa 50 ký tự | Buoy.shape | `@Size(max=50)` |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | Buoy.lightCharacteristic | `@Size(max=100)` |

## Testing Strategy

(populated by qa stage)
