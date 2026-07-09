---
id: F-103
name: "Quản lý Đài Inmarsat - Lịch sử"
slug: quan-ly-dai-inmarsat-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:06Z"
last-updated: "2026-07-07T03:33:06Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài Inmarsat - Lịch sử

## Description

Tính năng cho phép người dùng tra cứu lịch sử thay đổi của một Đài Inmarsat cụ thể. Hệ thống ghi nhận mọi thao tác: tạo mới (CREATE), cập nhật (UPDATE), xóa (SOFT_DELETE), phê duyệt L1 (APPROVE_L1), phê duyệt L2 (APPROVE_L2) và từ chối (REJECT). Mỗi bản ghi lịch sử chứa actionType, changedField, previousValue, newValue, changedBy, changedAt và details. API GET /api/v1/stations/inmarsat/{id}/history trả về danh sách CoastalStationInmarsatHistoryResponse.

## Business Intent

Phục vụ kiểm toán và truy xuất nguồn gốc dữ liệu Đài Inmarsat, đáp ứng yêu cầu quản lý nhà nước. Giúp xác định ai đã thay đổi thông số kỹ thuật (tần số, vùng phủ sóng, mã SAR) và khi nào, hỗ trợ điều tra khi có sai sót trong dữ liệu thông tin vệ tinh.

## Flow Summary

Người dùng vào tab "Lịch sử" của Đài Inmarsat → API GET /.../{id}/history → Service truy vấn lịch sử theo entityId → Trả về danh sách sắp xếp theo thời gian giảm dần.

## Acceptance Criteria

- **AC-01**: Tra cứu lịch sử hợp lệ trả về HTTP 200 kèm danh sách bản ghi.
- **AC-02**: Danh sách bao gồm CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT.
- **AC-03**: Hiển thị chính xác changedField, previousValue, newValue.

## In Scope

- Xem danh sách lịch sử thay đổi
- Ghi nhận tất cả action types

## Out of Scope

- Xóa lịch sử
- Xuất báo cáo

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem lịch sử |
| operator | Read | Xem lịch sử |
| approver_L1 | Read | Xem lịch sử |
| approver_L2 | Read | Xem lịch sử |
| viewer | Read | Xem lịch sử |

## Entities

- **CoastalStationInmarsatHistoryResponse**: DTO lịch sử.
- **Station history**: HistoryService quản lý.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Bản ghi soft-delete vẫn giữ lịch sử | CoastalStationInmarsat history | softDelete() |

## Testing Strategy

(populated by qa stage)
