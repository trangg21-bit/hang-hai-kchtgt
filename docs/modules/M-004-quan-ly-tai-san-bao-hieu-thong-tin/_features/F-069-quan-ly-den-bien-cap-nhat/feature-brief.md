---
id: F-069
name: "Quản lý Đèn biển - Cập nhật"
slug: quan-ly-den-bien-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:17Z"
last-updated: "2026-07-07T03:32:17Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đèn biển - Cập nhật

## Description

Cho phép người dùng cập nhật thông tin của một đèn biển đã tồn tại. Các trường có thể thay đổi bao gồm: tên, loại đèn, tọa độ, tầm hiệu lực ánh sáng, màu ánh sáng, đặc tính ánh sáng, tầm nhìn xa, mô tả, đơn vị quản lý, ngày bảo trì và trạng thái hoạt động. Mã code không thể thay đổi sau khi tạo. Nếu đèn biển đã ở trạng thái đã phê duyệt (APPROVED_L1 / APPROVED_L2 / PUBLISHED), hệ thống tự động đưa về trạng thái DRAFT và yêu cầu phê duyệt lại. Hệ thống ghi lại lịch sử các thay đổi để truy vết.

## Business Intent

Đảm bảo thông tin đèn biển luôn được cập nhật kịp thời khi có thay đổi về thông số kỹ thuật, lịch bảo trì hoặc thông tin quản lý. Việc tự động đưa về DRAFT khi sửa đèn biển đã được phê duyệt đảm bảo mọi thay đổi đều trải qua quy trình kiểm duyệt trước khi có hiệu lực.

## Flow Summary

Người dùng chọn một đèn biển từ danh sách và nhấn "Sửa". Hệ thống hiển thị form với dữ liệu hiện tại. Người dùng thay đổi các trường mong muốn và gửi yêu cầu. Hệ thống kiểm tra entity tồn tại và chưa bị xóa, validate tọa độ và giá trị kỹ thuật, kiểm tra loại đèn không thay đổi nếu đã phê duyệt L2/PUBLISHED. Nếu entity đang ở trạng thái đã phê duyệt, tự động hạ về DRAFT để yêu cầu phê duyệt lại. Lịch sử UPDATE được ghi với danh sách các trường thay đổi.

## Acceptance Criteria

- AC-01: Cập nhật thành công các trường thông tin của đèn biển — hệ thống trả về HTTP 200 và thông tin đã cập nhật.
- AC-02: Hệ thống từ chối cập nhật nếu mã code được gửi trong request — code là trường immutable (BR-008).
- AC-03: Hệ thống từ chối thay đổi loại đèn (type) nếu đèn biển đã ở trạng thái APPROVED_L2 hoặc PUBLISHED.
- AC-04: Nếu đèn biển đã được phê duyệt (APPROVED_L1/PUBLISHED), sau khi cập nhật status tự động chuyển về DRAFT và approvalStatus về PENDING.
- AC-05: Hệ thống từ chối cập nhật nếu đèn biển đã bị xóa (status = DELETED).
- AC-06: Sau khi cập nhật, lịch sử được ghi với actionType = UPDATE và danh sách các trường thay đổi.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền cập nhật mọi đèn biển |
| operator | update | Có quyền cập nhật đèn biển do mình tạo |
| approver_L1 | none | Không có quyền cập nhật |
| approver_L2 | none | Không có quyền cập nhật |
| viewer | none | Không có quyền cập nhật |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconLight | beacon_light | Thực thể chính, cập nhật thông tin |
| BeaconHistory | beacon_history | Ghi lại lịch sử thay đổi UPDATE |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code là duy nhất, không thể thay đổi sau khi tạo (immutable) | BeaconLight.code | `@Column(unique=true)`, immutable trong UpdateBeaconLightRequest |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | BeaconLight.name | `@NotBlank`, `@Size(max=200)` |
| BR-003 | Vĩ độ phải trong khoảng -90.0 đến 90.0 | BeaconLight.latitude | `@DecimalMin` / `@DecimalMax` |
| BR-004 | Kinh độ phải trong khoảng -180.0 đến 180.0 | BeaconLight.longitude | `@DecimalMin` / `@DecimalMax` |
| BR-005 | Tầm hiệu lực ánh sáng phải từ 0.01 đến 60.0 hải lý | BeaconLight.lightRange | `@DecimalMin("0.01")`, `@DecimalMax("60.0")` |
| BR-006 | Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý | BeaconLight.range | `@DecimalMin("0.01")`, `@DecimalMax("100.0")` |
| BR-007 | Mô tả tối đa 1000 ký tự | BeaconLight.description | `@Size(max=1000)` |
| BR-008 | Mã code không thể thay đổi sau khi tạo | BeaconLight.code | Immutable trong UpdateBeaconLightRequest |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | BeaconLight.lightCharacteristic | `@Size(max=100)` |
| BR-019 | Màu ánh sáng tối đa 50 ký tự | BeaconLight.lightColor | `@Size(max=50)` |

## Testing Strategy

(populated by qa stage)
