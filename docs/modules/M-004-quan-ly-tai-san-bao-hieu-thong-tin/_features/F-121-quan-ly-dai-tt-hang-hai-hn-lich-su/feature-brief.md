---
id: F-121
name: "Quản lý Đài TT Hàng hải HN - Lịch sử"
slug: quan-ly-dai-tt-hang-hai-hn-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:30Z"
last-updated: "2026-07-07T03:33:30Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài TT Hàng hải HN - Lịch sử

## Description

Tính năng tra cứu lịch sử thay đổi của một Đài TT Hàng hải Hải Phòng. Ghi nhận: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi có actionType, changedField, previousValue, newValue, changedBy, changedAt. API GET /api/v1/stations/haiphong/{id}/history trả về danh sách CoastalStationHaiphongHistoryResponse.

## Business Intent

Phục vụ kiểm toán dữ liệu Đài TT Hàng hải Hải Phòng, đáp ứng yêu cầu quản lý nhà nước về cảng biển. Lịch sử thay đổi giúp xác định ai thay đổi thông tin giấy phép, thanh tra, thiết bị — hỗ trợ kiểm định và cấp phép.

## Flow Summary

Người dùng vào tab "Lịch sử" Đài Hải Phòng → GET /.../{id}/history → Danh sách sắp xếp theo thời gian.

## Acceptance Criteria

- **AC-01**: Tra cứu hợp lệ trả về HTTP 200 với danh sách lịch sử.
- **AC-02**: Danh sách bao gồm tất cả action types.
- **AC-03**: Hiển thị chính xác changedField, previousValue, newValue.

## In Scope

- Xem lịch sử thay đổi
- Ghi nhận mọi action

## Out of Scope

- Xóa lịch sử

## Roles + Permissions

| Role | Level | Notes |
|------|-------|-------|
| admin | Read | Xem lịch sử |
| operator | Read | Xem lịch sử |
| approver_L1 | Read | Xem lịch sử |
| approver_L2 | Read | Xem lịch sử |
| viewer | Read | Xem lịch sử |

## Entities

- **CoastalStationHaiphongHistoryResponse**: DTO lịch sử.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Lịch sử không bị xóa theo bản ghi | CoastalStationHaiphong history | softDelete() |

## Testing Strategy

(populated by qa stage)
