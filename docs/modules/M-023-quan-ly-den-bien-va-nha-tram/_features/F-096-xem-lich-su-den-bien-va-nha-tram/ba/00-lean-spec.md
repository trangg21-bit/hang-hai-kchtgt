---
feature-id: F-096
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---
# Xem lịch sử Đèn biển và nhà trạm gắn với Đèn biển

## Summary

Hiển thị toàn bộ lịch sử thay đổi của một DBNT dưới dạng card box theo thứ tự thời gian giảm dần. Mỗi card hiển thị metadata (thời gian, người thực hiện) + nội dung diff (trường thay đổi, giá trị cũ→mới với màu sắc phân biệt). Tổng hợp sự kiện từ F-092 (tạo mới), F-094 (cập nhật), F-095 (xóa mềm), F-097 (gửi duyệt/phê duyệt/từ chối). Có bộ lọc theo thời gian, người thực hiện, loại hành động. Dữ liệu lịch sử bất biến, append-only.

## Scope

| | Items |
|---|---|
| In scope | Danh sách card box chronologically; Chi tiết mỗi sự kiện (loại, trường, giá trị cũ/mới, người, thời gian); Lọc theo thời gian/người/loại hành động; 6 badge màu; Tích hợp sự kiện từ F-092/F-094/F-095/F-097 |
| Out of scope | Sửa/xóa bản ghi lịch sử; So sánh 2 phiên bản; Xuất Excel/PDF; Khôi phục về phiên bản cũ |
| Assumptions | Bảng lịch sử đã có; Các tính năng nguồn ghi sự kiện vào bảng này; User đã xác thực |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Quản lý | Xem toàn bộ lịch sử thay đổi của DBNT | Biết ai thay đổi gì, khi nào | Must Have |
| US-002 | Lãnh đạo | Xem lịch sử phê duyệt/từ chối | Kiểm tra quy trình | Must Have |
| US-003 | Kiểm toán | Truy vết mọi thay đổi | Phục vụ kiểm toán | Must Have |
| US-004 | Quản lý | Lọc lịch sử theo thời gian/người/loại | Tìm nhanh sự kiện cần | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given/When/Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Hiển thị card box | Given DBNT có lịch sử; When vào trang; Then danh sách card box mới nhất lên đầu | Mỗi card 2 phần: metadata + diff |
| AC-002 | US-001 | Hiển thị diff | Given sự kiện cập nhật; When xem card; Then tên trường + giá trị cũ (đỏ) → giá trị mới (xanh) | Giá trị cũ nền #FFF0F0, mới nền #E8F5E9 |
| AC-003 | US-001 | Sự kiện tạo mới | Given sự kiện TAO_MOI; Then "Tạo mới" + danh sách giá trị ban đầu | |
| AC-004 | US-004 | Lọc theo thời gian | Given filter từ ngày-đến ngày; Then chỉ hiện sự kiện trong khoảng | start > end → lỗi |
| AC-005 | US-004 | Lọc theo loại hành động | Given chọn "Cập nhật"; Then chỉ hiện card Cập nhật | Multi-select |
| AC-006 | US-001 | Badge màu | Given card box; Then badge màu: Tạo mới(xanh lá), Cập nhật(xanh dương), Gửi duyệt(cam), Phê duyệt(xanh đậm), Từ chối(đỏ), Xóa mềm(xám) | |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | Mọi thay đổi DBNT tự động ghi lịch sử | Tất cả sự kiện | Không có ngoại lệ |
| BR-002 | Lịch sử append-only, không UPDATE/DELETE | US-001 | Vi phạm là sự cố bảo mật |
| BR-003 | Lưu trữ vĩnh viễn | US-003 | |
| BR-004 | Tên người thực hiện lấy từ tài khoản đăng nhập | US-001 | Không thể giả mạo |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | Load ≤ 1s cho ≤ 100 bản ghi; phân trang khi > 100 | |
| Security | Không ai được sửa/xóa lịch sử (kể cả Admin) | |
| Reliability | Ghi lịch sử atomic với thao tác nguồn | Transactional |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | DBNT có 4 loại sự kiện → hiển thị đủ | Integration |
| TS-002 | AC-002 | Card cập nhật hiển thị đúng diff màu | Integration |
| TS-003 | AC-003 | Card tạo mới không có giá trị cũ | Integration |
| TS-004 | AC-004 | Lọc ngày ngược → lỗi validation | Unit / Negative |
| TS-005 | AC-006 | Kiểm tra đúng 6 màu badge | UI |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read trên bảng lịch sử |
| Architecture affected? | Yes | Cơ chế append-only, transaction write, field-level permission |
| Implementation clear? | No | Cần SA: cơ chế ghi lịch sử (interceptor/AOP/trigger), cấu trúc bảng diff |
| **Verdict** | `Ready for solution architecture` | |
