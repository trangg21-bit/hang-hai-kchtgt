---
feature-id: F-092
document: lean-spec
output-mode: lean
last-updated: 2026-08-05
---
# Xem danh sách Đèn biển và nhà trạm gắn với Đèn biển

## Summary

Màn hình gộp tra cứu, xem danh sách và tìm kiếm DBNT vào một giao diện duy nhất. Hiển thị bảng danh sách với các cột thông tin chính, bộ lọc tìm kiếm, phân trang, và action dropdown trên từng dòng. Là màn hình chính để quản lý toàn bộ DBNT — người dùng vào đây để tra cứu và thực hiện mọi thao tác tiếp theo.

## Scope

| | Items |
|---|---|
| In scope | Bảng BasicTable với các cột hiển thị mặc định; Bộ lọc 9 field (fkDonViQl required, tenMa, status, fkCangBien, fkDonViVh, capTramDen, tinhTrang, ngayCapNhat, diaDiem); Phân trang (page/size); Sắp xếp updatedDate; Action dropdown 6 nút (Xem/Sửa/Xóa/Gửi duyệt/Phê duyệt/Xem vị trí) theo điều kiện |
| Out of scope | Tạo mới (F-092); Sửa (F-094); Xóa (F-095); Xuất Excel/PDF |
| Assumptions | Dữ liệu DBNT đã có trong DB; Người dùng đã xác thực; API search đã được định nghĩa |

## User Stories

| US-ID | Actor | Goal | Value | Priority |
|---|---|---|---|---|
| US-001 | Người dùng | Xem danh sách DBNT với đầy đủ cột thông tin | Nắm tổng quan toàn bộ đèn biển | Must Have |
| US-002 | Người dùng | Tìm kiếm/lọc theo nhiều tiêu chí | Tìm nhanh bản ghi cần | Must Have |
| US-003 | Người dùng | Bấm action trên dòng để chuyển sang màn tương ứng | Điều hướng nhanh | Must Have |
| US-004 | Người dùng | Phân trang và xem tổng số bản ghi | Điều hướng dữ liệu lớn | Should Have |

## Acceptance Criteria

| AC-ID | US-ref | Scenario | Given/When/Then | Constraints |
|---|---|---|---|---|
| AC-001 | US-001 | Load danh sách | Given user vào QLKC_052; When chọn đơn vị QL; Then bảng hiển thị danh sách DBNT | fkDonViQl required |
| AC-002 | US-002 | Lọc theo tên/mã | Given danh sách đang hiển thị; When nhập text vào tenMa; Then danh sách lọc theo tên hoặc mã gần đúng | Max 255 |
| AC-003 | US-002 | Lọc theo trạng thái | Given danh sách; When chọn status; Then chỉ hiển thị bản ghi có trạng thái đó | Group TRANG_THAI_KCHT |
| AC-004 | US-002 | Lọc ngày cập nhật | Given danh sách; When chọn khoảng ngày; Then chỉ hiển thị bản ghi trong khoảng | Max 1 năm |
| AC-005 | US-003 | Action dropdown | Given danh sách; When xem action column; Then hiển thị nút theo điều kiện (vai trò + trạng thái) | 6 loại action |
| AC-006 | US-004 | Phân trang | Given danh sách > 20; Then hiển thị phân trang, tổng số bản ghi | Default page=0, size=20 |

## Business Rules

| BR-ID | Rule | Applies to | Exception |
|---|---|---|---|
| BR-001 | fkDonViQl bắt buộc chọn để load dữ liệu | AC-001 | Không có |
| BR-002 | Ngày cập nhật filter giới hạn tối đa 1 năm | AC-004 | Không có |
| BR-003 | Action hiển thị theo điều kiện vai trò + trạng thái | AC-005 | Cấp Cục thấy Phê duyệt khi S_1 |
| BR-004 | Cấp Cục/Admin thấy toàn bộ; Chi cục chỉ thấy đơn vị mình | AC-001 | |

## Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| Performance | API search ≤ 1 giây | < 100 concurrent |
| Security | Phân quyền server-side; chỉ trả dữ liệu thuộc phạm vi user | |
| UX | Skeleton table khi load; empty state khi không có dữ liệu | |

## Test Scenarios

| TS-ID | AC-ref | Scenario | Type |
|---|---|---|---|
| TS-001 | AC-001 | Vào trang danh sách, chọn đơn vị QL → load thành công | Acceptance |
| TS-002 | AC-002 | Nhập tên → danh sách lọc đúng | Integration |
| TS-003 | AC-005 | Cấp Cục thấy nút Phê duyệt trên dòng S_1 | Acceptance |
| TS-004 | AC-005 | Chi cục không thấy nút Phê duyệt | Acceptance |
| TS-005 | AC-004 | Chọn khoảng ngày > 1 năm → lỗi validation | Unit / Negative |

## Pipeline Triage

| Question | Answer | Rationale |
|---|---|---|
| Domain model affected? | No | Read-only trên DBNT đã có |
| Architecture affected? | Yes | API search với filter, phân trang, RBAC data-scope |
| Implementation clear? | No | Cần SA: query optimization, column visibility toggle |
| **Verdict** | `Ready for solution architecture` | |
