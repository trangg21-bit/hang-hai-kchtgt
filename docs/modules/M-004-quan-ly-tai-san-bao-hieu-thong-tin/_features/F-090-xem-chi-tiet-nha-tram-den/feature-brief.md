---
id: F-090
name: "Xem chi tiết Nhà trạm đèn"
slug: xem-chi-tiet-nha-tram-den
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Xem chi tiết Nhà trạm đèn

## Description

Cho phép người dùng xem thông tin chi tiết của một nhà trạm đèn cụ thể theo mã định danh (id). Tính năng hiển thị toàn bộ các trường thông tin của nhà trạm đèn bao gồm: mã (code), tên (name), loại đèn (type), vị trí địa lý (latitude, longitude), tầm hiệu lực ánh sáng (lightRange), màu ánh sáng (lightColor), đặc tính ánh sáng (lightCharacteristic), tầm nhìn xa (range), mô tả (description), đơn vị quản lý (unitId), ngày bảo trì gần nhất (lastMaintenanceDate) và kế tiếp (nextMaintenanceDate), trạng thái hoạt động (isActive), trạng thái vòng đời (status), trạng thái phê duyệt (approvalStatus, approvalLevel, approvedBy, approvedDate), lý do từ chối (rejectionReason) và thời gian tạo/cập nhật (createdAt, updatedAt). Chỉ hiển thị các nhà trạm đèn chưa bị xóa (deletedAt IS NULL).

## Business Intent

Cung cấp giao diện tra cứu thông tin đầy đủ về một nhà trạm đèn phục vụ công tác quản lý tài sản báo hiệu hàng hải. Giúp cán bộ nghiệp vụ, phê duyệt viên, và người xem có cái nhìn tổng quan về tình trạng, vị trí, thông số kỹ thuật ánh sáng và lịch bảo trì của nhà trạm đèn.

## Flow Summary

Người dùng gửi request GET đến endpoint /api/v1/nhatram/den/{id} với id của nhà trạm đèn cần xem. Hệ thống tìm kiếm trong cơ sở dữ liệu theo id, đảm bảo bản ghi chưa bị soft-delete (deletedAt IS NULL). Nếu tìm thấy, hệ thống trả về đối tượng NhaTramDenResponse chứa toàn bộ thông tin chi tiết (22+ trường). Nếu không tìm thấy (id không tồn tại hoặc đã bị xóa), trả về HTTP 404. Tính năng này hỗ trợ tất cả các vai trò (kể cả viewer) và không yêu cầu quyền đặc biệt ngoài quyền đọc.

## Acceptance Criteria

- AC-01: Gửi request GET với id hợp lệ của nhà trạm đèn chưa bị xóa, hệ thống trả về HTTP 200 kèm toàn bộ thông tin chi tiết.
- AC-02: Gửi request GET với id không tồn tại, hệ thống trả về HTTP 404.
- AC-03: Gửi request GET với id của nhà trạm đèn đã bị soft-delete, hệ thống trả về HTTP 404.
- AC-04: Người dùng với vai trò viewer (chỉ đọc) có thể truy cập được endpoint này.

## In Scope

- Xem chi tiết nhà trạm đèn theo id
- Kiểm tra id tồn tại
- Tự động loại trừ bản ghi đã soft-delete
- Phân quyền đọc cho tất cả roles

## Out of Scope

- Danh sách tất cả nhà trạm đèn (findAll/search)
- Lịch sử thay đổi (F-091)
- Phê duyệt nhà trạm đèn (F-089)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | Read | Có thể xem mọi nhà trạm đèn |
| operator | Read | Có thể xem nhà trạm đèn |
| approver_L1 | Read | Có thể xem trước khi phê duyệt |
| approver_L2 | Read | Có thể xem trước khi phê duyệt |
| viewer | Read | Chỉ đọc thông tin cơ bản |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramDen (nha_tram_den) | Table | Truy vấn thông tin chi tiết |
| BaseNhaTram | Superclass | Các trường chung cho response |
| NhaTramDenResponse | DTO | Đóng gói dữ liệu trả về |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-009 | Chỉ hiển thị bản ghi có deleted_at IS NULL | NhaTramDen | @SQLRestriction("deleted_at IS NULL") |

## Testing Strategy

(populated by qa stage)
