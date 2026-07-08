---
id: F-086
name: "Quản lý Nhà trạm đèn - Tạo mới"
slug: quan-ly-nha-tram-den-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Nhà trạm đèn - Tạo mới

## Description

Cho phép cán bộ nghiệp vụ (operator) tạo mới một nhà trạm đèn (beacon station building) trong hệ thống quản lý tài sản báo hiệu hàng hải. Nhà trạm đèn là công trình phục vụ việc lắp đặt, bảo trì và vận hành các đèn báo hiệu hàng hải (hải đăng, đèn báo, cọc tiêu). Tính năng thu thập thông tin về mã số, tên gọi, vị trí địa lý (kinh độ, vĩ độ), loại đèn (BeaconLightType: LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK), tầm hiệu lực ánh sáng (lightRange 0.01-60.0 hải lý), màu ánh sáng, đặc tính ánh sáng, tầm nhìn xa (range 0.01-100.0 hải lý), thông tin đơn vị quản lý, lịch bảo trì gần nhất/kế tiếp, cùng thông tin mô tả chi tiết. Khi tạo, người dùng có thể lưu nháp (draft) hoặc gửi phê duyệt ngay (submit). Mỗi nhà trạm đèn được gán trạng thái DRAFT hoặc PENDING_APPROVAL tùy hành động.

## Business Intent

Số hóa quy trình đăng ký nhà trạm đèn mới phục vụ công tác quản lý tài sản báo hiệu hàng hải, giúp cán bộ nghiệp vụ tạo lập dữ liệu nhà trạm đèn nhanh chóng và chính xác. Giảm sai sót so với nhập liệu thủ công, tạo nền tảng cho quy trình phê duyệt điện tử cấp L1 và L2 sau này.

## Flow Summary

Người dùng (operator) truy cập màn hình tạo mới nhà trạm đèn và nhập các thông tin: mã (code), tên (name), loại đèn (type), vị trí (latitude, longitude), tầm hiệu lực ánh sáng (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm nhìn xa (range), mô tả (description), đơn vị quản lý (unitId), ngày bảo trì gần nhất/kế tiếp (lastMaintenanceDate, nextMaintenanceDate). Hệ thống thực hiện validate dữ liệu đầu vào (bắt buộc: code, name, type, latitude, longitude, lightRange; không bắt buộc: lightColor, lightCharacteristic, range, description, unitId, lastMaintenanceDate, nextMaintenanceDate). Nếu action="draft", hệ thống lưu với trạng thái DRAFT; nếu action="submit", lưu với trạng thái PENDING_APPROVAL và ghi nhật ký lịch sử hành động CREATE. Kết quả trả về thông tin chi tiết nhà trạm đèn vừa tạo (id tự sinh, code duy nhất, các trường đã nhập, trạng thái, thời gian tạo).

## Acceptance Criteria

- AC-01: Gửi request hợp lệ với đầy đủ các trường bắt buộc (code, name, type, latitude, longitude, lightRange) và action="draft", hệ thống tạo thành công nhà trạm đèn mới với trạng thái DRAFT, trả về HTTP 201.
- AC-02: Gửi request hợp lệ với action="submit", hệ thống tạo thành công với trạng thái PENDING_APPROVAL, đồng thời ghi lại bản ghi lịch sử với actionType=CREATE.
- AC-03: Gửi request với code đã tồn tại, hệ thống trả về lỗi vi phạm ràng buộc unique (HTTP 400/409).
- AC-04: Gửi request thiếu trường bắt buộc (vd: code để trống hoặc lightRange null), hệ thống trả về lỗi validation HTTP 400.
- AC-05: Gửi request với lightRange ngoài khoảng [0.01, 60.0] hải lý, hệ thống trả về lỗi validation.

## In Scope

- Tạo mới nhà trạm đèn với đầy đủ các trường thuộc tính
- Validation dữ liệu đầu vào theo business rules
- Hỗ trợ hai chế độ: lưu nháp (DRAFT) và gửi phê duyệt (PENDING_APPROVAL)
- Ghi lịch sử CREATE khi action=submit
- Mã (code) tự động kiểm tra unique

## Out of Scope

- Cập nhật/xóa nhà trạm đèn (F-087, F-088)
- Phê duyệt nhà trạm đèn (F-089)
- Tích hợp GIS (M-007)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | CRUD | Toàn quyền thao tác |
| operator | CRUD | Có thể tạo mới, lưu nháp hoặc gửi phê duyệt |
| viewer | Read | Không có quyền tạo mới |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramDen (nha_tram_den) | Table | Lưu thông tin nhà trạm đèn mới |
| BaseNhaTram | Superclass | Kế thừa các trường chung (id, code, name, latitude, longitude, description, unitId, isActive, status) |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký hành động CREATE |
| BeaconLightType | Enum | LIGHTHOUSE, BEACON_LIGHT, BEACON_MARK |
| NhaTramStatus | Enum | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | NhaTramDen.code | @Column(unique=true), @NotBlank, @Size(max=50) |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | NhaTramDen.name | @NotBlank, @Size(max=200) |
| BR-003 | Vĩ độ (latitude) trong khoảng -90.0 đến 90.0 | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ (longitude) trong khoảng -180.0 đến 180.0 | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-005 | Tầm hiệu lực ánh sáng (lightRange) phải từ 0.01 đến 60.0 hải lý | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-006 | Tầm nhìn xa (range) phải từ 0.01 đến 100.0 hải lý | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | NhaTramDen | @Size(max=1000) |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT hoặc PENDING_APPROVAL tùy action | NhaTramDen | @Builder.Default status = DRAFT, action field |
| BR-019 | Màu ánh sáng (lightColor) tối đa 50 ký tự | NhaTramDen | @Size(max=50) |
| BR-018 | Đặc tính ánh sáng (lightCharacteristic) tối đa 100 ký tự | NhaTramDen | @Size(max=100) |

## Testing Strategy

(populated by qa stage)
