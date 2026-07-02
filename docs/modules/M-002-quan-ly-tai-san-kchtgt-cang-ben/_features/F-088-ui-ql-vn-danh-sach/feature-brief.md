---
id: F-088
name: "Danh sách Vùng nước"
slug: ui-ql-vn-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T04:08:43Z"
last-updated: "2026-07-01T04:08:43Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Vùng nước

## Description

Tính năng Danh sách Vùng nước cung cấp giao diện bảng liệt kê tất cả các vùng nước thuộc cảng biển được quản lý trong hệ thống, với khả năng phân trang (20 hoặc 100 mục/trang), sắp xếp mặc định theo trường updatedAt giảm dần (mới nhất hiển thị đầu tiên). Người dùng có thể tìm kiếm nhanh bằng mã vùng nước (`maVungNuoc`) hoặc tên vùng nước (`tenVungNuoc`), đồng thời lọc theo trạng thái hoạt động (`HIEN_HANH`, `TAM_NGUNG`) và theo cảng mẹ (`cangBienId`). Bảng hiển thị các trường: mã vùng nước, tên vùng nước, loại vùng nước, cảng mẹ, diện tích (km²), độ sâu max, độ sâu trung bình, trạng thái hoạt động (badge màu), trạng thái phê duyệt, và ngày cập nhật cuối cùng. Từ bảng danh sách, người dùng có thể thực hiện các hành động: xem chi tiết, chỉnh sửa, xóa (dùng soft-delete) và xem lịch sử thay đổi. Đối với người dùng có vai trò Lãnh đạo/Phê duyệt, thêm hành động Phê duyệt vùng nước trong trạng thái chờ duyệt. Giao diện hỗ trợ điều hướng bằng bàn phím: Tab để di chuyển giữa các trường filter và Enter để kích hoạt hành động. Bộ lọc `cangBienId` được truyền thẳng xuống API thông qua cơ chế INT-004: `VungNuocService.findAll` chuyển tiếp tham số `cangBienId` xuống `VungNuocRepository.findAllActive(orgUnitId, cangBienId, pageable)`.

## Business Intent

Cho phép người dùng quản lý, theo dõi và rà soát toàn bộ danh sách vùng nước đang tồn tại trong hệ thống quản lý tài sản cảng biển, hỗ trợ ra quyết định nhanh chóng thông qua bộ lọc, tìm kiếm và phân trang hiệu quả.

## Flow Summary

Người dùng mở trang Danh sách Vùng nước từ menu quản lý cảng biển. Hệ thống gọi API `GET /api/v1/vung-nuoc` với các tham số phân trang (`page`, `size`), sắp xếp (`sortBy=updatedAt,sortDir=DESC`) và các bộ lọc tùy chọn. Dữ liệu trả về được hiển thị trên bảng với các cột cố định và badge màu cho trạng thái. Người dùng nhập từ khóa tìm kiếm vào ô tìm kiếm (search bằng `maVungNuoc` hoặc `tenVungNuoc`), chọn trạng thái từ dropdown (tất cả / HIEN_HANH / TAM_NGUNG), và chọn cảng mẹ từ dropdown (danh sách các CangBien có `trangThaiHoatDong = HIEN_HANH`). Khi bộ lọc thay đổi, danh sách tự động refresh (debounce 300ms). Người dùng click vào tên vùng nước để chuyển sang trang Chi tiết, hoặc click nút hành động (sửa/xóa/phê duyệt/lịch sử). Phân trang hiển thị điều hướng với số trang hiện tại và tổng số trang. Khi không có kết quả, hiển thị thông báo "Không có dữ liệu".

## Acceptance Criteria

1. Khi mở trang, hệ thống gọi `GET /api/v1/vung-nuoc?page=0&size=20&sortBy=updatedAt&sortDir=DESC` và hiển thị danh sách vùng nước phân trang đúng 20 mục.
2. Tìm kiếm nhập vào ô "Tìm kiếm" với từ khóa chứa trong `maVungNuoc` hoặc `tenVungNuoc` trả về danh sách kết quả phù hợp, ví dụ nhập "VN-001" hiển thị vùng nước có mã "VN-001".
3. Lọc theo trạng thái hoạt động chọn "HIEN_HANH" chỉ hiển thị các vùng nước có `trangThaiHoatDong = HIEN_HANH`; chọn "TAM_NGUNG" chỉ hiển thị `TAM_NGUNG`; chọn "Tất cả" hiển thị toàn bộ.
4. Lọc theo cảng mẹ (`cangBienId`) bằng cách chọn một cảng từ dropdown, API được gọi với tham số `?cangBienId={id}` và chỉ hiển thị các vùng nước thuộc cảng được chọn (INT-004).
5. Sắp xếp theoUpdatedAt giảm dần: mục được cập nhật mới nhất hiển thị đầu tiên, các mục có cùng updatedAt được sắp xếp theo thứ tự không xác định.
6. Click nút "Xem chi tiết" (hoặc tên vùng nước) chuyển người dùng đến trang Chi tiết Vùng nước với đúng ID được chọn.
7. Click nút "Chỉnh sửa" chuyển người dùng đến trang Tạo/Cập nhật Vùng nước với dữ liệu pre-filled của vùng nước được chọn.
8. Click nút "Xóa" hiển thị hộp thoại xác nhận có nút "Hủy" và "Xác nhận xóa"; sau khi xác nhận, gọi `DELETE /api/v1/vung-nuoc/{id}` và danh sách tự động refresh.
9. Click nút "Phê duyệt" (chỉ hiển thị cho người dùng có quyền approve và vùng nước có `trangThaiPheDuyet = CHO_PHE_DUYET`) chuyển người dùng đến trang Phê duyệt Vùng nước với đúng ID.
10. Click nút "Lịch sử" chuyển người dùng đến trang Lịch sử Vùng nước với đúng ID được chọn.
11. Phân trang hiển thị đúng tổng số trang dựa trên tổng số kết quả và kích thước trang (20 hoặc 100), click chuyển trang reload dữ liệu đúng trang được chọn.
12. Giao diện hỗ trợ điều hướng bằng bàn phím: Tab di chuyển giữa các ô input, dropdown và nút; Enter kích hoạt hành động của nút được focus.

## In Scope

- Bảng danh sách vùng nước với phân trang, sắp xếp, tìm kiếm và lọc
- Hiển thị badge trạng thái hoạt động (màu xanh cho HIEN_HANH, màu đỏ cho TAM_NGUNG)
- Hiển thị badge trạng thái phê duyệt (màu vàng cho CHO_PHE_DUYET, màu xanh cho DUOC_PHE_DUYET, màu đỏ cho TU_CHOI)
- Liên kết tên cảng mẹ (cangBienId) đến trang Chi tiết Cảng biển tương ứng
- Các hành động: Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt (dành cho Leaders), Lịch sử
- Bộ lọc cangBienId được chuyển tiếp xuống API (INT-004)
- Điều hướng bàn phím (Tab/Enter)
- Thông báo toast thành công/báo lỗi sau mỗi hành động

## Out of Scope

- Xuất danh sách ra file Excel/PDF
- Import dữ liệu hàng loạt từ file
- CRUD vùng nước (các tính năng này nằm ở F-090, F-091, F-101, F-092)
- Quản lý attachment (quản lý tài liệu đi kèm thuộc F-089)
- Dashboard hoặc thống kê số lượng vùng nước theo cảng
- Tìm kiếm nâng cao với regex hoặc wildcard

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Full access | Đọc, tạo, sửa, xóa, phê duyệt tất cả vùng nước của cảng |
| NhanVienCangBien (Nhân viên cảng) | Read/Write | Chỉ đọc và tạo, sửa vùng nước; không có quyền xóa hoặc phê duyệt |
| QuanTramMien (Quan tra miền) | Read | Chỉ đọc danh sách, không có quyền chỉnh sửa, xóa hoặc phê duyệt |
| LeDuan (Lãnh đạo) | Full + Approve | Có thêm quyền phê duyệt/từ chối vùng nước trong trạng thái chờ duyệt |

## Entities

| Entity | Fields |
|---|---|
| VungNuoc | id (UUID), maVungNuoc (string, unique, length≤50), tenVungNuoc (string, length≤255), cangBienId (UUID, parent), dienTich (BigDecimal, precision 15 scale 2), doSauMax (BigDecimal, precision 10 scale 2), doSauTrungBinh (BigDecimal, precision 10 scale 2), loaiVungNuoc (string, length≤100), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Mã vùng nước (`maVungNuoc`) phải là duy nhất trên toàn hệ thống | POST, PUT | Entity constraint |
| BR-02 | Cảng mẹ (`cangBienId`) phải tồn tại và có `trangThaiHoatDong = HIEN_HANH` trước khi tạo mới | POST | Parent guard |
| BR-03 | `dienTich` (precision 15 scale 2), `doSauMax` (precision 10 scale 2), `doSauTrungBinh` (precision 10 scale 2) phải là giá trị số hợp lệ | POST, PUT | Type validation |
| BR-04 | Trạng thái phê duyệt mặc định khi tạo mới là `CHỜ_PHÊ_DUYỆT` | POST | Default value |
| BR-05 | Hành động xóa sử dụng soft-delete (đặt `deletedAt` = current timestamp), không kiểm tra con vì VungNuoc là leaf entity | DELETE | Soft-delete pattern |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào các business rule trên backend: xác nhận mã duy nhất, kiểm tra trạng thái cảng mẹ, và validation phạm vi các trường số (dienTich, doSauMax, doSauTrungBinh). Kiểm thử tích hợp (integration test) xác nhận API endpoint `GET /api/v1/vung-nuoc` trả về đúng kết quả khi có tham số `cangBienId`, `page`, `size`, `sortBy`, `sortDir`, và trạng thái lọc. Kiểm thử E2E/UI sử dụng browser automation để verify: danh sách hiển thị đúng dữ liệu, phân trang hoạt động chính xác, tìm kiếm và lọc trả về kết quả đúng, các hành động (xem, sửa, xóa, phê duyệt, lịch sử) chuyển hướng đúng trang, và hộp thoại xác nhận hoạt động chính xác. Kiểm thử RBAC đảm bảo các hành động chỉ thực thi được khi người dùng có quyền tương ứng theo `@auth.check`.
