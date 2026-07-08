---
id: F-074
name: "Quản lý Phao tiêu - Tạo mới"
slug: quan-ly-phao-tieu-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:32Z"
last-updated: "2026-07-07T03:32:32Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Phao tiêu - Tạo mới

## Description

Cho phép người dùng nhập thông tin một phao tiêu mới vào hệ thống, bao gồm các trường: mã code (duy nhất trong toàn bộ beacon_light và buoy), tên, loại phao (CARDINAL / SECTOR / SPECIAL / SAFE_WATER / ISOLATED_DANGER), tọa độ (kinh độ, vĩ độ WGS84), màu sắc, hình dáng, đặc tính ánh sáng, tầm nhìn xa (hải lý), mô tả, đơn vị quản lý, ngày kiểm tra gần nhất và kế tiếp, và trạng thái hoạt động. Hệ thống kiểm tra tính duy nhất của mã code, validate tọa độ và ngày kiểm tra, tạo bản ghi với trạng thái DRAFT hoặc PENDING_APPROVAL.

## Business Intent

Xây dựng cơ sở dữ liệu tập trung về các phao tiêu (1.452 phao tiêu trên toàn quốc) phục vụ công tác quản lý tài sản báo hiệu hàng hải. Đảm bảo mỗi phao tiêu có thông tin định danh duy nhất và tuân thủ quy chuẩn kỹ thuật IALA trước khi đưa vào vận hành nhằm đảm bảo an toàn hàng hải.

## Flow Summary

Người dùng truy cập màn hình tạo mới phao tiêu, điền form thông tin với các trường bắt buộc (code, name, type, latitude, longitude, range) và tùy chọn (color, shape, lightCharacteristic, description, unitId, lastInspectionDate, nextInspectionDate, isActive). Hệ thống kiểm tra mã code không trùng với Buoy hay BeaconLight, validate tọa độ WGS84, tầm nhìn xa 0.01–100.0 hải lý và ngày kiểm tra hợp lệ. Người dùng có thể lưu nháp hoặc gửi phê duyệt ngay (action = "submit"). Khi tạo thành công, hệ thống ghi lịch sử CREATE và gửi thông báo phê duyệt.

## Acceptance Criteria

- AC-01: Người dùng điền đầy đủ thông tin bắt buộc và tạo thành công phao tiêu mới — hệ thống trả về HTTP 201.
- AC-02: Hệ thống từ chối tạo phao tiêu mới nếu mã code đã tồn tại trong bảng buoy hoặc beacon_light.
- AC-03: Hệ thống từ chối nếu tọa độ không hợp lệ (kinh độ ngoài -180~180 hoặc vĩ độ ngoài -90~90).
- AC-04: Hệ thống từ chối nếu tầm nhìn xa (range) ngoài khoảng 0.01–100.0 hải lý.
- AC-05: Người dùng có thể chọn gửi phê duyệt ngay sau khi tạo (action="submit") — phao tiêu được tạo với status = PENDING_APPROVAL.
- AC-06: Sau khi tạo thành công, lịch sử được ghi với actionType = CREATE và beaconType = BUOY.

## In Scope

(populated by ba stage)

## Out of Scope

(populated by ba stage)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền tạo mới phao tiêu |
| operator | create | Có quyền tạo mới phao tiêu |
| approver_L1 | none | Không có quyền tạo mới |
| approver_L2 | none | Không có quyền tạo mới |
| viewer | none | Không có quyền tạo mới |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| Buoy | buoy | Thực thể chính, lưu toàn bộ thông tin phao tiêu |
| BeaconHistory | beacon_history | Ghi lại lịch sử thao tác CREATE |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code phải là duy nhất, không được để trống, tối đa 50 ký tự | Buoy.code | `@NotBlank`, `@Column(unique=true)` |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | Buoy.name | `@NotBlank`, `@Size(max=200)` |
| BR-003 | Vĩ độ phải trong khoảng -90.0 đến 90.0 | Buoy.latitude | `@DecimalMin` / `@DecimalMax` |
| BR-004 | Kinh độ phải trong khoảng -180.0 đến 180.0 | Buoy.longitude | `@DecimalMin` / `@DecimalMax` |
| BR-006 | Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý | Buoy.range | `@DecimalMin("0.01")`, `@DecimalMax("100.0")` |
| BR-007 | Mô tả tối đa 1000 ký tự | Buoy.description | `@Size(max=1000)` |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | Buoy.status | `@Builder.Default status = DRAFT` |
| BR-016 | Màu sắc tối đa 50 ký tự | Buoy.color | `@Size(max=50)` |
| BR-017 | Hình dáng tối đa 50 ký tự | Buoy.shape | `@Size(max=50)` |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | Buoy.lightCharacteristic | `@Size(max=100)` |

## Testing Strategy

(populated by qa stage)
