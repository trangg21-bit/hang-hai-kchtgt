---
id: F-080
name: Quản lý Nhà trạm phao - Tạo mới
slug: quan-ly-nha-tram-phao-tao-moi
module-id: M-004
status: proposed
classification: local
priority: medium
created: 2026-07-07T03:32:42Z
last-updated: 2026-07-21T02:49:00Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/nhatram/
  - src/test/java/com/hanghai/kchtg/nhatram/
---
# Feature: Quản lý Nhà trạm phao - Tạo mới

## Description

Cho phép cán bộ nghiệp vụ (operator) tạo mới một nhà trạm phao (buoy station building) trong hệ thống quản lý tài sản báo hiệu hàng hải. Nhà trạm phao là công trình phục vụ việc neo giữ, bảo trì và vận hành các phao tiêu báo hiệu hàng hải. Tính năng thu thập thông tin về mã số, tên gọi, vị trí địa lý (kinh độ, vĩ độ), loại phao tiêu (BuoyType: CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER), màu sắc, hình dạng, đặc tính ánh sáng, tầm nhìn xa, thông tin đơn vị quản lý, lịch kiểm tra gần nhất/kế tiếp, cùng thông tin mô tả chi tiết. Khi tạo, người dùng có thể lưu nháp (draft) hoặc gửi phê duyệt ngay (submit). Mỗi nhà trạm phao được gán trạng thái DRAFT hoặc PENDING_APPROVAL tùy vào hành động.

## Business Intent

Số hóa quy trình đăng ký nhà trạm phao mới phục vụ công tác quản lý tài sản báo hiệu hàng hải, giúp cán bộ nghiệp vụ tạo lập dữ liệu nhà trạm phao nhanh chóng và chính xác. Giảm sai sót so với nhập liệu thủ công, tạo nền tảng cho quy trình phê duyệt điện tử cấp L1 và L2 sau này.

## Flow Summary

Người dùng (operator) truy cập màn hình tạo mới nhà trạm phao và nhập các thông tin: mã (code), tên (name), loại phao (type), vị trí (latitude, longitude), màu sắc, hình dạng, đặc tính ánh sáng, tầm nhìn xa, mô tả, đơn vị quản lý, ngày kiểm tra gần nhất/kế tiếp. Hệ thống thực hiện validate dữ liệu đầu vào (bắt buộc: code, name, type, latitude, longitude, range; không bắt buộc: color, shape, lightCharacteristic, description, unitId, lastInspectionDate, nextInspectionDate). Nếu action="draft", hệ thống lưu với trạng thái DRAFT; nếu action="submit", lưu với trạng thái PENDING_APPROVAL và ghi nhật ký lịch sử hành động CREATE. Kết quả trả về là thông tin chi tiết nhà trạm phao vừa tạo (id tự sinh, code duy nhất, các trường đã nhập, trạng thái, thời gian tạo).

## Acceptance Criteria

- AC-01: Gửi request hợp lệ với đầy đủ các trường bắt buộc (code, name, type, latitude, longitude, range) và action="draft", hệ thống tạo thành công nhà trạm phao mới với trạng thái DRAFT, trả về HTTP 201.
- AC-02: Gửi request hợp lệ với action="submit", hệ thống tạo thành công với trạng thái PENDING_APPROVAL, đồng thời ghi lại bản ghi lịch sử với actionType=CREATE.
- AC-03: Gửi request với code đã tồn tại, hệ thống trả về lỗi vi phạm ràng buộc unique (HTTP 400/409).
- AC-04: Gửi request thiếu trường bắt buộc (vd: code hoặc name để trống), hệ thống trả về lỗi validation HTTP 400.
- AC-05: Gửi request với latitude ngoài khoảng [-90, 90] hoặc longitude ngoài [-180, 180], hệ thống trả về lỗi validation.

## In Scope

- Tạo mới nhà trạm phao với đầy đủ các trường thuộc tính
- Validation dữ liệu đầu vào theo business rules
- Hỗ trợ hai chế độ: lưu nháp (DRAFT) và gửi phê duyệt (PENDING_APPROVAL)
- Ghi lịch sử CREATE khi action=submit
- Mã (code) tự động kiểm tra unique

## Out of Scope

- Cập nhật/xóa nhà trạm phao (F-081, F-082)
- Phê duyệt nhà trạm phao (F-083)
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
| NhaTramPhao (nha_tram_phao) | Table | Lưu thông tin nhà trạm phao mới |
| BaseNhaTram | Superclass | Kế thừa các trường chung (id, code, name, latitude, longitude, description, unitId, isActive, status) |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký hành động CREATE |
| BuoyType | Enum | CARDINAL, SECTOR, SPECIAL, SAFE_WATER, ISOLATED_DANGER |
| NhaTramStatus | Enum | DRAFT, PENDING_APPROVAL, APPROVED_L1, APPROVED_L2, PUBLISHED, DELETED |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Mã (code) phải là duy nhất, không được để trống, tối đa 50 ký tự | NhaTramPhao.code | @Column(unique=true), @NotBlank, @Size(max=50) |
| BR-002 | Tên (name) không được để trống, tối đa 200 ký tự | NhaTramPhao.name | @NotBlank, @Size(max=200) |
| BR-003 | Vĩ độ (latitude) trong khoảng -90.0 đến 90.0 | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ (longitude) trong khoảng -180.0 đến 180.0 | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-006 | Tầm nhìn xa (range) phải từ 0.01 đến 100.0 hải lý | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-007 | Mô tả (description) tối đa 1000 ký tự | NhaTramPhao | @Size(max=1000) |
| BR-015 | Trạng thái khởi tạo mặc định là DRAFT hoặc PENDING_APPROVAL tùy action | NhaTramPhao | @Builder.Default status = DRAFT, action field |
| BR-016 | Màu sắc (color) tối đa 50 ký tự | NhaTramPhao | @Size(max=50) |
| BR-017 | Hình dáng (shape) tối đa 50 ký tự | NhaTramPhao | @Size(max=50) |
| BR-018 | Đặc tính ánh sáng (lightCharacteristic) tối đa 100 ký tự | NhaTramPhao | @Size(max=100) |

## Testing Strategy

(populated by qa stage)
