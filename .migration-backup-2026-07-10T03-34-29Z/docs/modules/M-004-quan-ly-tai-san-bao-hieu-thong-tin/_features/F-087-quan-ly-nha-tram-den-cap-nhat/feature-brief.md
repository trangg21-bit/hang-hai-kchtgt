---
id: F-087
name: "Quản lý Nhà trạm đèn - Cập nhật"
slug: quan-ly-nha-tram-den-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Nhà trạm đèn - Cập nhật

## Description

Cho phép cán bộ nghiệp vụ cập nhật thông tin của một nhà trạm đèn đã tồn tại trong hệ thống. Tính năng hỗ trợ chỉnh sửa các trường như tên (name), vị trí địa lý (latitude, longitude), tầm hiệu lực ánh sáng (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm nhìn xa (range), mô tả (description), đơn vị quản lý (unitId), các ngày bảo trì (lastMaintenanceDate, nextMaintenanceDate), và trạng thái hoạt động (isActive). Mã (code) là trường bất biến sau khi tạo. Hệ thống kiểm tra quyền sở hữu dữ liệu và trạng thái hiện tại của nhà trạm đèn trước khi cho phép cập nhật, đồng thời ghi nhật ký lịch sử hành động UPDATE với thông tin trường cũ/mới.

## Business Intent

Đảm bảo dữ liệu nhà trạm đèn luôn được cập nhật chính xác theo thực tế vận hành, phục vụ công tác quản lý tài sản và lập kế hoạch bảo trì đèn báo hiệu hàng hải. Cho phép điều chỉnh thông tin khi có thay đổi về vị trí, thông số kỹ thuật ánh sáng, hoặc lịch bảo trì.

## Flow Summary

Người dùng truy cập vào nhà trạm đèn cần sửa (có id), hệ thống hiển thị thông tin hiện tại. Người dùng thay đổi các trường mong muốn và gửi request PUT đến endpoint /api/v1/nhatram/den/{id}. Hệ thống kiểm tra id có tồn tại không, kiểm tra trạng thái (chỉ cho phép cập nhật nếu trạng thái là DRAFT hoặc PENDING_APPROVAL), sau đó cập nhật các trường được gửi (chỉ ghi đè trường có giá trị). Code không thể thay đổi sau khi tạo. Hệ thống ghi nhật ký lịch sử hành động UPDATE. Kết quả trả về thông tin nhà trạm đèn sau khi đã cập nhật.

## Acceptance Criteria

- AC-01: Gửi request PUT hợp lệ với id tồn tại, nhà trạm đèn ở trạng thái DRAFT, hệ thống cập nhật thành công và trả về HTTP 200 kèm thông tin đã cập nhật.
- AC-02: Gửi request cập nhật code (trường immutable), hệ thống bỏ qua hoặc từ chối thay đổi.
- AC-03: Gửi request với id không tồn tại, hệ thống trả về HTTP 404.
- AC-04: Gửi request với nhà trạm đèn đã PUBLISHED, hệ thống từ chối cập nhật và trả về lỗi HTTP 400.
- AC-05: Khi cập nhật thành công, hệ thống ghi bản ghi lịch sử với actionType=UPDATE.

## In Scope

- Cập nhật các trường thuộc tính của nhà trạm đèn hiện có
- Kiểm tra id tồn tại
- Kiểm tra trạng thái cho phép cập nhật
- Bất biến code
- Ghi lịch sử UPDATE

## Out of Scope

- Tạo mới nhà trạm đèn (F-086)
- Xóa nhà trạm đèn (F-088)
- Phê duyệt nhà trạm đèn (F-089)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | CRUD | Có thể cập nhật mọi nhà trạm đèn |
| operator | CRUD | Có thể cập nhật nhà trạm đèn do mình tạo |
| viewer | Read | Không có quyền cập nhật |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramDen (nha_tram_den) | Table | Đọc và cập nhật thông tin nhà trạm đèn |
| BaseNhaTram | Superclass | Kế thừa trường id và các trường chung |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký hành động UPDATE |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-008 | Mã code không thể thay đổi sau khi tạo (immutable) | NhaTramDen.code | UpdateNhaTramDenRequest (code excluded) |
| BR-002 | Tên (name) tối đa 200 ký tự | NhaTramDen.name | @Size(max=200) |
| BR-003 | Vĩ độ trong khoảng -90.0 đến 90.0 | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ trong khoảng -180.0 đến 180.0 | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-005 | Tầm hiệu lực ánh sáng 0.01-60.0 hải lý | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-006 | Tầm nhìn xa 0.01-100.0 hải lý | NhaTramDen | @DecimalMin, @DecimalMax |
| BR-007 | Mô tả tối đa 1000 ký tự | NhaTramDen | @Size(max=1000) |
| BR-015 | Chỉ cập nhật được khi trạng thái là DRAFT hoặc PENDING_APPROVAL | NhaTramDen.status | Service validation logic |
| BR-019 | Màu ánh sáng tối đa 50 ký tự | NhaTramDen | @Size(max=50) |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | NhaTramDen | @Size(max=100) |

## Testing Strategy

(populated by qa stage)
