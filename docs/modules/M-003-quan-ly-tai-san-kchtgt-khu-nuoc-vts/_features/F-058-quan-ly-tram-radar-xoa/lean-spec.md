---
feature-id: F-058
document: lean-spec
output-mode: lean
last-updated: 2026-08-07
---
# Xóa Trạm radar

## Summary

Hệ thống cần cho phép Admin và Lãnh đạo xóa mềm (soft delete) Trạm radar. Chỉ xóa được khi trạm radar ở trạng thái PROPOSED và chưa được gửi duyệt. Xóa mềm set isDeleted=true, không xóa vật lý. Kiểm tra ràng buộc dữ liệu liên quan trước khi xóa — nếu có dữ liệu liên quan thì chặn. Ghi nhật ký xóa (ApprovalHistory với DELETED).

## Scope

| | Items |
|---|---|
| In scope | Soft delete (set isDeleted=true, deletedBy); Chỉ xóa khi PROPOSED (Lưu tạm, chưa gửi duyệt); Kiểm tra dữ liệu liên quan trước khi xóa; Hộp thoại xác nhận với nhập tên trạm để kích hoạt nút Xóa; Ghi nhật ký (ApprovalHistory DELETED); Phân quyền: chỉ Admin và Lãnh đạo |
| Out of scope | Xóa vật lý; Xóa cascade dữ liệu liên quan; Khôi phục trạm radar đã xóa |
| Assumptions | Trạm radar ở trạng thái PROPOSED và chưa gửi duyệt; Người dùng có quyền Admin hoặc Lãnh đạo |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-058-01 | Admin/Lãnh đạo | Xóa mềm trạm radar khỏi danh sách hoạt động | Dọn dẹp dữ liệu không cần thiết | Must Have |
| US-058-02 | Admin/Lãnh đạo | Nhận cảnh báo nếu trạm radar có dữ liệu liên quan | Tránh xóa nhầm dữ liệu quan trọng | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-058-01 | US-058-01 | Xóa mềm thành công | Given trạm radar PROPOSED, chưa gửi duyệt, không có dữ liệu liên quan; When Admin xác nhận xóa; Then isDeleted=true, thông báo thành công, biến mất khỏi danh sách | Chỉ Admin/Lãnh đạo |
| AC-058-02 | US-058-01 | Chặn xóa sai trạng thái | Given trạm radar UNDER_REVIEW/APPROVED/REJECTED; When click Xóa; Then nút Xóa bị ẩn hoặc API trả về 400 | |
| AC-058-03 | US-058-02 | Chặn xóa khi có dữ liệu liên quan | Given trạm radar có dữ liệu vận hành/bảo trì/sự cố; When kiểm tra trước xóa; Then hiển thị danh sách dữ liệu liên quan, chặn xóa | |
| AC-058-04 | US-058-01 | Hộp thoại xác nhận | Given click Xóa; When hiển thị dialog; Then yêu cầu nhập tên trạm radar để kích hoạt nút Xóa | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-058-01 | Chỉ Admin và Lãnh đạo được xóa | AC-058-01 | Không có ngoại lệ |
| BR-058-02 | Chỉ xóa khi PROPOSED và chưa gửi duyệt | AC-058-02 | Không có ngoại lệ |
| BR-058-03 | Soft delete: set isDeleted=true, không xóa vật lý | AC-058-01 | Không có ngoại lệ |
| BR-058-04 | Kiểm tra dữ liệu liên quan, chặn xóa nếu có | AC-058-03 | Không có ngoại lệ |
| BR-058-05 | Không tự động xóa cascade dữ liệu liên quan | AC-058-03 | Không có ngoại lệ |
| BR-058-06 | Ghi ApprovalHistory (DELETED) | AC-058-01 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Kiểm tra dữ liệu liên quan + xóa | ≤ 1 giây |
| Security | RBAC + JWT | HTTP 403 |
| UX | Dialog xác nhận + nhập tên; toast thông báo | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-058-01 | AC-058-01 | Happy path: Admin xóa trạm radar PROPOSED → thành công | Integration |
| TS-058-02 | AC-058-02 | Negative: Xóa APPROVED → HTTP 400 | Integration |
| TS-058-03 | AC-058-03 | Negative: Có dữ liệu liên quan → chặn xóa | Integration |
| TS-058-04 | AC-058-01 | Negative: Chuyên viên xóa → HTTP 403 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Soft delete trên entity hiện có |
| Architecture affected? | No | DELETE API pattern hiện có |
| Implementation clear? | Yes | Soft delete + kiểm tra ràng buộc |
| **Verdict** | `Ready for Technical Lead planning` | Xóa mềm đơn giản, pattern đã có tiền lệ |
