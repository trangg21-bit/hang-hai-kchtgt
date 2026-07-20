---
id: F-084
name: "Xem chi tiết Nhà trạm phao"
slug: xem-chi-tiet-nha-tram-phao
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:42Z"
last-updated: "2026-07-07T03:32:42Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Nhà trạm phao

## Description

Cho phép người dùng xem thông tin chi tiết của một nhà trạm phao cụ thể theo mã định danh (id). Tính năng hiển thị toàn bộ các trường thông tin của nhà trạm phao bao gồm: mã (code), tên (name), loại phao (type), vị trí địa lý (latitude, longitude), màu sắc (color), hình dạng (shape), đặc tính ánh sáng (lightCharacteristic), tầm nhìn xa (range), mô tả (description), đơn vị quản lý (unitId), ngày kiểm tra gần nhất (lastInspectionDate) và kế tiếp (nextInspectionDate), trạng thái hoạt động (isActive), trạng thái vòng đời (status), trạng thái phê duyệt (approvalStatus, approvalLevel, approvedBy, approvedDate), lý do từ chối (rejectionReason) và thời gian tạo/cập nhật (createdAt, updatedAt). Chỉ hiển thị các nhà trạm phao chưa bị xóa (deletedAt IS NULL).

## Business Intent

Cung cấp giao diện tra cứu thông tin đầy đủ về một nhà trạm phao phục vụ công tác quản lý tài sản báo hiệu hàng hải. Giúp cán bộ nghiệp vụ, phê duyệt viên, và người xem có cái nhìn tổng quan về tình trạng, vị trí, lịch kiểm tra của nhà trạm phao.

## Flow Summary

Người dùng gửi request GET đến endpoint /api/v1/nhatram/phao/{id} với id của nhà trạm phao cần xem. Hệ thống tìm kiếm trong cơ sở dữ liệu theo id, đảm bảo bản ghi chưa bị soft-delete (deletedAt IS NULL). Nếu tìm thấy, hệ thống trả về đối tượng NhaTramPhaoResponse chứa toàn bộ thông tin chi tiết. Nếu không tìm thấy (id không tồn tại hoặc đã bị xóa), trả về HTTP 404. Tính năng này hỗ trợ tất cả các vai trò (kể cả viewer) và không yêu cầu quyền đặc biệt ngoài quyền đọc.

## Acceptance Criteria

- AC-01: Gửi request GET với id hợp lệ của nhà trạm phao chưa bị xóa, hệ thống trả về HTTP 200 kèm toàn bộ thông tin chi tiết của nhà trạm phao.
- AC-02: Gửi request GET với id không tồn tại, hệ thống trả về HTTP 404.
- AC-03: Gửi request GET với id của nhà trạm phao đã bị soft-delete, hệ thống trả về HTTP 404 (không hiển thị dữ liệu đã xóa).
- AC-04: Người dùng với vai trò viewer (chỉ đọc) có thể truy cập được endpoint này.

## In Scope

- Xem chi tiết nhà trạm phao theo id
- Kiểm tra id tồn tại
- Tự động loại trừ bản ghi đã soft-delete
- Phân quyền đọc cho tất cả roles

## Out of Scope

- Danh sách tất cả nhà trạm phao (findAll/search) — feature riêng
- Lịch sử thay đổi của nhà trạm phao (F-085)
- Phê duyệt nhà trạm phao (F-083)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | Read | Có thể xem mọi nhà trạm phao |
| operator | Read | Có thể xem nhà trạm phao |
| approver_L1 | Read | Có thể xem trước khi phê duyệt |
| approver_L2 | Read | Có thể xem trước khi phê duyệt |
| viewer | Read | Chỉ đọc thông tin cơ bản |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramPhao (nha_tram_phao) | Table | Truy vấn thông tin chi tiết |
| BaseNhaTram | Superclass | Các trường chung cho response |
| NhaTramPhaoResponse | DTO | Đóng gói dữ liệu trả về |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-009 | Chỉ hiển thị bản ghi có deleted_at IS NULL | NhaTramPhao | @SQLRestriction("deleted_at IS NULL") |

## Testing Strategy

(populated by qa stage)
