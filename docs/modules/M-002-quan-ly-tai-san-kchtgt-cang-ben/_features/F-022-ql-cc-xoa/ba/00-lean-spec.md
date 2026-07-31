---
feature-id: F-022
document: lean-spec
output-mode: lean
last-updated: 2026-07-31
---
# Xóa Cầu cảng

## Summary

Hệ thống cần cho phép Admin và Lãnh đạo xóa mềm (soft delete) Cầu cảng khỏi danh sách hoạt động. Chỉ xóa được khi cầu cảng ở trạng thái Lưu tạm (CHO_PHE_DUYET, chưa gửi duyệt). Dữ liệu không bị xóa vật lý — chỉ set deletedAt, bản ghi vẫn tồn tại trong DB để kiểm toán nhưng không hiển thị ở bất kỳ đâu. Trước khi xóa, hệ thống kiểm tra ràng buộc dữ liệu liên quan (tài sản, vận hành, bảo trì, sự cố). Không tự động xóa cascade.

## Scope

| | Items |
|---|---|
| In scope | Hộp thoại xác nhận xóa với thông tin cầu cảng + cảnh báo; Kiểm tra ràng buộc dữ liệu liên quan trước khi xóa; Xác nhận bằng nhập tên cầu cảng; Soft delete (set deletedAt); Ghi nhật ký XOA_MEM; Toast thông báo; Làm mới danh sách |
| Out of scope | Xóa vật lý; Xóa hàng loạt; Khôi phục cầu cảng đã xóa; Xóa cascade dữ liệu liên quan; Xóa khi đã gửi duyệt/đã duyệt/từ chối |
| Assumptions | Chỉ xóa được khi trạng thái CHO_PHE_DUYET và chưa gửi duyệt; Người dùng có quyền Admin hoặc Lãnh đạo |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-022-01 | Admin/Lãnh đạo | Xóa mềm Cầu cảng ở trạng thái Lưu tạm | Loại bỏ cầu cảng không còn cần thiết khỏi hệ thống | Must Have |
| US-022-02 | Admin/Lãnh đạo | Được cảnh báo nếu cầu cảng có dữ liệu liên quan trước khi xóa | Tránh mất mát dữ liệu nghiệp vụ | Must Have |
| US-022-03 | Hệ thống | Ghi nhận thao tác xóa vào lịch sử | Truy vết kiểm toán | Must Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-022-01 | US-022-01 | Xóa thành công cầu cảng Lưu tạm | Given cầu cảng CHO_PHE_DUYET chưa gửi duyệt, không có dữ liệu liên quan; When Admin nhấn Xóa, nhập tên xác nhận; Then DELETE thành công, deletedAt được set, toast "Xóa cầu cảng thành công", danh sách làm mới | |
| AC-022-02 | US-022-01 | Chặn xóa khi không phải Lưu tạm | Given cầu cảng đã gửi duyệt/đã duyệt/từ chối; When Admin nhấn Xóa; Then nút Xóa bị ẩn hoặc hiển thị lỗi "Không thể xóa cầu cảng ở trạng thái này" | |
| AC-022-03 | US-022-02 | Chặn xóa khi có dữ liệu liên quan | Given cầu cảng có dữ liệu tài sản/vận hành/bảo trì/sự cố; When Admin nhấn Xóa; Then hiển thị danh sách dữ liệu liên quan + thông báo "Vui lòng xử lý trước khi xóa" | Không tự động cascade |
| AC-022-04 | US-022-01 | Xác nhận bằng nhập tên cầu cảng | Given hộp thoại xóa hiển thị; When chưa nhập đúng tên cầu cảng; Then nút "Xóa" disabled; When nhập đúng tên; Then nút "Xóa" enabled | |
| AC-022-05 | US-022-01 | Soft delete — không xóa vật lý | Given xóa thành công; When query DB; Then bản ghi còn tồn tại, deletedAt != null, deletedBy = current_user | Không hiển thị ở bất kỳ đâu trong hệ thống |
| AC-022-06 | US-022-03 | Ghi nhật ký xóa | Given xóa thành công; When kiểm tra LichSuThayDoi; Then có bản ghi actionType=XOA_MEM | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-022-01 | Chỉ Admin và Lãnh đạo mới được xóa | AC-022-01 | Không có ngoại lệ |
| BR-022-02 | Chỉ xóa được khi trạng thái CHO_PHE_DUYET và chưa gửi duyệt | AC-022-02 | Không có ngoại lệ |
| BR-022-03 | Soft delete: set deletedAt, không xóa vật lý | AC-022-05 | Không có ngoại lệ |
| BR-022-04 | Kiểm tra dữ liệu liên quan trước khi xóa; không cascade | AC-022-03 | Không có ngoại lệ |
| BR-022-05 | Ghi nhật ký XOA_MEM | AC-022-06 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Kiểm tra ràng buộc + xóa ≤ 1 giây | p95 ≤ 1s |
| Security | RBAC trên API; nút Xóa chỉ hiển thị cho Admin/Lãnh đạo | HTTP 403 |
| Reliability | Soft delete atomic | 100% |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-022-01 | AC-022-01 | Happy path: Xóa cầu cảng Lưu tạm thành công | Integration |
| TS-022-02 | AC-022-02 | Negative: Xóa cầu cảng đã duyệt → bị chặn | Integration |
| TS-022-03 | AC-022-03 | Negative: Xóa cầu cảng có dữ liệu liên quan → bị chặn + hiển thị danh sách | Integration |
| TS-022-04 | AC-022-04 | Edge: Nhập sai tên → nút Xóa disabled | UI |
| TS-022-05 | AC-022-05 | Audit: Sau xóa, DB còn bản ghi với deletedAt | Integration |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Soft delete trên entity hiện có |
| Architecture affected? | No | DELETE endpoint với kiểm tra ràng buộc |
| Implementation clear? | Yes | Pattern rõ ràng: hộp thoại xác nhận + kiểm tra ràng buộc + soft delete |
| **Verdict** | `Ready for Technical Lead planning` | |