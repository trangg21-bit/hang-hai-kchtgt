---
id: F-097
name: "Quản lý Đài TTDH - Lịch sử"
slug: quan-ly-dai-ttdh-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:57Z"
last-updated: "2026-07-07T03:32:57Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TTDH - Lịch sử

## Description

Tính năng cho phép người dùng tra cứu lịch sử thay đổi của một Đài Thông tin Duyên hải (VTS) cụ thể. Hệ thống ghi nhận mọi thao tác tác động đến bản ghi bao gồm: tạo mới (CREATE), cập nhật (UPDATE), xóa (SOFT_DELETE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2) và từ chối (REJECT). Mỗi bản ghi lịch sử chứa thông tin: action type, trường thay đổi (changedField), giá trị cũ (previousValue), giá trị mới (newValue), người thực hiện (changedBy), thời gian (changedAt) và dữ liệu diff dạng JSON cho các thay đổi phức tạp. API GET /api/v1/stations/coastal/{id}/history trả về danh sách các bản ghi lịch sử dạng CoastalStationVTSHistoryResponse.

## Business Intent

Phục vụ công tác kiểm toán, truy xuất nguồn gốc và đối chiếu dữ liệu Đài TTDH theo yêu cầu quản lý nhà nước. Lịch sử thay đổi giúp xác định ai đã thực hiện thay đổi gì và khi nào, hỗ trợ điều tra khi có sai sót dữ liệu hoặc khiếu nại. Đây là yêu cầu bắt buộc của hệ thống quản lý tài sản công.

## Flow Summary

Người dùng truy cập màn hình chi tiết Đài TTDH → Chọn tab "Lịch sử thay đổi" → Hệ thống gọi API GET /api/v1/stations/coastal/{id}/history → Service truy vấn bảng lịch sử theo entityId, sắp xếp theo thời gian giảm dần → Trả về danh sách các bản ghi lịch sử dạng CoastalStationVTSHistoryResponse với các trường: actionType, changedField, previousValue, newValue, changedBy, changedAt, details → Người dùng xem được toàn bộ dòng thời gian thay đổi của đài.

## Acceptance Criteria

- **AC-01**: Khi tra cứu lịch sử của Đài TTDH hợp lệ, hệ thống trả về HTTP 200 kèm danh sách các bản ghi lịch sử sắp xếp theo thời gian mới nhất.
- **AC-02**: Danh sách lịch sử bao gồm đầy đủ các action type: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-03**: Khi tra cứu lịch sử của ID không tồn tại, hệ thống trả về danh sách rỗng (HTTP 200) hoặc HTTP 404 tùy theo thiết kế.
- **AC-04**: Các bản ghi lịch sử hiển thị chính xác changedField, previousValue, newValue cho mỗi lần cập nhật.

## In Scope

- Xem danh sách lịch sử thay đổi theo thời gian
- Ghi nhận tất cả action types (CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT)
- Hiển thị chi tiết trường thay đổi, giá trị cũ/mới

## Out of Scope

- Xóa lịch sử
- Xuất báo cáo lịch sử ra file
- So sánh giữa các phiên bản

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Có thể xem lịch sử |
| operator | Read | Có thể xem lịch sử |
| approver_L1 | Read | Có thể xem lịch sử |
| approver_L2 | Read | Có thể xem lịch sử |
| viewer | Read | Có thể xem lịch sử |

## Entities

- **CoastalStationVTSHistoryResponse**: DTO phản hồi chứa các trường: actionType, changedField, previousValue, newValue, changedBy, changedAt, details.
- **Station history**: Bảng lịch sử riêng cho station, quản lý qua service.getHistory(id) và HistoryService.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Bản ghi soft-delete vẫn giữ lịch sử để truy xuất | CoastalStationVTS history | softDelete() không xóa lịch sử |

## Testing Strategy

(populated by qa stage)
