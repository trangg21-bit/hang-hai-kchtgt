---
id: F-100
name: "Lịch sử Cảng cạn"
slug: ui-ql-cct-lich-su
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:09:13Z"
last-updated: "2026-07-01T04:09:13Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Lịch sử Cảng cạn

## Description

Giao diện Lịch sử Cảng cạn (CangCan) cho phép người dùng xem toàn bộ lịch sử thay đổi của một cảng cạn cụ thể thông qua bảng danh sách các bản ghi LichSuThayDoi. Bảng hiển thị các cột: tên trường thay đổi (Field), giá trị cũ (Old Value), giá trị mới (New Value), người thay đổi (Changed By), thời gian thay đổi (Changed At). Các bản ghi được sắp xếp theo changedAt giảm dần (mới nhất lên đầu). Có bộ lọc theo tên trường (Field filter dropdown) để người dùng chỉ xem các thay đổi của một trường cụ thể (ví dụ: chỉ xem thay đổi của tenCangCan). Giao diện phân biệt loại hành động "Tạo mới" (actionType=CREATE) và "Cập nhật" (actionType=UPDATE) bằng badge màu hoặc ký hiệu: "Tạo mới" hiển thị badge xanh, "Cập nhật" hiển thị badge vàng. Dữ liệu được tải từ API GET /:id/history khi người dùng mở trang Lịch sử từ trang Chi tiết (F-084) hoặc từ trang Danh sách (F-083).

## Business Intent

Cung cấp khả năng truy xuất toàn bộ lịch sử thay đổi của một cảng cạn giúp người dùng và lãnh đạo giám sát, kiểm tra và giải trình mọi thay đổi dữ liệu, đảm bảo tính minh bạch và trách nhiệm giải trình trong quản lý tài sản giao thông vận tải biển.

## Flow Summary

Người dùng truy cập trang Chi tiết Cảng cạn (F-084) và bấm nút "Lịch sử" để mở trang Lịch sử Cảng cạn (F-100) với entityId tương ứng. Hệ thống gọi API GET /api/v1/cang-can/:id/history để tải tất cả LichSuThayDoi record của cảng cạn đó. Dữ liệu được hiển thị dưới dạng bảng phân trang với các cột: actionType (badge "Tạo mới" xanh hoặc "Cập nhật" vàng), field, oldValue, newValue, changedBy (tên người dùng), changedAt (định dạng ngày/giờ). Bảng mặc định sắp xếp theo changedAt DESC. Người dùng có thể lọc theo field bằng cách chọn từ dropdown bộ lọc — hệ thống gọi lại API với tham số filterField tương ứng. Mỗi hàng cho biết chính xác trường nào đã thay đổi, giá trị cũ là gì, giá trị mới là gì, ai là người thay đổi và khi nào thay đổi. Người dùng có thể bấm nút "Quay lại" để trở về trang Chi tiết (F-084).

## Acceptance Criteria

1. Khi mở trang Lịch sử, hệ thống gọi GET /api/v1/cang-can/:id/history, trả về danh sách LichSuThayDoi record của cảng cạn được chỉ định, sắp xếp theo changedAt DESC.
2. Bảng hiển thị chính xác các cột: actionType (badge "Tạo mới" hoặc "Cập nhật"), field, oldValue, newValue, changedBy (tên người dùng), changedAt (định dạng ngày/giờ) — không thiếu cột nào.
3. Bản ghi đầu tiên trong danh sách luôn là bản ghi "Tạo mới" (actionType=CREATE) khi cảng cạn được tạo lần đầu, hiển thị badge màu xanh.
4. Các bản ghi sau đó là các bản ghi "Cập nhật" (actionType=UPDATE) khi cảng cạn được chỉnh sửa, hiển thị badge màu vàng.
5. Người dùng chọn một giá trị trong bộ lọc "Trường" (Field filter dropdown) — hệ thống gọi API với filterField tương ứng, chỉ hiển thị các bản ghi thay đổi trường được chọn.
6. Nhấp nút "Quay lại" hoặc breadcrumb "Chi tiết" điều hướng người dùng quay về trang Chi tiết Cảng cạn (F-084) với đúng entityId.
7. Phân trang hiển thị đúng số trang, cho phép chuyển trang — mặc định 20 bản ghi mỗi trang.
8. Cột changedBy hiển thị tên người dùng (không phải UUID) — hệ thống resolve UUID sang tên người dùng từ dịch vụ người dùng.
9. oldValue và newValue hiển thị giá trị ở dạng chuỗi dễ đọc — nếu giá trị tương đương null/empty, hiển thị "—".
10. Người dùng không có quyền read không thể truy cập trang Lịch sử — điều này được kiểm soát bởi RBAC ở cấp giao diện.

## In Scope

- Bảng LichSuThayDoi records của một cảng cạn
- Cột: field, oldValue, newValue, changedBy, changedAt
- Sắp xếp mặc định changedAt DESC
- Badge "Tạo mới" (CREATE, xanh) và "Cập nhật" (UPDATE, vàng)
- Lọc theo field (Field filter dropdown)
- Phân trang 20 bản ghi mỗi trang
- Breadcrumb/nút "Quay lại" → F-084
- Resolve changedBy UUID → tên người dùng

## Out of Scope

- Xóa bản ghi lịch sử
- Xuất Excel/PDF lịch sử thay đổi
- So sánh hai thời điểm thay đổi (diff view)
- Tìm kiếm theo nội dung oldValue/newValue
- Thông báo khi có thay đổi mới
- Phân quyền chi tiết từng hành động (thuộc M-001)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Xem lịch sử thay đổi của Cảng cạn |
| QuanTriCuc | read | Xem lịch sử thay đổi của Cảng cạn |
| LanhDaoCuc | read | Xem lịch sử thay đổi của Cảng cạn |
| QuanTriHeThong | read | Xem lịch sử thay đổi của Cảng cạn |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| LichSuThayDoi | id(UUID), cangCanId(UUID), actionType(enum CREATE/UPDATE), field(string), oldValue(string), newValue(string), changedBy(UUID), changedAt(timestamp) |
| HistoryResponse | data:LichSuThayDoi[], total(int), page(int), pageSize(int) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-100-01 | Mọi hành động Tạo mới và Cập nhật Cảng cạn phải được ghi nhận vào LichSuThayDoi record bởi backend | F-100, F-085, F-086 | Spec |
| BR-100-02 | Lịch sử thay đổi được sắp xếp theo changedAt giảm dần (mới nhất lên đầu) | F-100, INT-003 | Spec |
| BR-100-03 | Badge hành động phân biệt rõ: "Tạo mới" (CREATE, màu xanh) và "Cập nhật" (UPDATE, màu vàng) | F-100 | Spec |
| BR-100-04 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-100, F-085, F-086 | Spec |
| BR-100-05 | Soft-delete: CangCan không có thực thể con nên khi xóa chỉ cần đặt deletedAt, không cần kiểm tra guard | F-099 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào component bảng Lịch sử: render đúng tất cả các cột (actionType badge, field, oldValue, newValue, changedBy, changedAt), badge màu đúng ("Tạo mới" xanh, "Cập nhật" vàng), component dropdown bộ lọc Field, component phân trang. Mock API response với các bản ghi CREATE và UPDATE khác nhau, xác nhận bảng hiển thị đúng thứ tự changedAt DESC. Kiểm thử tích hợp (integration test): gọi GET /api/v1/cang-can/:id/history, xác nhận danh sách LichSuThayDoi trả về chính xác; gọi với filterField, xác nhận chỉ trả về bản ghi của trường được chọn. Kiểm thử nghiệp vụ: tạo 1 cảng cạn (bản ghi CREATE đầu tiên), chỉnh sửa 2 trường (2 bản ghi UPDATE), xác nhận bảng có 3 bản ghi với đúng oldValue/newValue; lọc theo từng field — mỗi lần chỉ hiển thị bản ghi của field đó. Kiểm thử RBAC: tất cả các vai trò (NhanVien, QuanTriCuc, LanhDaoCuc, QuanTriHeThông) đều có thể xem lịch sử thay đổi. Kiểm thử định dạng: changedBy resolve UUID → tên người dùng, oldValue/newValue null hiển thị "—".
