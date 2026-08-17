---
feature-id: F-049
document: lean-spec
output-mode: lean
last-updated: 2026-08-13
---
# Quản lý Đê/kè - Lịch sử

## Summary

Hệ thống cần hiển thị toàn bộ lịch sử thay đổi của một công trình đê/kè dưới dạng card box, bao gồm mọi thao tác: tạo mới (F-044), cập nhật (F-045), gửi duyệt, phê duyệt C1/C2, từ chối (F-047), xóa mềm (F-046). Mỗi lần thay đổi là một card box gồm 2 cột: cột trái hiển thị thời gian + người thực hiện, cột phải hiển thị danh sách trường thay đổi với giá trị cũ (nền đỏ nhạt `#FFF0F0`) → giá trị mới (nền xanh nhạt `#E8F5E9`). Theo dõi ở mức từng trường (`fieldChanged`, `oldValue`, `newValue`). Badge màu phân biệt 7 loại hành động. Hỗ trợ lọc theo khoảng thời gian, người thực hiện, loại hành động.

## Scope

| | Items |
|---|---|
| In scope | Card box cho mỗi lần thay đổi (2 cột: metadata + nội dung); Theo dõi từng field (fieldChanged/oldValue/newValue); Giá trị cũ/mới phân biệt màu sắc; Badge 7 loại hành động; Bộ lọc: thời gian, người thực hiện, loại hành động (multi-select); Sắp xếp mới nhất lên đầu; Phân trang khi > 20 card; Read-only, append-only |
| Out of scope | Sửa/xóa lịch sử; Xuất Excel/PDF; So sánh hai phiên bản; Khôi phục dữ liệu từ lịch sử |
| Assumptions | Bảng `dike_revetment_approval_history` ghi tự động từ F-044/045/046/047; Tất cả người dùng đã đăng nhập đều có quyền xem trong phạm vi đơn vị |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-049-01 | Chuyên viên | Xem toàn bộ lịch sử thay đổi của đê/kè | Biết ai thay đổi gì, khi nào | Must Have |
| US-049-02 | Trưởng phòng | Xem lịch sử phê duyệt/từ chối | Kiểm tra quy trình đúng chưa | Must Have |
| US-049-03 | Kiểm toán viên | Truy vết mọi thay đổi | Phục vụ kiểm toán | Must Have |
| US-049-04 | Chuyên viên | Lọc theo thời gian/người thực hiện | Tìm nhanh thay đổi cần xem | Should Have |
| US-049-05 | Admin | Xuất báo cáo lịch sử ra Excel/PDF | Lưu trữ báo cáo | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-049-01 | US-049-01 | Danh sách card box theo thời gian giảm dần | Given mở tab lịch sử; When GET /api/v1/dike-revetment/{id}/history; Then card box xếp mới nhất lên đầu. Không có → "Không có lịch sử thay đổi" | |
| AC-049-02 | US-049-01 | Card box hiển thị metadata + nội dung | Given card box; Then cột trái: HH:mm:ss dd/MM/yyyy + tên người; cột phải: danh sách field thay đổi (cũ → mới), cũ nền #FFF0F0 chữ #C62828, mới nền #E8F5E9 chữ #2E7D32 | |
| AC-049-03 | US-049-01 | Badge 7 loại hành động | Given card box; Then badge: Tạo mới xanh lá, Cập nhật xanh dương, Gửi duyệt vàng, Phê duyệt C1/C2 xanh đậm, Từ chối đỏ, Xóa mềm xám | |
| AC-049-04 | US-049-01 | Tạo mới → "Tạo mới công trình" + giá trị ban đầu | Given TAO_MOI; Then cột phải "Tạo mới công trình đê/kè" + danh sách giá trị khởi tạo; oldValue=null | |
| AC-049-05 | US-049-04 | Bộ lọc hoạt động | Given chọn Từ ngày-Đến ngày, người thực hiện, loại hành động; Then danh sách lọc tương ứng | |
| AC-049-06 | US-049-01 | Read-only | Given trang lịch sử; Then không có nút sửa/xóa; API không hỗ trợ PUT/DELETE trên history | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-049-01 | Mọi thay đổi đê/kè tự động ghi history (append) | AC-049-01 | Không có ngoại lệ |
| BR-049-02 | Lịch sử read-only, append-only, bất biến | AC-049-06 | |
| BR-049-03 | Lưu trữ vĩnh viễn | AC-049-01 | |
| BR-049-04 | Tên người thực hiện lấy từ token, không giả mạo | AC-049-02 | |
| BR-049-05 | Thay đổi quan trọng (phê duyệt/từ chối) được badge nổi bật | AC-049-03 | |
| BR-049-06 | Ghi nhận atomic — thao tác thất bại thì không có bản ghi history | - | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải lịch sử ≤ 1 giây (≤ 100 bản ghi); phân trang khi > 100 | p95 ≤ 1s |
| Security | RBAC trên API; history immutable, kể cả Admin | |
| Reliability | Ghi history atomic với thao tác chính | |
| UX | Card box 2 cột (mobile → dọc); Loading skeleton; Empty state; Màu trước/sau rõ ràng | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-049-01 | AC-049-01 | Đê/kè có lịch sử → card box hiển thị đúng thứ tự | Integration |
| TS-049-02 | AC-049-02 | Card box hiển thị đúng màu cũ/mới | UI |
| TS-049-03 | AC-049-03 | Badge màu đúng cho từng actionType | UI |
| TS-049-04 | AC-049-04 | TAO_MOI → oldValue null, hiển thị "Tạo mới" | Integration |
| TS-049-05 | AC-049-05 | Lọc theo thời gian/người/loại → đúng kết quả | Integration |
| TS-049-06 | AC-049-01 | Không có lịch sử → empty state | UI |
| TS-049-07 | AC-049-06 | Không có nút sửa/xóa trên lịch sử | UI + Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | Yes | Bảng `dike_revetment_approval_history` cần mở rộng theo dõi từng field (fieldChanged, oldValue, newValue) — hiện chỉ có actionType + note |
| Architecture affected? | No | GET endpoint với filter + pagination; ghi history là pattern có sẵn |
| Implementation clear? | Yes | Card box UI là pattern mới nhưng approach rõ ràng (tham chiếu F-025); field-level tracking cần cập nhật service ghi history ở F-044/045/046/047 |
| **Verdict** | `Ready for Technical Lead planning` | Read-only + mở rộng bảng history theo dõi field-level; cần đồng bộ các service ghi history |
