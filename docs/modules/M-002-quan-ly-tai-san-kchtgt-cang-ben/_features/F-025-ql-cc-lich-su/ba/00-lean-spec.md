---
feature-id: F-025
document: lean-spec
output-mode: lean
last-updated: 2026-07-31
---
# Lịch sử Cầu cảng

## Summary

Hệ thống cần hiển thị toàn bộ lịch sử thay đổi của một Cầu cảng dưới dạng card box, bao gồm mọi thao tác: tạo mới (F-020), cập nhật (F-021), phê duyệt/từ chối (F-023), xóa mềm (F-022). Mỗi lần thay đổi là một card box gồm 2 cột: cột trái hiển thị thời gian + người cập nhật, cột phải hiển thị danh sách trường thay đổi với giá trị cũ (nền đỏ nhạt) → giá trị mới (nền xanh nhạt). Badge màu phân biệt loại hành động. Hỗ trợ lọc theo thời gian, người thực hiện, loại hành động.

## Scope

| | Items |
|---|---|
| In scope | Card box cho mỗi lần thay đổi (2 cột: metadata + nội dung); Giá trị cũ/mới phân biệt màu sắc; Badge loại hành động (5 loại); Bộ lọc: thời gian, người thực hiện, loại hành động; Sắp xếp mới nhất lên đầu; Phân trang |
| Out of scope | Sửa/xóa lịch sử; Xuất Excel/PDF; So sánh hai phiên bản; Khôi phục dữ liệu từ lịch sử |
| Assumptions | LichSuThayDoi được ghi tự động từ F-020, F-021, F-022, F-023; Tất cả người dùng đã đăng nhập đều có quyền xem |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-025-01 | Quản lý tài sản | Xem toàn bộ lịch sử thay đổi của cầu cảng | Biết ai đã thay đổi gì, khi nào | Must Have |
| US-025-02 | Lãnh đạo | Xem lịch sử phê duyệt/từ chối | Kiểm tra quy trình đúng chưa | Must Have |
| US-025-03 | Kiểm toán viên | Truy vết mọi thay đổi | Phục vụ kiểm toán | Must Have |
| US-025-04 | Quản lý tài sản | Lọc theo thời gian/người thực hiện | Tìm nhanh thay đổi cần xem | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-025-01 | US-025-01 | Danh sách card box theo thời gian giảm dần | Given người dùng mở trang lịch sử; When GET /api/v1/cau-cang/:id/history; Then card box xếp mới nhất lên đầu. Nếu không có → "Không có lịch sử thay đổi" | |
| AC-025-02 | US-025-01 | Card box hiển thị metadata + nội dung thay đổi | Given card box; Then cột trái: HH:mm:ss dd/MM/yyyy + tên người cập nhật; Cột phải: danh sách trường thay đổi (cũ → mới), giá trị cũ nền #FFF0F0 chữ #C62828, giá trị mới nền #E8F5E9 chữ #2E7D32 | |
| AC-025-03 | US-025-01 | Badge loại hành động | Given card box; Then badge: Tạo mới (xanh lá), Cập nhật (xanh dương), Phê duyệt (xanh đậm), Từ chối (đỏ), Xóa mềm (xám) | |
| AC-025-04 | US-025-01 | Tạo mới → hiển thị "Tạo mới cầu cảng" + giá trị ban đầu | Given sự kiện TAO_MOI; Then cột phải hiển thị "Tạo mới cầu cảng" + danh sách giá trị khởi tạo; oldValue = null | |
| AC-025-05 | US-025-04 | Bộ lọc hoạt động | Given chọn Từ ngày-Đến ngày, người thực hiện, loại hành động; Then danh sách card box được lọc tương ứng | |
| AC-025-06 | US-025-01 | Read-only — không sửa/xóa được | Given trang lịch sử; Then không có nút sửa/xóa; API không hỗ trợ PUT/DELETE trên history | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-025-01 | Mọi thay đổi Cầu cảng tự động ghi LichSuThayDoi | AC-025-01 | Không có ngoại lệ |
| BR-025-02 | Lịch sử read-only, append-only | AC-025-06 | Không có ngoại lệ |
| BR-025-03 | Lưu trữ vĩnh viễn | AC-025-01 | |
| BR-025-04 | Tên người thực hiện lấy từ token, không giả mạo được | AC-025-02 | |
| BR-025-05 | Thay đổi quan trọng (phê duyệt/từ chối) được badge màu nổi bật | AC-025-03 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải lịch sử ≤ 1 giây (≤ 100 bản ghi); phân trang khi > 100 | p95 ≤ 1s |
| Security | RBAC trên API; lịch sử immutable | |
| UX | Card box 2 cột (mobile → dọc); Loading skeleton; Empty state; Màu trước/sau rõ ràng | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-025-01 | AC-025-01 | Cầu cảng có lịch sử → card box hiển thị đúng thứ tự | Integration |
| TS-025-02 | AC-025-02 | Card box hiển thị đúng màu cũ/mới | UI |
| TS-025-03 | AC-025-03 | Badge màu đúng cho từng actionType | UI |
| TS-025-04 | AC-025-04 | Sự kiện TAO_MOI → oldValue null, hiển thị "Tạo mới" | Integration |
| TS-025-05 | AC-025-05 | Lọc theo thời gian/người/loại → đúng kết quả | Integration |
| TS-025-06 | AC-025-01 | Cầu cảng không có lịch sử → empty state | UI |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên LichSuThayDoi đã có |
| Architecture affected? | No | GET endpoint với filter + pagination |
| Implementation clear? | Yes | Card box UI là pattern mới nhưng approach rõ ràng |
| **Verdict** | `Ready for Technical Lead planning` | Read-only; UI card box cần implement nhưng logic rõ ràng |