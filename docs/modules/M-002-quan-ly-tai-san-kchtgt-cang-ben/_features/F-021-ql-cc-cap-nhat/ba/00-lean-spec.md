---
feature-id: F-021
document: lean-spec
output-mode: lean
last-updated: 2026-07-31
---
# Cập nhật Cầu cảng

## Summary

Hệ thống cần cho phép người dùng có thẩm quyền chỉnh sửa thông tin Cầu cảng đã tồn tại. Form và trường dữ liệu giống hệt form Tạo mới (F-020), chỉ khác ở các điểm: 3 trường bị khóa (đơn vị quản lý, cảng biển, mã cầu), dữ liệu được điền sẵn từ API detail, file đính kèm hiển thị file cũ + cho phép thêm/xóa, nút hành động đổi tên (Cập nhật thay vì Lưu tạm), API dùng PUT thay vì POST. Sau khi cập nhật, trạng thái phê duyệt quay về CHO_PHE_DUYET → cần duyệt lại. Chỉ user cùng đơn vị quản lý mới được sửa.

## Scope

| | Items |
|---|---|
| In scope | Form cập nhật giống F-020 nhưng khác: 3 trường disabled (đơn vị QL, cảng biển, mã CC); Dữ liệu điền sẵn từ GET detail; File đính kèm hiển thị file đã upload + thêm/xóa; 3 nút: Cập nhật / Cập nhật và gửi duyệt / Cập nhật và phê duyệt; API PUT; Ghi nhật ký CAP_NHAT; Sau sửa → trạng thái quay về CHO_PHE_DUYET |
| Out of scope | Thay đổi đơn vị quản lý, cảng biển cha, mã cầu cảng; Tạo mới (F-020); Xóa (F-022); Phê duyệt (F-023); Xem lịch sử (F-025) |
| Assumptions | Form giống hệt F-020 — tham khảo toàn bộ trường, validation, UI tại F-020; Người dùng cùng đơn vị quản lý với cầu cảng; Cầu cảng đã tồn tại |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-021-01 | Quản lý tài sản | Chỉnh sửa thông tin Cầu cảng với form điền sẵn dữ liệu | Giảm lỗi nhập liệu, tiết kiệm thời gian | Must Have |
| US-021-02 | Quản lý tài sản | Cập nhật và gửi phê duyệt lại sau khi sửa | Đảm bảo thông tin mới được kiểm duyệt trước khi dùng | Must Have |
| US-021-03 | Admin/Lãnh đạo | Cập nhật và phê duyệt ngay | Đưa thông tin mới vào sử dụng không cần chờ | Must Have |
| US-021-04 | Hệ thống | Ghi nhật ký từng trường thay đổi (cũ → mới) | Truy vết kiểm toán đầy đủ | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-021-01 | US-021-01 | Form điền sẵn dữ liệu từ API detail | Given người dùng click "Sửa" từ danh sách; When form cập nhật mở; Then toàn bộ trường được điền sẵn từ GET /api/v1/cau-cang/:id | 3 trường disabled: đơn vị QL, cảng biển, mã CC |
| AC-021-02 | US-021-01 | Không sửa được trường bị khóa | Given form cập nhật; When người dùng cố sửa đơn vị QL/cảng biển/mã CC; Then trường ở trạng thái disabled, backend từ chối thay đổi | Cả client và server |
| AC-021-03 | US-021-02 | Cập nhật và gửi duyệt → trạng thái CHO_PHE_DUYET | Given form hợp lệ; When nhấn "Cập nhật và gửi phê duyệt"; Then PUT /api/v1/cau-cang/:id?action=LUU_VA_GUI_PHE_DUYET, trạng thái → CHO_PHE_DUYET, ghi LichSuThayDoi | Cầu cảng tạm thời mất khỏi dropdown module khác |
| AC-021-04 | US-021-03 | Cập nhật và phê duyệt → DUOC_PHE_DUYET | Given Admin/Lãnh đạo; When nhấn "Cập nhật và phê duyệt"; Then PUT ...?action=LUU_VA_PHE_DUYET, trạng thái → DUOC_PHE_DUYET | Chỉ Admin/Lãnh đạo thấy nút này |
| AC-021-05 | US-021-01 | Chặn user khác đơn vị quản lý | Given user không thuộc donViQuanLy của cầu cảng; When cố sửa; Then HTTP 403 | Kiểm tra server-side |
| AC-021-06 | US-021-04 | Ghi nhật ký từng trường thay đổi | Given cập nhật thành công; When kiểm tra LichSuThayDoi; Then mỗi trường thay đổi có 1 bản ghi: fieldChanged, oldValue, newValue, changedBy, changedAt, actionType=CAP_NHAT | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-021-01 | Chỉ user cùng đơn vị quản lý mới được sửa | AC-021-05 | Không có ngoại lệ |
| BR-021-02 | Sau cập nhật, trạng thái quay về CHO_PHE_DUYET → cần duyệt lại; DUOC_PHE_DUYET bị sửa sẽ tạm thời biến mất khỏi dropdown module khác | AC-021-03 | Trừ khi dùng "Cập nhật và phê duyệt" |
| BR-021-03 | Mọi lần cập nhật ghi LichSuThayDoi (actionType=CAP_NHAT) | AC-021-06 | Không có ngoại lệ |
| BR-021-04 | Đơn vị QL, cảng biển, mã CC không được sửa sau khi tạo | AC-021-02 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load dữ liệu detail + hiển thị form ≤ 1 giây | p95 ≤ 1s |
| Security | RBAC trên API; kiểm tra donViQuanLy server-side | HTTP 403 khi không đủ quyền |
| Reliability | Ghi LichSuThayDoi trong cùng transaction với update CauCang | 100% consistency |
| UX | Form giống hệt F-020 — tham khảo F-020 về collapsible, màu sắc, responsive | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-021-01 | AC-021-01 | Happy path: Mở form sửa → dữ liệu điền sẵn đúng | Integration |
| TS-021-02 | AC-021-02 | Negative: Gửi payload sửa đơn vị QL → backend từ chối | Unit |
| TS-021-03 | AC-021-03 | Happy path: Cập nhật và gửi duyệt → CHO_PHE_DUYET | Integration |
| TS-021-04 | AC-021-04 | Happy path: Admin cập nhật và phê duyệt → DUOC_PHE_DUYET | Integration |
| TS-021-05 | AC-021-05 | Security: User khác đơn vị → HTTP 403 | Security |
| TS-021-06 | AC-021-06 | Audit: Sau cập nhật, LichSuThayDoi có đúng số bản ghi | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No - existing | Sử dụng entity CauCang và LichSuThayDoi đã có từ F-020 |
| Architecture affected? | No | CRUD update theo pattern hiện có; dùng chung FormCrud với formMode=EDIT |
| Implementation clear? | Yes | Form giống hệt F-020, chỉ khác ở 3 trường disabled + pre-fill + PUT + đổi tên nút |
| **Verdict** | `Ready for Technical Lead planning` | Implementation rõ ràng từ F-020; chỉ cần xử lý khác biệt |