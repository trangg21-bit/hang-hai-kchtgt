---
id: F-115
name: "Quản lý Đài LRIT - Lịch sử"
slug: quan-ly-dai-lrit-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:22Z"
last-updated: "2026-07-07T03:33:22Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài LRIT - Lịch sử

## Description

Tính năng tra cứu lịch sử thay đổi của một Đài LRIT. Ghi nhận: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi chứa actionType, changedField, previousValue, newValue, changedBy, changedAt. API GET /api/v1/stations/lrit/{id}/history trả về danh sách CoastalStationLRITHistoryResponse.

## Business Intent

Phục vụ kiểm toán dữ liệu Đài LRIT theo yêu cầu SOLAS. Lịch sử thay đổi giúp xác định ai đã thay đổi thông số kỹ thuật (terminalId, IMO, công suất) phục vụ điều tra và đối chiếu khi có sai lệch trong dữ liệu giám sát tàu tầm xa.

## Flow Summary

Người dùng vào tab "Lịch sử" Đài LRIT → GET /.../{id}/history → Danh sách sắp xếp theo thời gian.

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

- **CoastalStationLRITHistoryResponse**: DTO lịch sử.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Lịch sử không bị xóa theo bản ghi | CoastalStationLRIT history | softDelete() |

## Testing Strategy

(populated by qa stage)
