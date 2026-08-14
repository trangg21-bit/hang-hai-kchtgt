---
feature-id: F-046
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Quản lý Đê/kè - Xóa

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền xóa mềm (soft delete) công trình đê/kè ở trạng thái PROPOSED. Bản ghi bị xóa không hiển thị trong danh sách mặc định nhưng dữ liệu được giữ nguyên để phục vụ kiểm toán. Trước khi xóa có popup xác nhận. Thành công được đo bằng khả năng soft delete đúng điều kiện (PROPOSED + đúng đơn vị hoặc Cấp Cục), ghi lịch sử XOA_MEM, và chặn xóa bản ghi không đủ điều kiện.

## Scope

| | Items |
|---|---|
| In scope | Soft delete (isDeleted=true, deletedAt, deletedBy); Điều kiện: PROPOSED + (Cấp Cục hoặc cùng đơn vị); Popup xác nhận; Ghi history XOA_MEM; Phân quyền dikerevetment:delete; Ẩn khỏi danh sách |
| Out of scope | Xóa cứng (physical delete); Xóa bản ghi APPROVED (cần quy trình hủy riêng); Khôi phục bản ghi đã xóa |
| Assumptions | Bản ghi đã tồn tại; Chỉ xóa được PROPOSED; Dữ liệu liên quan (attachment, history) giữ nguyên |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-046-01 | Chuyên viên | Xóa đê/kè PROPOSED tạo sai | Dọn dẹp dữ liệu | Must Have |
| US-046-02 | Cục trưởng | Xóa bất kỳ PROPOSED nào toàn hệ thống | Quản lý dữ liệu | Must Have |
| US-046-03 | Chuyên viên | Popup xác nhận trước khi xóa | Tránh thao tác nhầm | Should Have |
| US-046-04 | Chuyên viên | Dữ liệu đã xóa không hiển thị nhưng tra cứu được | Duy trì truy vết | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-046-01 | US-046-01 | Xóa thành công bản ghi PROPOSED | Given quyền + PROPOSED + cùng đơn vị; When Xóa + xác nhận; Then isDeleted=true, deletedAt=now, ghi XOA_MEM, thông báo "Xóa đê kè thành công", biến mất khỏi danh sách | |
| AC-046-02 | US-046-01 | Không cho xóa bản ghi không phải PROPOSED | Given UNDER_REVIEW/APPROVED/REJECTED; When cố xóa; Then nút ẩn, API lỗi "Chỉ có thể xóa bản ghi ở trạng thái Lưu tạm" | |
| AC-046-03 | US-046-01 | Điều kiện hiển thị nút Xóa | Given PROPOSED + (Cấp Cục hoặc cùng đơn vị); Then hiển thị nút Xóa. Khác → ẩn | |
| AC-046-04 | US-046-03 | Popup xác nhận | Given nhấn Xóa; Then popup "Bạn có chắc chắn muốn xóa công trình [tên]? Thao tác này không thể hoàn tác." + nút Hủy/Xóa | |
| AC-046-05 | US-046-01 | Không có quyền | Given không có quyền dikerevetment:delete; Then nút ẩn, API 403 | |
| AC-046-06 | US-046-02 | Xóa Cấp Cục | Given Cục trưởng; Then xóa bất kỳ PROPOSED nào, không giới hạn đơn vị | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-046-01 | Chỉ xóa PROPOSED; APPROVED cần quy trình hủy riêng | AC-046-02 | |
| BR-046-02 | Xóa mềm, không xóa cứng; giữ attachment + history | AC-046-01 | |
| BR-046-03 | Ghi history XOA_MEM | AC-046-01 | |
| BR-046-04 | Không xóa cascade dữ liệu module khác | - | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API xóa phản hồi | ≤ 500ms |
| Performance | Popup xác nhận hiển thị | ≤ 200ms |
| Security | RBAC trên API; kiểm tra quyền + đơn vị ở backend | |
| Reliability | Soft delete không ảnh hưởng dữ liệu module khác | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-046-01 | AC-046-01 | Happy path: xóa PROPOSED → isDeleted=true + ghi XOA_MEM | Integration |
| TS-046-02 | AC-046-02 | Xóa APPROVED → lỗi "Chỉ xóa bản ghi Lưu tạm" | Integration |
| TS-046-03 | AC-046-03 | Bản ghi APPROVED → nút Xóa ẩn | UI |
| TS-046-04 | AC-046-04 | Popup xác nhận hiển thị đúng nội dung | UI |
| TS-046-05 | AC-046-05 | Không quyền → API 403 | Security |
| TS-046-06 | AC-046-06 | Cục trưởng xóa PROPOSED đơn vị khác thành công | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Soft delete trên dike_revetment hiện có (isDeleted, deletedAt, deletedBy) |
| Architecture affected? | No | DELETE endpoint theo pattern có sẵn |
| Implementation clear? | Yes | Pattern soft delete đã có tiền lệ (F-022 Cầu cảng); điều kiện trạng thái rõ |
| **Verdict** | `Ready for Technical Lead planning` | Soft delete thuần túy; logic điều kiện rõ ràng |
