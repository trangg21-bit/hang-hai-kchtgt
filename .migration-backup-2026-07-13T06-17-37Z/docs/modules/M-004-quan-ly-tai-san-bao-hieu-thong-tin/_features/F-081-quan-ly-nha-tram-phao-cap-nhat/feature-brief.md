---
id: F-081
name: "Quản lý Nhà trạm phao - Cập nhật"
slug: quan-ly-nha-tram-phao-cap-nhat
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:42Z"
last-updated: "2026-07-07T03:32:42Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Nhà trạm phao - Cập nhật

## Description

Cho phép cán bộ nghiệp vụ cập nhật thông tin của một nhà trạm phao đã tồn tại trong hệ thống. Tính năng hỗ trợ chỉnh sửa các trường như tên (name), vị trí địa lý (latitude, longitude), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm nhìn xa (range), mô tả (description), đơn vị quản lý (unitId), các ngày kiểm tra (lastInspectionDate, nextInspectionDate), và trạng thái hoạt động (isActive). Lưu ý rằng mã (code) và loại phao (type) là các trường bất biến sau khi tạo. Hệ thống kiểm tra quyền sở hữu dữ liệu và trạng thái hiện tại của nhà trạm phao trước khi cho phép cập nhật, đồng thời ghi nhật ký lịch sử hành động UPDATE.

## Business Intent

Đảm bảo dữ liệu nhà trạm phao luôn được cập nhật chính xác theo thực tế vận hành, phục vụ công tác quản lý tài sản và lập kế hoạch bảo trì. Cho phép điều chỉnh thông tin khi có thay đổi về vị trí, tình trạng kỹ thuật hoặc lịch kiểm tra của nhà trạm phao.

## Flow Summary

Người dùng truy cập vào nhà trạm phao cần sửa (có id), hệ thống hiển thị thông tin hiện tại. Người dùng thay đổi các trường mong muốn và gửi request PUT đến endpoint /api/v1/nhatram/phao/{id}. Hệ thống kiểm tra id có tồn tại không, kiểm tra trạng thái (chỉ cho phép cập nhật nếu trạng thái là DRAFT hoặc PENDING_APPROVAL), sau đó cập nhật các trường được gửi (chỉ ghi đè trường có giá trị). Lưu ý: code và type không thể thay đổi sau khi tạo. Hệ thống ghi nhật ký lịch sử hành động UPDATE với thông tin trường cũ/mới. Kết quả trả về thông tin nhà trạm phao sau khi đã cập nhật và thời gian updatedAt.

## Acceptance Criteria

- AC-01: Gửi request PUT hợp lệ với id tồn tại, nhà trạm phao ở trạng thái DRAFT, hệ thống cập nhật thành công và trả về HTTP 200 kèm thông tin đã cập nhật.
- AC-02: Gửi request cập nhật code hoặc type, hệ thống bỏ qua hoặc từ chối thay đổi (hai trường này immutable sau khi tạo).
- AC-03: Gửi request với id không tồn tại, hệ thống trả về HTTP 404 (Not Found).
- AC-04: Gửi request với nhà trạm phao đã được PUBLISHED, hệ thống từ chối cập nhật và trả về lỗi HTTP 400.
- AC-05: Khi cập nhật thành công, hệ thống ghi một bản ghi lịch sử mới với actionType=UPDATE, ghi lại changedField/previousValue/newValue.

## In Scope

- Cập nhật các trường thuộc tính của nhà trạm phao hiện có
- Kiểm tra id tồn tại
- Kiểm tra trạng thái cho phép cập nhật
- Bất biến code và type
- Ghi lịch sử UPDATE

## Out of Scope

- Tạo mới nhà trạm phao (F-080)
- Xóa nhà trạm phao (F-082)
- Phê duyệt nhà trạm phao (F-083)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | CRUD | Có thể cập nhật mọi nhà trạm phao |
| operator | CRUD | Có thể cập nhật nhà trạm phao do mình tạo |
| viewer | Read | Không có quyền cập nhật |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramPhao (nha_tram_phao) | Table | Đọc và cập nhật thông tin nhà trạm phao |
| BaseNhaTram | Superclass | Kế thừa trường id và các trường chung |
| NhaTramHistory (nha_tram_history) | Table | Ghi nhật ký hành động UPDATE |
| NhaTramStatus | Enum | Kiểm tra trạng thái cho phép cập nhật |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-008 | Mã code không thể thay đổi sau khi tạo (immutable) | NhaTramPhao.code | UpdateNhaTramPhaoRequest (code excluded) |
| BR-002 | Tên (name) tối đa 200 ký tự | NhaTramPhao.name | @Size(max=200) |
| BR-003 | Vĩ độ trong khoảng -90.0 đến 90.0 | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-004 | Kinh độ trong khoảng -180.0 đến 180.0 | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-006 | Tầm nhìn xa phải từ 0.01 đến 100.0 hải lý | NhaTramPhao | @DecimalMin, @DecimalMax |
| BR-007 | Mô tả tối đa 1000 ký tự | NhaTramPhao | @Size(max=1000) |
| BR-015 | Chỉ cập nhật được khi trạng thái là DRAFT hoặc PENDING_APPROVAL | NhaTramPhao.status | Service validation logic |
| BR-016 | Màu sắc tối đa 50 ký tự | NhaTramPhao | @Size(max=50) |
| BR-017 | Hình dáng tối đa 50 ký tự | NhaTramPhao | @Size(max=50) |
| BR-018 | Đặc tính ánh sáng tối đa 100 ký tự | NhaTramPhao | @Size(max=100) |

## Testing Strategy

(populated by qa stage)
