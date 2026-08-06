---
feature-id: F-095
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---
# Xóa Đèn biển và nhà trạm gắn với Đèn biển

## Summary

Cho phép xóa mềm (soft delete) DBNT bằng cách set status=S_0. Chỉ áp dụng với bản ghi ở trạng thái S_1 (Lưu tạm) và user là Cấp Cục hoặc đúng Chi cục quản lý. Bản ghi đang duyệt (S_2-S_5) hoặc đã duyệt (S_6) không thể xóa. Có popup xác nhận trước khi thực hiện.

## Scope

| | Items |
|---|---|
| In scope | Soft delete (status=S_0); Popup xác nhận; Kiểm tra điều kiện (S_1 + quyền); Ẩn nút Xóa khi không đủ điều kiện |
| Out of scope | Xóa vật lý; Khôi phục bản ghi đã xóa; Xóa hàng loạt |
| Assumptions | DBNT đã tồn tại; Cơ chế soft delete đã có |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên đúng đơn vị | Xóa DBNT đang Lưu tạm đã tạo sai | Loại bỏ dữ liệu không cần thiết | Must Have |
| US-002 | Cấp Cục | Xóa bất kỳ DBNT S_1 nào | Quản lý toàn hệ thống | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given/When/Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Hiển thị nút Xóa | Given danh sách; Then nút Xóa chỉ hiện khi status=S_1 và (Cục hoặc đúng Chi cục) | |
| AC-002 | US-001 | Xác nhận xóa | Given bấm Xóa; When hiện popup; Then "Bạn có chắc chắn muốn xóa Đèn biển [tên] không?" | |
| AC-003 | US-001 | Soft delete | Given xác nhận; When DELETE; Then status=S_0, bản ghi biến mất khỏi DS | |
| AC-004 | US-001 | Chặn xóa S_2-S_6 | Given status≠S_1; Then không hiển thị nút Xóa; API trả 400 nếu cố gọi | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Chỉ xóa bản ghi S_1 | AC-001/004 | Không có |
| BR-002 | Soft delete, không xóa vật lý | AC-003 | Không có |
| BR-003 | Cục xóa mọi S_1; Chi cục chỉ xóa đơn vị mình | AC-001 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Security | Backend chặn xóa S_2-S_6; kiểm tra đơn vị | |
| Reliability | Atomic: set status=S_0 + ghi lịch sử | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | S_1 + đúng Chi cục → thấy nút Xóa | Acceptance |
| TS-002 | AC-004 | S_6 → không thấy nút Xóa | Acceptance |
| TS-003 | AC-003 | Xác nhận → DELETE → status=S_0 | Integration |
| TS-004 | AC-004 | Gọi API DELETE với S_2 → 400 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Update status trên DBNT |
| Architecture affected? | Yes | DELETE endpoint, soft delete mechanism |
| Implementation clear? | No | Cần SA: soft delete pattern |
| **Verdict** | `Ready for solution architecture` | |
