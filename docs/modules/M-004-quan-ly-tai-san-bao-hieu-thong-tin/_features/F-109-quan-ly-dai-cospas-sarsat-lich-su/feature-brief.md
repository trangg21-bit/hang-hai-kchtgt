---
id: F-109
name: "Quản lý Đài COSPAS-SARSAT - Lịch sử"
slug: quan-ly-dai-cospas-sarsat-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:33:14Z"
last-updated: "2026-07-07T03:33:14Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Đài COSPAS-SARSAT - Lịch sử

## Description

Tính năng tra cứu lịch sử thay đổi của một Đài COSPAS-SARSAT. Ghi nhận: CREATE, UPDATE, SOFT_DELETE, APPROVE_L1, APPROVE_L2, REJECT. Mỗi bản ghi có actionType, changedField, previousValue, newValue, changedBy, changedAt. API GET /api/v1/stations/cospas-sarsat/{id}/history trả về danh sách CoastalStationCospasSarsatHistoryResponse.

## Business Intent

Phục vụ kiểm toán dữ liệu Đài COSPAS-SARSAT, đáp ứng yêu cầu quản lý nhà nước về an toàn hàng hải. Lịch sử thay đổi giúp xác định ai đã thay đổi thông số kỹ thuật quan trọng (tần số, giao thức, kênh khẩn cấp) phục vụ điều tra sự cố SAR.

## Flow Summary

Người dùng vào tab "Lịch sử" của Đài COSPAS-SARSAT → GET /.../{id}/history → Truy vấn lịch sử → Trả về danh sách.

## Acceptance Criteria

- **AC-01**: Tra cứu hợp lệ trả về HTTP 200 kèm danh sách lịch sử.
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

- **CoastalStationCospasSarsatHistoryResponse**: DTO lịch sử.

## Business Rules

| ID | Rule | Applies-to | Source |
|----|------|------------|--------|
| BR-009 | Lịch sử không bị xóa theo bản ghi | CoastalStationCospasSarsat history | softDelete() |

## Testing Strategy

(populated by qa stage)
