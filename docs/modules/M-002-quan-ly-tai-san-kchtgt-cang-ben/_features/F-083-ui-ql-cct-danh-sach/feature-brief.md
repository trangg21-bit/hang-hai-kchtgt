---
id: F-083
name: "Danh sách Cảng cạn"
slug: ui-ql-cct-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:36Z"
last-updated: "2026-07-01T04:08:36Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Cảng cạn

## Description

Giao diện danh sách Cảng cạn (CangCan) cho phép người dùng quản lý toàn bộ danh sách tài sản cảng cạn trong hệ thống với các khả năng tìm kiếm, lọc và phân trang. Bảng danh sách hiển thị các cột: mã cảng cạn, tên cảng cạn, địa chỉ, tỉnh/thành, trạng thái hoạt động và ngày cập nhật cuối cùng. Người dùng có thể tìm kiếm theo mã cảng cạn, tên cảng cạn hoặc địa chỉ; lọc theo trạng thái hoạt động (HIEN_HANH, TAM_NGUNG) và theo tỉnh/thành. Phân trang mặc định 20 bản ghi mỗi trang, có thể chuyển sang 100 bản ghi. Sắp xếp mặc định theo updatedAt giảm dần. Hành động trên mỗi dòng gồm: xem chi tiết, chỉnh sửa, xóa và xem lịch sử (tất cả vai trò có quyền tương ứng), phê duyệt (chỉ dành cho Lãnh đạo). Giao diện hỗ trợ điều hướng bàn phím bằng Tab/Enter để tăng tốc độ thao tác.

## Business Intent

Cung cấp giao diện danh sách Cảng cạn giúp người dùng và lãnh đạo có thể nhanh chóng tìm kiếm, lọc và quản lý tất cả cảng cạn trong hệ thống, đồng thời thực hiện các thao tác xem, sửa, xóa và phê duyệt một cách trực quan và hiệu quả.

## Flow Summary

Người dùng truy cập trang Danh sách Cảng cạn thông qua menu quản lý tài sản, hệ thống gọi API GET /api/v1/cang-can với các tham số phân trang (page, pageSize=20 hoặc 100), sắp xếp (sortBy=updatedAt, sortOrder=DESC), tìm kiếm (search=maCangCan/tenCangCan/diaChi) và bộ lọc (filterStatus, filterTinhThanh). Kết quả được hiển thị dưới dạng bảng với phân trang và sắp xếp. Người dùng nhập từ khóa tìm kiếm và nhấn Enter để lọc theo mã/tên/địa chỉ cảng cạn. Người dùng chọn trạng thái và tỉnh/thành từ dropdown bộ lọc để thu hẹp kết quả. Nhấp vào dòng bảng sẽ mở trang Chi tiết Cảng cạn (F-084). Nhấp nút Sửa để mở trang cập nhật (F-086), nút Xóa (cho vai trò có quyền) hiển thị hộp thoại xác nhận (F-099), nút Lịch sử hiển thị bảng thay đổi (F-100). Lãnh đạo có thêm nút Phê duyệt mở trang phê duyệt (F-087). Giao diện hỗ trợ Tab/Enter cho điều hướng bàn phím.

## Acceptance Criteria

1. Khi mở trang, hệ thống gọi GET /api/v1/cang-can với pageSize=20, sortBy=updatedAt, sortOrder=DESC, hiển thị danh sách 20 cảng cạn đầu tiên sắp xếp theo thời gian cập nhật giảm dần.
2. Người dùng nhập từ khóa tìm kiếm vào ô tìm kiếm (chứa maCangCan/tenCangCan/diaChi) và nhấn Enter hoặc bấm nút Tìm — hệ thống gọi API với tham số search tương ứng, hiển thị kết quả khớp (ít nhất 1 kết quả hoặc thông báo "không tìm thấy").
3. Người dùng chọn một giá trị trong bộ lọc "Trạng thái" (HIEN_HANH hoặc TAM_NGUNG) và bộ lọc "Tỉnh/Thành" — hệ thống gọi API với filterStatus và filterTinhThanh, bảng cập nhật kết quả phù hợp.
4. Bảng danh sách hiển thị chính xác các cột: maCangCan, tenCangCan, diaChi, tinhThanh, trạng thái (có badge màu), updatedAt — không thiếu cột nào và thứ tự đúng.
5. Nhấp vào bất kỳ dòng nào trong bảng điều hướng người dùng đến trang Chi tiết Cảng cạn (F-084) với đúng entityId.
6. Nút "Sửa" trên mỗi dòng (chỉ hiển thị cho vai trò có quyền update) mở trang Cập nhật Cảng cạn (F-086) với đúng entityId tương ứng.
7. Nút "Xóa" trên mỗi dòng (chỉ hiển thị cho Leadership/Admin) kích hoạt hộp thoại xác nhận F-099, sau khi xác nhận gọi DELETE và danh sách cập nhật.
8. Nút "Phê duyệt" chỉ hiển thị cho vai trò Leadership, mở trang Phê duyệt (F-087) với đúng entityId.
9. Phân trang hiển thị đúng số trang, cho phép chuyển trang bằng nút Next/Previous hoặc nhập số trang trực tiếp, cập nhật danh sách khi chuyển trang.
10. Tất cả các ô nhập liệu, nút và liên kết có thể tiếp cận được bằng phím Tab, phím Enter kích hoạt hành động mặc định (chọn dòng, submit tìm kiếm).

## In Scope

- Hiển thị bảng danh sách Cảng cạn với phân trang, sắp xếp, tìm kiếm và lọc
- Các cột: maCangCan, tenCangCan, diaChi, tinhThanh, trangThaiHoatDong, updatedAt
- Tìm kiếm theo maCangCan, tenCangCan, diaChi
- Lọc theo trangThaiHoatDong (HIEN_HANH/TAM_NGUNG) và tinhThanh
- Phân trang 20 hoặc 100 bản ghi/sự kiện, sắp xếp mặc định updatedAt DESC
- Hành động: xem chi tiết, sửa, xóa, xem lịch sử, phê duyệt (Leaders)
- Điều hướng bàn phím Tab/Enter
- Responsive layout cho màn hình desktop và tablet

## Out of Scope

- Tạo mới Cảng cạn (thuộc F-085)
- Chi tiết từng Cảng cạn với attachment (thuộc F-084 chi tiết)
- Phê duyệt/reject chi tiết (thuộc F-087)
- Xóa Cảng cạn (thuộc F-099)
- Lịch sử thay đổi chi tiết (thuộc F-100)
- Xuất Excel/PDF danh sách
- Phân quyền chi tiết từng hành động (thuộc M-001)

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| NhanVien | read | Xem danh sách Cảng cạn, xem chi tiết, xem lịch sử |
| QuanTriCuc | read, update | Xem, chỉnh sửa Cảng cạn; xem danh sách, chi tiết, lịch sử |
| LanhDaoCuc | read, approve | Xem danh sách, chi tiết, phê duyệt/reject Cảng cạn; xem lịch sử |
| QuanTriHeThong | read, update, delete, approve | Toàn quyền: xem, tạo, sửa, xóa, phê duyệt, xem lịch sử |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id(UUID), maCangCan(string unique), tenCangCan(string), diaChi(string), tinhThanh(string), ghiChu(text), trangThaiHoatDong(enum), trangThaiPheDuyet(enum), orgUnitId(UUID), createdBy(UUID), updatedBy(UUID), createdAt, updatedAt, deletedAt(nullable) |
| PaginationResult | total(int), page(int), pageSize(int), data:CangCan[] |
| FilterParams | search(string), filterStatus(enum), filterTinhThanh(string) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-083-01 | maCangCan phải là duy nhất trong toàn hệ thống; không cho phép tạo mới hoặc sửa có trùng mã | F-083, F-085, F-086 | Spec |
| BR-083-02 | Giá trị mặc định của trangThaiPheDuyet khi tạo mới là CHO_PHE_DUYET | F-085 | Spec |
| BR-083-03 | Soft-delete: khi xóa, đặt deletedAt thay vì xóa vật lý; không có guard xóa bản ghi con vì CangCan không có thực thể con | F-099 | Spec |
| BR-083-04 | Reject yêu cầu phê duyệt phải có lý do ít nhất 10 ký tự | F-087 | Spec |
| BR-083-05 | Khi cập nhật Cảng cạn, trangThaiPheDuyet được đặt lại về CHO_PHE_DUYET để chờ phê duyệt lại | F-086 | Spec |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào các thành phần UI: component hiển thị bảng, component phân trang, component tìm kiếm, component bộ lọc — kiểm tra render đúng các cột, xử lý sự kiện click/tab/enter, và hiển thị dữ liệu từ mock API response. Kiểm thử tích hợp (integration test) xác nhận việc gọi đúng các endpoint API GET /api/v1/cang-can với các tham số phân trang, sắp xếp, tìm kiếm và lọc, đồng thời xác nhận việc phân trang cập nhật danh sách khi chuyển trang. Kiểm thử khả năng tiếp cận (accessibility test) đảm bảo Tab/Enter điều hướng đúng các tương tác. Kiểm thử RBAC: mỗi vai trò chỉ thấy các hành động (nút Sửa, Xóa, Phê duyệt) mà họ có quyền theo auth.check. Kiểm thử nghiệp vụ: tạo dữ liệu giả có mã trùng, trạng thái khác nhau, tỉnh/thành khác nhau — xác nhận tìm kiếm, lọc và phân trang hoạt động chính xác.
