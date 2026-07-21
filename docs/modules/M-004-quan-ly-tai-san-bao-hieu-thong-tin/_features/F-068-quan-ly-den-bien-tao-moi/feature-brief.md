---
id: F-068
name: Quản lý Đèn biển - Tạo mới
slug: quan-ly-den-bien-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:17Z
last-updated: 2026-07-21T02:49:04Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/beacon/
  - src/test/java/com/hanghai/kchtg/beacon/
---
# Feature: Quản lý Đèn biển - Tạo mới

## Description

Cho phép người dùng nhập thông tin một đèn biển mới vào hệ thống, bao gồm các trường: mã code (duy nhất), tên, loại đèn (LIGHTHOUSE / BEACON_LIGHT / BEACON_MARK), tọa độ (kinh độ, vĩ độ theo chuẩn WGS84), tầm hiệu lực ánh sáng (hải lý), màu ánh sáng, đặc tính ánh sáng, tầm nhìn xa (hải lý), mô tả, đơn vị quản lý, ngày bảo trì gần nhất và kế tiếp, và trạng thái hoạt động. Hệ thống tự động kiểm tra tính duy nhất của mã code, validate tọa độ và các giá trị kỹ thuật, sau đó tạo bản ghi với trạng thái DRAFT hoặc PENDING_APPROVAL nếu người dùng chọn gửi phê duyệt ngay.

## Business Intent

Xây dựng cơ sở dữ liệu tập trung về các đèn biển (94 đèn biển trên toàn quốc) phục vụ công tác quản lý tài sản báo hiệu hàng hải. Đảm bảo mỗi đèn biển có thông tin định danh duy nhất, tuân thủ quy chuẩn kỹ thuật (IALA, WGS84) và có quy trình kiểm soát chất lượng trước khi đưa vào vận hành chính thức.

## Flow Summary

Người dùng truy cập màn hình tạo mới đèn biển, điền form thông tin với các trường bắt buộc (code, name, type, latitude, longitude, lightRange) và tùy chọn (lightColor, lightCharacteristic, range, description, unitId, lastMaintenanceDate, nextMaintenanceDate, isActive). Hệ thống kiểm tra mã code không trùng với BeaconLight hay Buoy, validate tọa độ WGS84, tầm hiệu lực 0.01–60.0 hải lý và ngày bảo trì hợp lệ. Người dùng có thể lưu nháp (action mặc định) hoặc gửi phê duyệt ngay (action = "submit"). Khi tạo thành công, hệ thống ghi lịch sử CREATE và gửi thông báo phê duyệt nếu cần.

## Acceptance Criteria

- AC-01: Người dùng điền đầy đủ thông tin bắt buộc và tạo thành công đèn biển mới — hệ thống trả về HTTP 201 và thông tin đèn biển vừa tạo.
- AC-02: Hệ thống từ chối tạo đèn biển mới nếu mã code đã tồn tại trong bảng beacon_light hoặc buoy — trả về lỗi "Mã đã tồn tại".
- AC-03: Hệ thống từ chối nếu tọa độ không hợp lệ (kinh độ ngoài khoảng -180~180 hoặc vĩ độ ngoài -90~90) — trả về lỗi validate.
- AC-04: Hệ thống từ chối nếu tầm hiệu lực ánh sáng (lightRange) ngoài khoảng 0.01–60.0 hải lý — trả về lỗi validate.
- AC-05: Người dùng có thể gửi phê duyệt ngay sau tạo (action="submit") — đèn biển được tạo với status = PENDING_APPROVAL.
- AC-06: Sau khi tạo thành công, lịch sử được ghi với actionType = CREATE và beaconType = BEACON_LIGHT.

## In Scope

- Tạo mới đèn biển với đầy đủ các trường thuộc tính (code, name, type, latitude, longitude, lightRange, lightColor, lightCharacteristic, range, description, unitId, lastMaintenanceDate, nextMaintenanceDate, isActive)
- Validation dữ liệu đầu vào theo business rules: kiểm tra mã code duy nhất (không trùng beacon_light hay buoy), tọa độ WGS84 (latitude -90~90, longitude -180~180), tầm hiệu lực ánh sáng (0.01~60.0 hải lý), tầm nhìn xa (0.01~100.0 hải lý)
- Hỗ trợ hai chế độ tạo: lưu nháp (action="draft" → status=DRAFT) và gửi phê duyệt ngay (action="submit" → status=PENDING_APPROVAL)
- Ghi lịch sử CREATE vào bảng beacon_history khi action=submit
- Mã (code) tự động kiểm tra unique trên cả hai bảng beacon_light và buoy
- Trả về HTTP 201 kèm thông tin đèn biển vừa tạo (BeaconLightResponse)

## Out of Scope

- Cập nhật/xóa đèn biển (F-069, F-070)
- Phê duyệt đèn biển (F-071, F-072)
- Quản lý phao tiêu (Buoy - F-074 đến F-079)
- Tích hợp GIS với M-007 (PointObjectSyncService)
- Xem lịch sử thay đổi (F-073)

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | full_access | Có quyền tạo mới đèn biển |
| operator | create | Có quyền tạo mới đèn biển |
| approver_L1 | none | Không có quyền tạo mới |
| approver_L2 | none | Không có quyền tạo mới |
| viewer | none | Không có quyền tạo mới |

## Entities

| Entity | Table | Role |
|--------|-------|------|
| BeaconLight | beacon_light | Thực thể chính, lưu toàn bộ thông tin đèn biển |
| BeaconHistory | beacon_history | Ghi lại lịch sử thao tác CREATE |

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-001 | Mã code phải là duy nhất, không được để trống, tối đa 50 ký tự | BeaconLight.code | `@NotBlank`, `@Column(unique=true)` |
| BR-002 | Tên không được để trống, tối đa 200 ký tự | BeaconLight.name | `@NotBlank`, `@Size(max=200)` |
| BR-003 | Vĩ độ phải trong khoảng -90.0 đến 90.0 | BeaconLight.latitude | `@DecimalMin` / `@DecimalMax` |
| BR-004 | Kinh độ phải trong khoảng -180.0 đến 180.0 | BeaconLight.longitude | `@DecimalMin` / `@DecimalMax` |
| BR-005 | Tầm hiệu lực ánh sáng phải từ 0.01 đến 60.0 hải lý | BeaconLight.lightRange | `@DecimalMin("0.01")`, `@DecimalMax("60.0")` |
| BR-006 | Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý | BeaconLight.range | `@DecimalMin("0.01")`, `@DecimalMax("100.0")` |
| BR-007 | Mô tả tối đa 1000 ký tự | BeaconLight.description | `@Size(max=1000)` |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT | BeaconLight.status | `@Builder.Default status = DRAFT` |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | BeaconLight.lightCharacteristic | `@Size(max=100)` |
| BR-019 | Màu ánh sáng tối đa 50 ký tự | BeaconLight.lightColor | `@Size(max=50)` |

## Testing Strategy

(populated by qa stage)
