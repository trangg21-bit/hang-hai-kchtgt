---
feature-id: F-057
document: lean-spec
output-mode: lean
last-updated: 2026-08-07
---
# Cập nhật Trạm radar

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền chỉnh sửa thông tin Trạm radar đã tồn tại. Form và trường dữ liệu giống hệt F-056, khác biệt chính: đơn vị quản lý và mã radar bị khóa (disabled), dữ liệu được điền sẵn từ API detail, nút hành động đổi thành "Cập nhật"/"Cập nhật và gửi phê duyệt"/"Cập nhật và phê duyệt", sau khi cập nhật trạng thái quay về PROPOSED → cần duyệt lại. Chỉ user cùng đơn vị quản lý mới được sửa.

## Scope

| | Items |
|---|---|
| In scope | Form cập nhật giống hệt F-056; Khóa trường đơn vị quản lý và mã radar; Load dữ liệu từ GET /api/v1/radar-station/:id; File đính kèm: hiển thị file cũ + thêm/xóa; 3 chế độ lưu: Cập nhật, Cập nhật và gửi phê duyệt, Cập nhật và phê duyệt; Sau cập nhật: approvalStatus → PROPOSED; Ghi nhật ký (ApprovalHistory với actionType=UPDATED); Kiểm tra cùng đơn vị quản lý |
| Out of scope | Tạo mới (F-056); Xóa (F-058); Phê duyệt (F-059); Xem chi tiết/lịch sử (F-060, F-061) |
| Assumptions | Trạm radar đã tồn tại; Người dùng có quyền radarstation:update và cùng orgUnitId |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-057-01 | Chuyên viên | Cập nhật thông tin trạm radar | Chỉnh sửa dữ liệu khi có thay đổi | Must Have |
| US-057-02 | Chuyên viên | Sau cập nhật, trạng thái tự động quay về PROPOSED | Đảm bảo dữ liệu được duyệt lại | Must Have |
| US-057-03 | Chuyên viên | Xem và quản lý file đính kèm hiện có | Thêm file mới hoặc xóa file cũ | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-057-01 | US-057-01 | Form được điền sẵn dữ liệu | Given chọn trạm radar từ danh sách; When click "Sửa"; Then form hiển thị toàn bộ dữ liệu hiện tại từ GET detail | Đơn vị QL và mã radar disabled |
| AC-057-02 | US-057-02 | Cập nhật → PROPOSED | Given trạm radar APPROVED; When cập nhật; Then approvalStatus → PROPOSED, approvedLevel1/2 → false | Cần duyệt lại qua F-059 |
| AC-057-03 | US-057-01 | Chỉ user cùng đơn vị được sửa | Given user khác orgUnitId; When PUT; Then HTTP 403 | Backend kiểm tra |
| AC-057-04 | US-057-03 | File đính kèm | Given form cập nhật; When mở; Then hiển thị file cũ + cho phép thêm/xóa | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-057-01 | Chỉ user cùng orgUnitId mới được sửa | AC-057-03 | Admin Cục |
| BR-057-02 | Sau cập nhật, approvalStatus → PROPOSED | AC-057-02 | Không có ngoại lệ |
| BR-057-03 | Mọi cập nhật ghi ApprovalHistory (UPDATED) | AC-057-02 | Không có ngoại lệ |
| BR-057-04 | Cascade: đổi vtsSystemId → clear ttdhVtsId | AC-057-01 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load dữ liệu detail + hiển thị form | ≤ 1 giây |
| Performance | Cập nhật phản hồi | ≤ 2 giây |
| Security | RBAC + cùng đơn vị kiểm tra | HTTP 403 |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-057-01 | AC-057-01 | Happy path: Mở form cập nhật → dữ liệu điền sẵn | Integration |
| TS-057-02 | AC-057-02 | Happy path: Cập nhật APPROVED → PROPOSED | Integration |
| TS-057-03 | AC-057-03 | Negative: User khác đơn vị → HTTP 403 | Security |
| TS-057-04 | BR-057-04 | Edge: Đổi vtsSystemId → ttdhVtsId bị clear | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Cập nhật entity hiện có, không thêm bảng mới |
| Architecture affected? | No | PUT API pattern hiện có |
| Implementation clear? | Yes | Form dùng chung F-056, chỉ khác mode=EDIT và khóa trường |
| **Verdict** | `Ready for Technical Lead planning` | Cập nhật đơn giản, dùng chung form và validation F-056 |
