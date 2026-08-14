---
feature-id: F-045
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Quản lý Đê/kè - Cập nhật

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền chỉnh sửa thông tin đê/kè đã tạo (F-044). Form sửa khóa 3 trường định danh (orgUnitId, cangBienId, ma), load sẵn dữ liệu từ GET detail. Sau khi sửa, approvalStatus quay về PROPOSED và isApprovedLevel1/2 reset về false — công trình phải được phê duyệt lại (F-047). Thành công được đo bằng khả năng cập nhật bản ghi PROPOSED/REJECTED/APPROVED với ghi lịch sử CAP_NHAT đúng.

## Scope

| | Items |
|---|---|
| In scope | Form sửa load sẵn dữ liệu; Khóa 3 trường orgUnitId/cangBienId/ma (disabled); Điều kiện hiển thị nút Sửa theo trạng thái + đơn vị; Sửa PROPOSED/REJECTED/APPROVED; Sau sửa → PROPOSED (reset C1/C2); Ghi history CAP_NHAT; Phân quyền dikerevetment:update |
| Out of scope | Tạo mới (F-044); Xóa (F-046); Phê duyệt (F-047); Xem chi tiết (F-048-detail); Lịch sử (F-049) |
| Assumptions | Bản ghi đã tồn tại; Validation khi sửa giống F-044; Không có nút "Lưu và phê duyệt" khi sửa |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-045-01 | Chuyên viên | Sửa thông tin đê/kè đơn vị mình quản lý | Cập nhật dữ liệu mới nhất | Must Have |
| US-045-02 | Chuyên viên | Khóa Đơn vị QL/Cảng biển/Mã khi sửa | Tránh sai thông tin định danh | Must Have |
| US-045-03 | Chuyên viên | Sau sửa quay về "Chờ phê duyệt" | Kiểm soát chất lượng trước khi dùng | Must Have |
| US-045-04 | Chuyên viên | Form hiển thị dữ liệu hiện tại | Biết cần thay đổi gì | Should Have |
| US-045-05 | Chuyên viên | Nhận thông báo rõ ràng thành công/thất bại | Biết trạng thái | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-045-01 | US-045-04 | Hiển thị form sửa với dữ liệu hiện tại | Given chọn "Sửa"; When GET detail; Then form load đủ dữ liệu, 3 trường disabled | |
| AC-045-02 | US-045-01 | Điều kiện hiển thị nút Sửa | Given bản ghi PROPOSED/REJECTED + cùng đơn vị, hoặc APPROVED + Cấp Cục; Then hiển thị nút Sửa. Khác → ẩn | |
| AC-045-03 | US-045-03 | Cập nhật PROPOSED thành công | Given bản ghi PROPOSED; When "Lưu tạm"; Then cập nhật, giữ PROPOSED, ghi CAP_NHAT, thông báo "Cập nhật đê kè thành công" | |
| AC-045-04 | US-045-03 | Cập nhật REJECTED thành công | Given bản ghi REJECTED; When "Lưu tạm"; Then cập nhật, chuyển PROPOSED, có thể gửi duyệt lại | |
| AC-045-05 | US-045-03 | Cập nhật APPROVED → duyệt lại | Given bản ghi APPROVED; When sửa; Then PROPOSED + isApprovedLevel1=isApprovedLevel2=false, cần duyệt lại từ đầu | |
| AC-045-06 | US-045-01 | Cập nhật & gửi phê duyệt | Given form hợp lệ; When "Lưu và gửi phê duyệt"; Then cập nhật + gửi notify "Đã gửi phê duyệt cập nhật đê kè" | |
| AC-045-07 | US-045-01 | Validation khi sửa | Given bỏ trống trường bắt buộc; When nhấn Lưu; Then lỗi, chặn submit | Giống F-044 |
| AC-045-08 | US-045-02 | Không có quyền sửa | Given không có quyền dikerevetment:update; Then nút ẩn, API 403 | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-045-01 | Khóa 3 trường orgUnitId/cangBienId/ma khi sửa | AC-045-01 | Không có ngoại lệ |
| BR-045-02 | Sửa APPROVED → PROPOSED + reset C1/C2 | AC-045-05 | |
| BR-045-03 | Mọi sửa đổi ghi history CAP_NHAT | AC-045-03 | |
| BR-045-04 | Validation khi sửa giống F-044 | AC-045-07 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load dữ liệu form sửa (GET detail) | ≤ 1 giây |
| Performance | Lưu cập nhật phản hồi | ≤ 1 giây |
| Security | Kiểm tra dikerevetment:update + điều kiện đơn vị; chống mass-assignment (orgUnitId, cangBienId, ma, approvalStatus không nhận từ client) | |
| UX | Trường disabled hiển thị nền xám, cursor not-allowed; Confirm khi sửa bản APPROVED | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-045-01 | AC-045-01 | Happy path: mở form sửa → load đủ dữ liệu, 3 trường disabled | Integration |
| TS-045-02 | AC-045-02 | Bản ghi UNDER_REVIEW → nút Sửa ẩn | UI |
| TS-045-03 | AC-045-03 | Sửa PROPOSED → giữ PROPOSED + ghi CAP_NHAT | Integration |
| TS-045-04 | AC-045-05 | Sửa APPROVED → PROPOSED + reset C1/C2 | Integration |
| TS-045-05 | AC-045-08 | Không quyền → API 403 | Security |
| TS-045-06 | AC-045-07 | Bỏ trống trường bắt buộc → lỗi validation | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Update trên dike_revetment hiện có |
| Architecture affected? | No | PUT update theo pattern có sẵn |
| Implementation clear? | Yes | Pattern update đã có tiền lệ (F-021 Cầu cảng); field-level disabled + reset state rõ |
| **Verdict** | `Ready for Technical Lead planning` | Update thuần túy; logic reset state rõ ràng |
