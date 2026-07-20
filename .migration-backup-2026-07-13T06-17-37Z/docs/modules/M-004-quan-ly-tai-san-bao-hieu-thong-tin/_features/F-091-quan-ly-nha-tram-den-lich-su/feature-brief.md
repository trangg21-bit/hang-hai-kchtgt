---
id: F-091
name: "Quản lý Nhà trạm đèn - Lịch sử"
slug: quan-ly-nha-tram-den-lich-su
module-id: M-004
status: proposed
classification: local
priority: medium
created: "2026-07-07T03:32:49Z"
last-updated: "2026-07-07T03:32:49Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Quản lý Nhà trạm đèn - Lịch sử

## Description

Cho phép người dùng tra cứu lịch sử thay đổi của các nhà trạm đèn (NhaTramDen) dựa trên loại nhà trạm (NhaTramType.DEN). Lịch sử ghi lại tất cả các hành động quan trọng: tạo mới (CREATE), cập nhật (UPDATE), phê duyệt cấp 1 (APPROVE_L1), phê duyệt cấp 2 (APPROVE_L2), từ chối (REJECT), và xóa mềm (SOFT_DELETE). Mỗi bản ghi lịch sử bao gồm: loại hành động, id entity liên quan, trường thay đổi (changedField), giá trị cũ/mới, người thực hiện (changedBy), thời gian (changedAt), lý do (reason), và dữ liệu diff dạng JSON. Hỗ trợ lọc theo entityId, actionType, changedBy, khoảng thời gian (from/to), và phân trang. Lịch sử mang tính chỉ đọc (read-only), không thể chỉnh sửa hoặc xóa.

## Business Intent

Phục vụ công tác kiểm toán (audit) và truy vết thay đổi dữ liệu nhà trạm đèn, đảm bảo tính minh bạch và khả năng truy xuất nguồn gốc của mọi thao tác trên tài sản báo hiệu hàng hải. Giúp quản lý xem xét ai đã thay đổi thông số kỹ thuật ánh sáng, vị trí, lịch bảo trì và khi nào.

## Flow Summary

Người dùng gửi request GET đến endpoint /api/v1/nhatram/history với tham số bắt buộc type=DEN (NhaTramType) và các tham số tùy chọn: entityId (UUID), actionType (CREATE/UPDATE/APPROVE_L1/APPROVE_L2/REJECT/SOFT_DELETE), changedBy (Long), from (LocalDateTime), to (LocalDateTime), page (mặc định 0), size (mặc định 20). Hệ thống truy vấn bảng nha_tram_history với filter theo tramType=DEN, sắp xếp theo changedAt giảm dần, trả về danh sách phân trang NhaTramHistoryResponse. Kết quả bao gồm thông tin chi tiết của từng hành động, bao gồm diffData dạng JSON cho các thay đổi phức tạp.

## Acceptance Criteria

- AC-01: Gửi request GET /api/v1/nhatram/history?type=DEN không có filter, hệ thống trả về danh sách tất cả lịch sử nhà trạm đèn (phân trang, mặc định 20 bản ghi), HTTP 200.
- AC-02: Gửi request GET với type=DEN và entityId cụ thể, hệ thống trả về lịch sử chỉ của nhà trạm đèn đó.
- AC-03: Gửi request GET với type=DEN và actionType=UPDATE, hệ thống trả về lịch sử chỉ gồm các hành động cập nhật.
- AC-04: Gửi request GET với type=DEN và from/to, hệ thống trả về lịch sử trong khoảng thời gian chỉ định.
- AC-05: Gửi request GET với type=PHAO (không phải DEN), hệ thống trả về lịch sử nhà trạm phao, không bao gồm nhà trạm đèn.

## In Scope

- Tra cứu lịch sử theo loại nhà trạm (type=DEN)
- Lọc theo entityId, actionType, changedBy, khoảng thời gian
- Phân trang và sắp xếp theo thời gian giảm dần
- Hiển thị chi tiết changedField, previousValue, newValue, diffData

## Out of Scope

- Lịch sử nhà trạm phao (type=PHAO) — F-085
- Chỉnh sửa/xóa bản ghi lịch sử (read-only)
- Lịch sử BeaconLight/Buoy (F-073, F-079)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| admin | Read | Xem toàn bộ lịch sử |
| operator | Read | Xem lịch sử của nhà trạm đèn |
| approver_L1 | Read | Xem lịch sử phục vụ phê duyệt |
| approver_L2 | Read | Xem lịch sử phục vụ phê duyệt |
| viewer | Read | Xem lịch sử (chỉ đọc) |

## Entities

| Entity | Type | Usage |
|---|---|---|
| NhaTramHistory (nha_tram_history) | Table | Lưu trữ và truy vấn lịch sử |
| NhaTramType | Enum | DEN — filter theo loại nhà trạm đèn |
| NhaTramHistoryActionType | Enum | CREATE, UPDATE, APPROVE_L1, APPROVE_L2, REJECT, SOFT_DELETE |
| NhaTramHistoryResponse | DTO | Đóng gói dữ liệu lịch sử trả về |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-001 | Lịch sử chỉ đọc (read-only) — không thể sửa/xóa | NhaTramHistory | Service design — only create operations |

## Testing Strategy

(populated by qa stage)
