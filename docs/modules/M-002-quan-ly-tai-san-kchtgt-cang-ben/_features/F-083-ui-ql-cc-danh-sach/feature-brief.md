---
id: F-083
name: "Danh sách Cảng cạn"
slug: ui-ql-cc-danh-sach
module-id: M-002
status: proposed
classification: local
priority: medium
created: "2026-07-01T06:56:20Z"
last-updated: "2026-07-01T06:56:20Z"
locked-fields: []
consumed_by_modules: []
---

# Feature: Danh sách Cảng cạn

## Description

Tính năng Danh sách Cảng cạn cung cấp giao diện bảng liệt kê tất cả các cảng cạn thuộc cảng biển được quản lý trong hệ thống, với khả năng phân trang (20 hoặc 100 mục/trang), sắp xếp mặc định theo trường updatedAt giảm dần (mới nhất hiển thị đầu tiên). Người dùng có thể tìm kiếm nhanh bằng mã cảng cạn (`maCangCan`) hoặc tên cảng cạn (`tenCangCan`), đồng thời lọc theo trạng thái hoạt động (`HIEN_HANH`, `TAM_NGUNG`) và theo trạng thái phê duyệt (`CHO_PHE_DUYET`, `DUOC_PHE_DUYET`, `TU_CHOI`). Bảng hiển thị các trường: mã cảng cạn, tên cảng cạn, tỉnh/thành phố, diện tích (m²), công suất TEU, tọa độ (vĩ độ, kinh độ), trạng thái hoạt động (badge màu), trạng thái phê duyệt, và ngày cập nhật cuối cùng. Từ bảng danh sách, người dùng có thể thực hiện các hành động: xem chi tiết, chỉnh sửa, xóa (dùng soft-delete) và xem lịch sử thay đổi. Đối với người dùng có vai trò Lãnh đạo/Phê duyệt, thêm hành động Phê duyệt cảng cạn trong trạng thái chờ duyệt. Giao diện hỗ trợ điều hướng bằng bàn phím: Tab để di chuyển giữa các trường filter và Enter để kích hoạt hành động.

## Business Intent

Cho phép người dùng quản lý, theo dõi và rà soát toàn bộ danh sách cảng cạn đang tồn tại trong hệ thống quản lý tài sản cảng biển, hỗ trợ ra quyết định nhanh chóng thông qua bộ lọc, tìm kiếm và phân trang hiệu quả.

## Flow Summary

Người dùng mở trang Danh sách Cảng cạn từ menu quản lý cảng biển. Hệ thống gọi API `GET /api/v1/cang-can` với các tham số phân trang (`page`, `size`), sắp xếp (`sortBy=updatedAt,sortDir=DESC`) và các bộ lọc tùy chọn. Dữ liệu trả về được hiển thị trên bảng với các cột cố định và badge màu cho trạng thái. Người dùng nhập từ khóa tìm kiếm vào ô tìm kiếm (search bằng `maCangCan` hoặc `tenCangCan`), chọn trạng thái hoạt động từ dropdown (tất cả / HIEN_HANH / TAM_NGUNG), và chọn trạng thái phê duyệt từ dropdown (tất cả / CHỜ_PHÊ_DUYỆT / ĐƯỢC_PHÊ_DUYỆT / TỪ_CHỐI). Khi bộ lọc thay đổi, danh sách tự động refresh (debounce 300ms). Người dùng click vào tên cảng cạn để chuyển sang trang Chi tiết, hoặc click nút hành động (sửa/xóa/phê duyệt/lịch sử). Phân trang hiển thị điều hướng với số trang hiện tại và tổng số trang. Khi không có kết quả, hiển thị thông báo "Không có dữ liệu".

## Acceptance Criteria

1. Khi mở trang, hệ thống gọi `GET /api/v1/cang-can?page=0&size=20&sortBy=updatedAt&sortDir=DESC` và hiển thị danh sách cảng cạn phân trang đúng 20 mục.
2. Tìm kiếm nhập vào ô "Tìm kiếm" với từ khóa chứa trong `maCangCan` hoặc `tenCangCan` trả về danh sách kết quả phù hợp, ví dụ nhập "CC-001" hiển thị cảng cạn có mã "CC-001".
3. Lọc theo trạng thái hoạt động chọn "HIEN_HANH" chỉ hiển thị các cảng cạn có `trangThaiHoatDong = HIEN_HANH`; chọn "TAM_NGUNG" chỉ hiển thị `TAM_NGUNG`; chọn "Tất cả" hiển thị toàn bộ.
4. Lọc theo trạng thái phê duyệt chọn "CHỜ_PHÊ_DUYỆT" chỉ hiển thị các cảng cạn có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`; chọn "ĐƯỢC_PHÊ_DUYỆT" chỉ hiển thị `ĐƯỢC_PHÊ_DUYỆT`; chọn "TỪ_CHỐI" chỉ hiển thị `TỪ_CHỐI`; chọn "Tất cả" hiển thị toàn bộ.
5. Sắp xếp theo updatedAt giảm dần: mục được cập nhật mới nhất hiển thị đầu tiên, các mục có cùng updatedAt được sắp xếp theo thứ tự không xác định.
6. Click nút "Xem chi tiết" (hoặc tên cảng cạn) chuyển người dùng đến trang Chi tiết Cảng cạn với đúng ID được chọn.
7. Click nút "Chỉnh sửa" chuyển người dùng đến trang Tạo/Cập nhật Cảng cạn với dữ liệu pre-filled của cảng cạn được chọn.
8. Click nút "Xóa" hiển thị hộp thoại xác nhận có nút "Hủy" và "Xác nhận xóa"; sau khi xác nhận, gọi `DELETE /api/v1/cang-can/{id}` và danh sách tự động refresh.
9. Click nút "Phê duyệt" (chỉ hiển thị cho người dùng có quyền approve và cảng cạn có `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`) chuyển người dùng đến trang Phê duyệt Cảng cạn với đúng ID.
10. Click nút "Lịch sử" chuyển người dùng đến trang Lịch sử Cảng cạn với đúng ID được chọn.
11. Phân trang hiển thị đúng tổng số trang dựa trên tổng số kết quả và kích thước trang (20 hoặc 100), click chuyển trang reload dữ liệu đúng trang được chọn.
12. Giao diện hỗ trợ điều hướng bằng bàn phím: Tab di chuyển giữa các ô input, dropdown và nút; Enter kích hoạt hành động của nút được focus.

## In Scope

- Bảng danh sách cảng cạn với phân trang, sắp xếp, tìm kiếm và lọc
- Hiển thị badge trạng thái hoạt động (màu xanh cho HIEN_HANH, màu đỏ cho TAM_NGUNG)
- Hiển thị badge trạng thái phê duyệt (màu vàng cho CHỜ_PHÊ_DUYỆT, màu xanh cho ĐƯỢC_PHÊ_DUYỆT, màu đỏ cho TỪ_CHỐI)
- Các hành động: Xem chi tiết, Chỉnh sửa, Xóa, Phê duyệt (dành cho Leaders), Lịch sử
- Điều hướng bàn phím (Tab/Enter)
- Thông báo toast thành công/báo lỗi sau mỗi hành động

## Out of Scope

- Xuất danh sách ra file Excel/PDF
- Import dữ liệu hàng loạt từ file
- CRUD cảng cạn (các tính năng này nằm ở F-085, F-086, F-097, F-092)
- Quản lý attachment (quản lý tài liệu đi kèm thuộc F-106)
- Dashboard hoặc thống kê số lượng cảng cạn theo tỉnh/thành
- Tìm kiếm nâng cao với regex hoặc wildcard

## Roles + Permissions

| Role | Level | Notes |
|---|---|---|
| QuanTriCangBien (Quản lý cảng biển) | Full access | Đọc, tạo, sửa, xóa, phê duyệt tất cả cảng cạn của cảng |
| NhanVienCangBien (Nhân viên cảng) | Read/Write | Chỉ đọc và tạo, sửa cảng cạn; không có quyền xóa hoặc phê duyệt |
| QuanTramMien (Quan tra miền) | Read | Chỉ đọc danh sách, không có quyền chỉnh sửa, xóa hoặc phê duyệt |
| LeDuan (Lãnh đạo) | Full + Approve | Có thêm quyền phê duyệt/từ chối cảng cạn trong trạng thái chờ duyệt |
| Admin | Full + Approve | Toàn quyền quản lý, tạo, sửa, xóa và phê duyệt cảng cạn |
| Doanh nghiệp cảng | Read/Write | Chỉ đọc và sửa cảng cạn thuộc cảng của mình, không có quyền xóa hoặc phê duyệt |

## Entities

| Entity | Fields |
|---|---|
| CangCan | id (UUID), maCangCan (string, unique, length≤50), tenCangCan (string, length≤255), tinhThanhPho (string, length≤100), viDo (BigDecimal, precision 10 scale 6, range -90..90), kinhDo (BigDecimal, precision 10 scale 6, range -180..180), dienTich (BigDecimal, precision 15 scale 2, >0), congSuatTEU (BigDecimal, precision 15 scale 2), trangThaiHoatDong (string, length≤50), trangThaiPheDuyet (string: CHỜ_PHÊ_DUYỆT/ĐƯỢC_PHÊ_DUYỆT/TỪ_CHỐI), orgUnitId (UUID), createdBy (string), updatedBy (string), createdAt (LocalDateTime), updatedAt (LocalDateTime), deletedAt (nullable) |

## Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| BR-01 | Mã cảng cạn (`maCangCan`) phải là duy nhất trên toàn hệ thống — UNIQUE constraint trên cột `ma_cang_can` | POST, PUT | Entity constraint (CangCan.java:29) |
| BR-02 | `dienTich` (precision 15 scale 2) phải là giá trị dương (>0) khi tạo hoặc cập nhật | POST, PUT | Type validation |
| BR-03 | `viDo` (precision 10 scale 6) phải nằm trong khoảng [-90, 90]; `kinhDo` (precision 10 scale 6) phải nằm trong khoảng [-180, 180] | POST, PUT | GPS range validation |
| BR-04 | Trạng thái phê duyệt mặc định khi tạo mới là `CHỜ_PHÊ_DUYỆT` | POST | Default value |
| BR-05 | Hành động xóa sử dụng soft-delete (đặt `deletedAt` = current timestamp), không kiểm tra con vì CangCan là leaf entity | DELETE | Soft-delete pattern |

## Testing Strategy

Kiểm thử đơn vị (unit test) tập trung vào các business rule trên backend: xác nhận mã duy nhất, kiểm tra phạm vi giá trị `dienTich` (dương), `viDo` (-90..90), `kinhDo` (-180..180), và default giá trị `trangThaiPheDuyet = CHỜ_PHÊ_DUYỆT`. Kiểm thử tích hợp (integration test) xác nhận API endpoint `GET /api/v1/cang-can` trả về đúng kết quả khi có tham số `page`, `size`, `sortBy`, `sortDir`, và các bộ lọc `trangThaiHoatDong`, `trangThaiPheDuyet`. Kiểm thử E2E/UI sử dụng browser automation để verify: danh sách hiển thị đúng dữ liệu, phân trang hoạt động chính xác, tìm kiếm và lọc trả về kết quả đúng, các hành động (xem, sửa, xóa, phê duyệt, lịch sử) chuyển hướng đúng trang, và hộp thoại xác nhận hoạt động chính xác. Kiểm thử RBAC đảm bảo các hành động chỉ thực thi được khi người dùng có quyền tương ứng theo `@auth.check`.
