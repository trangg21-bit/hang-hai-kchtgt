---
feature-id: F-061
document: lean-spec
output-mode: lean
last-updated: 2026-08-07
---
# Lịch sử Trạm radar

## Summary

Hệ thống cần hiển thị toàn bộ lịch sử thay đổi của Trạm radar dưới dạng card box, bao gồm mọi thao tác: tạo mới (F-056), cập nhật (F-057), phê duyệt C1/C2/từ chối (F-059), xóa mềm (F-058). Mỗi card box gồm 2 phần: metadata (thời gian, người cập nhật, nguồn CSDL) và nội dung thay đổi (danh sách trường với giá trị cũ → mới, phân biệt màu sắc). Hỗ trợ lọc theo khoảng thời gian, người thực hiện, loại sự kiện. Dữ liệu read-only, bất biến.

## Scope

| | Items |
|---|---|
| In scope | Danh sách card box theo thời gian giảm dần; Card box 2 phần: metadata + nội dung; Màu sắc giá trị cũ (đỏ nhạt #FFF0F0) / mới (xanh nhạt #E8F5E9); Badge màu theo loại hành động; Hiển thị đặc biệt cho Tạo mới, Xóa mềm, Phê duyệt C1/C2, Từ chối; Bộ lọc: khoảng thời gian, người thực hiện, loại sự kiện; Phân trang khi > 20 card; Read-only, không thể sửa/xóa |
| Out of scope | Xuất báo cáo Excel/PDF; Chỉnh sửa lịch sử |
| Assumptions | Bảng ApprovalHistory đã có dữ liệu từ các thao tác F-056, F-057, F-058, F-059; Người dùng đã đăng nhập |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-061-01 | Quản lý tài sản | Xem toàn bộ lịch sử thay đổi của trạm radar | Biết ai thay đổi gì, khi nào | Must Have |
| US-061-02 | Lãnh đạo | Xem lịch sử phê duyệt/từ chối | Kiểm tra quy trình đúng chưa | Must Have |
| US-061-03 | Kiểm toán viên | Truy vết mọi thay đổi | Phục vụ kiểm toán | Must Have |
| US-061-04 | Quản lý tài sản | Lọc lịch sử theo thời gian/người thực hiện | Tìm nhanh thay đổi cần xem | Should Have |
| US-061-05 | Admin | Xuất báo cáo lịch sử ra Excel/PDF | Lưu trữ, báo cáo | Could Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given / When / Then | Constraints |
|---|---|---|---|---|
| AC-061-01 | US-061-01 | Danh sách card box | Given có lịch sử; When GET history; Then hiển thị card box, mới nhất lên đầu | Nếu không có → "Không có lịch sử thay đổi" |
| AC-061-02 | US-061-01 | Metadata card box | Given mỗi card; When hiển thị; Then thời gian (HH:mm:ss dd/MM/yyyy), người cập nhật (họ tên), nguồn (CSDL) | |
| AC-061-03 | US-061-01 | Nội dung thay đổi | Given card box; When hiển thị; Then tên trường → giá trị cũ → giá trị mới, màu sắc phân biệt | Tạo mới: "Tạo mới" thay giá trị cũ; Xóa mềm: "Xóa mềm" |
| AC-061-04 | US-061-04 | Bộ lọc | Given người dùng; When chọn filter; Then lọc theo khoảng thời gian, người thực hiện, loại sự kiện | |
| AC-061-05 | US-061-01 | Read-only | Given lịch sử; When hiển thị; Then không có nút sửa/xóa | |
| AC-061-06 | US-061-01 | Badge loại hành động | Given card box; When hiển thị; Then badge màu: Tạo mới (xanh lá), Cập nhật (xanh dương), Phê duyệt (xanh dương đậm), Từ chối (đỏ), Xóa mềm (xám) | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-061-01 | Mọi thao tác tự động ghi ApprovalHistory | AC-061-01 | Không có ngoại lệ |
| BR-061-02 | Lịch sử read-only, bất biến | AC-061-05 | Không có ngoại lệ |
| BR-061-03 | Lưu trữ vĩnh viễn | AC-061-01 | Không có ngoại lệ |
| BR-061-04 | Người thực hiện lấy từ token, không giả mạo được | AC-061-02 | Không có ngoại lệ |
| BR-061-05 | Phê duyệt/từ chối được badge màu nổi bật | AC-061-06 | Không có ngoại lệ |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Tải danh sách ≤ 100 bản ghi | ≤ 1 giây |
| Performance | Phân trang khi > 100 bản ghi | 20/50/100 |
| Security | RBAC; dữ liệu không thể sửa/xóa | HTTP 403 |
| UX | Card box dễ đọc; responsive (mobile: 2 cột → dọc); loading skeleton | WCAG 2.1 AA |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-061-01 | AC-061-01 | Happy path: Xem lịch sử có nhiều card box | Integration |
| TS-061-02 | AC-061-01 | Edge: Không có lịch sử → "Không có lịch sử thay đổi" | Integration |
| TS-061-03 | AC-061-03 | Edge: Card Tạo mới → hiển thị "Tạo mới" + giá trị ban đầu | Integration |
| TS-061-04 | AC-061-03 | Edge: Card Phê duyệt C1 → "PROPOSED → UNDER_REVIEW" | Integration |
| TS-061-05 | AC-061-04 | Edge: Lọc theo khoảng thời gian → đúng kết quả | Integration |
| TS-061-06 | AC-061-05 | Negative: Gọi PUT/DELETE API lịch sử → HTTP 405 | Security |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Chỉ đọc bảng ApprovalHistory hiện có |
| Architecture affected? | No | GET API + filter pattern hiện có |
| Implementation clear? | Yes | Card box UI, filter, phân trang |
| **Verdict** | `Ready for Technical Lead planning` | Trang lịch sử read-only, không có quyết định kiến trúc mới |
