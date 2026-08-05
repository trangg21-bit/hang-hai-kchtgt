---
feature-id: F-094
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---
# Sửa Đèn biển và nhà trạm gắn với Đèn biển

## Summary

Cho phép Chuyên viên/Cán bộ chỉnh sửa thông tin DBNT đã tồn tại. Form dùng chung FormCrud mode=Edit, load dữ liệu từ API detail. Các trường ma và fkDonViQl bị khóa. Sau khi sửa, nếu bản ghi đang S_6 sẽ quay về S_1/S_2 và cần duyệt lại qua PDKC_053. Nút Sửa chỉ hiển thị khi user có quyền và bản ghi ở trạng thái phù hợp.

## Scope

| | Items |
|---|---|
| In scope | FormCrud mode=Edit load từ GET detail; 3 nút: Cập nhật/Cập nhật & Gửi duyệt/Cập nhật & Duyệt (Cục); ma + fkDonViQl disabled; Validate như tạo mới; Ghi lịch sử |
| Out of scope | Tạo mới (F-092); Xóa (F-095); Phê duyệt (F-097) |
| Assumptions | DBNT đã tồn tại; API detail + PUT đã có |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Chuyên viên | Sửa thông tin DBNT khi có thay đổi thực tế | Cập nhật dữ liệu chính xác | Must Have |
| US-002 | Chuyên viên | Cập nhật & gửi duyệt lại sau sửa | Đưa bản ghi đã sửa vào luồng duyệt | Must Have |
| US-003 | Cấp Cục | Cập nhật & duyệt thẳng | Sửa và duyệt 1 bước | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given/When/Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Load form sửa | Given user bấm Sửa; When GET detail; Then FormCrud mode=Edit với dữ liệu điền sẵn | ma + fkDonViQl disabled |
| AC-002 | US-001 | Cập nhật | Given form đã sửa; When chọn "Cập nhật"; Then PUT LUU_TAM → S_6 về S_1; S_1 giữ S_1 | |
| AC-003 | US-002 | Cập nhật & gửi duyệt | Given form đã sửa; When "Cập nhật và gửi phê duyệt"; Then PUT LUU_VA_GUI_PHE_DUYET → S_2 | |
| AC-004 | US-003 | Cập nhật & duyệt (Cục) | Given user Cục; When "Cập nhật và phê duyệt"; Then PUT LUU_VA_PHE_DUYET → S_6 | Backend chặn non-Cục |
| AC-005 | US-001 | Điều kiện hiển thị nút Sửa | Given danh sách; Then nút Sửa chỉ hiện khi: Cục+(S_1/S_4/S_5/S_6) hoặc Chi cục đúng ĐV+(S_1/S_4/S_5/S_6) | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Sửa S_6 → quay S_1/S_2 → cần duyệt lại | AC-002/003 | Cục dùng Cập nhật & Duyệt giữ S_6 |
| BR-002 | ma + fkDonViQl không được sửa | AC-001 | Không có ngoại lệ |
| BR-003 | Cùng rule validate như tạo mới | AC-002 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | GET detail ≤ 500ms; PUT ≤ 1s | |
| Security | Backend kiểm tra quyền sửa + đơn vị | |
| Reliability | Transaction atomic; ghi lịch sử | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Load form sửa thành công, ma disabled | Acceptance |
| TS-002 | AC-002 | Sửa S_6 → Cập nhật → status=S_1 | Integration |
| TS-003 | AC-004 | Non-Cục gọi LUU_VA_PHE_DUYET → 403 | Security |
| TS-004 | AC-005 | Chi cục khác đơn vị không thấy nút Sửa | Acceptance |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Update trên DBNT đã có |
| Architecture affected? | Yes | PUT endpoint, state transition logic |
| Implementation clear? | No | Cần SA: state machine sau edit |
| **Verdict** | `Ready for solution architecture` | |
