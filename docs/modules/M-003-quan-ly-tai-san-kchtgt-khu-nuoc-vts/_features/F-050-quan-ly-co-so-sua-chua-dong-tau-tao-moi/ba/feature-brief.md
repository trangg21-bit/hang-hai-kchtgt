---
id: F-050
name: Quan ly co so sua chua dong tau
slug: quan-ly-co-so-sua-chua-dong-tau
module-id: M-003
status: proposed
classification: local
priority: P0
created: 2026-06-29T00:00:00Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# QUẢN LÝ TÀI SẢN KCHTGT KHU NƯỚC VTS

## Quản lý cơ sở sửa chữa đóng tàu

### Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Cho phép người dùng quản lý danh sách cơ sở sửa chữa, đóng tàu tại các khu vực khu nước & VTS, bao gồm tạo mới, chỉnh sửa, xóa, phê duyệt 2 cấp (Phòng → Cục), xem chi tiết và tra cứu lịch sử thay đổi. |
| Tác nhân | **Chuyên viên** (tạo, chỉnh sửa, xóa dữ liệu ở trạng thái PROPOSED/UNDER_REVIEW/REJECTED), **Lãnh đạo phòng** (phê duyệt cấp 1: PROPOSED → UNDER_REVIEW), **Lãnh đạo Cục** (phê duyệt cấp 2: UNDER_REVIEW → APPROVED). |
| Luồng chính | Chuyên viên truy cập màn hình Quản lý cơ sở sửa chữa đóng tàu. Hệ thống hiển thị danh sách cơ sở với khu vực tìm kiếm và bộ lọc. Chuyên viên nhấn Thêm mới để mở form tạo mới, nhập tên cơ sở, địa chỉ, loại hình dịch vụ (sửa chữa/đóng mới), năng lực tiếp nhận (DWT), trang thiết bị chính, diện tích, số điện thoại, email, trạng thái (Sử dụng hoặc Không sử dụng), ghi chú và nhấn Lưu. Hệ thống kiểm tra dữ liệu, tạo bản ghi với trạng thái phê duyệt PROPOSED. Chuyên viên gửi phê duyệt → Lãnh đạo phòng phê duyệt cấp 1 (C1) → trạng thái phê duyệt chuyển thành UNDER_REVIEW → Lãnh đạo Cục phê duyệt cấp 2 (C2) → trạng thái phê duyệt chuyển thành APPROVED, chính thức ghi nhận. Người phê duyệt có thể từ chối (kèm lý do) → REJECTED, chuyên viên có thể sửa và gửi lại. Chuyên viên có thể chỉnh sửa cơ sở (trạng thái phê duyệt PROPOSED/UNDER_REVIEW/REJECTED) hoặc xóa cơ sở đã APPROVED (soft delete). Người dùng có thể xem chi tiết cơ sở kèm danh sách tài liệu đính kèm và lịch sử thay đổi. |
| Điều kiện trước | − Người dùng đã đăng nhập hệ thống. − Người dùng có quyền truy cập chức năng Quản lý cơ sở sửa chữa đóng tàu. |
| Điều kiện sau | − Cơ sở được tạo với trạng thái phê duyệt PROPOSED. − Sau phê duyệt C1: UNDER_REVIEW. − Sau phê duyệt C2: APPROVED, chính thức ghi nhận. − Khi chỉnh sửa: trạng thái phê duyệt quay về PROPOSED, cần phê duyệt lại. − Khi xóa: soft delete (is_deleted = true), có thể phục hồi. − Mọi thao tác được ghi vào lịch sử. |
| Quy tắc nghiệp vụ | − Tên cơ sở bắt buộc, tối đa 200 ký tự. − Địa chỉ bắt buộc, tối đa 500 ký tự. − Loại hình dịch vụ bắt buộc: Sửa chữa hoặc Đóng mới. − Năng lực tiếp nhận bắt buộc, > 0 DWT. − Diện tích ≥ 0 (nếu nhập). − Số điện thoại và email đúng định dạng (nếu nhập). − Trạng thái sử dụng: Sử dụng hoặc Không sử dụng; mặc định Sử dụng khi tạo mới. − Trạng thái phê duyệt mặc định khi tạo: PROPOSED. − Phê duyệt 2 cấp: C1 (Phòng) → UNDER_REVIEW, C2 (Cục) → APPROVED. − Từ chối phải có lý do. − Dữ liệu APPROVED không được chỉnh sửa trực tiếp; phải tạo bản ghi mới hoặc xóa. − Soft delete cho dữ liệu APPROVED; ghi lịch sử khi xóa. − Mọi thao tác (tạo, sửa, xóa, phê duyệt, từ chối) được ghi vào lịch sử. |

### Mô tả màn hình

#### Danh sách cơ sở

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TÌM KIẾM VÀ LỌC |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm cơ sở theo tên hoặc địa chỉ. |
| 2 | Bộ lọc Loại hình dịch vụ | Dropdown | Có | Không | Tất cả | Cho phép lọc theo loại hình. Giá trị: Tất cả, Sửa chữa, Đóng mới. |
| 3 | Bộ lọc Trạng thái phê duyệt | Dropdown | Có | Không | Tất cả | Cho phép lọc theo trạng thái phê duyệt. Giá trị: Tất cả, Chờ duyệt, Đang xem xét, Đã duyệt, Từ chối. |
| 4 | Bộ lọc Trạng thái sử dụng | Dropdown | Có | Không | Tất cả | Cho phép lọc theo trạng thái sử dụng. Giá trị: Tất cả, Sử dụng, Không sử dụng. |
| 5 | Nút Tìm kiếm | Button | Không | Không | — | Thực hiện tìm kiếm với các điều kiện đã nhập. |
| 6 | Nút Làm mới | Button | Không | Không | — | Đưa toàn bộ điều kiện về mặc định. |
| 7 | Nút Thêm mới | Button | Không | Không | — | Mở form tạo mới. Chỉ hiển thị khi có quyền. |
|  | DANH SÁCH |  |  |  |  |  |
| 1 | Cột STT | Label | Không | Không | Tự tăng | Số thứ tự theo trang. |
| 2 | Cột Tên cơ sở | Link | Không | Không | Theo dữ liệu hệ thống | In đậm; click để mở Xem chi tiết. |
| 3 | Cột Địa chỉ | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị địa chỉ cơ sở. |
| 4 | Cột Loại hình | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Badge: Sửa chữa (xanh), Đóng mới (tím). |
| 5 | Cột Năng lực tiếp nhận | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị DWT. |
| 6 | Cột Trạng thái sử dụng | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Sử dụng (xanh lá), Không sử dụng (xám). |
| 7 | Cột Trạng thái phê duyệt | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Chờ duyệt (vàng), Đang xem xét (xanh dương), Đã duyệt (xanh lá), Từ chối (đỏ). |
| 8 | Cột Thao tác | Dropdown | Có | Không | — | Sửa, Xóa, Gửi phê duyệt (theo phân quyền và trạng thái). |
| 9 | Điều khiển phân trang | Pagination | Có | Không | 20 dòng/trang | Điều hướng trang. |

#### Tạo mới / Chỉnh sửa

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM NHẬP LIỆU |  |  |  |  |  |
| 1 | Trường Tên cơ sở | Textbox | Có | Có | Trống | Tối đa 200 ký tự. |
| 2 | Trường Địa chỉ | Textbox | Có | Có | Trống | Tối đa 500 ký tự. |
| 3 | Trường Loại hình dịch vụ | Dropdown | Có | Có | (Chưa chọn) | Sửa chữa / Đóng mới. |
| 4 | Trường Năng lực tiếp nhận | Number | Có | Có | Trống | > 0, đơn vị DWT. |
| 5 | Trường Trang thiết bị chính | TextArea | Có | Không | Trống | Mô tả trang thiết bị chính của cơ sở. Tối đa 1000 ký tự. |
| 6 | Trường Diện tích | Number | Có | Không | Trống | ≥ 0, đơn vị m². |
| 7 | Trường Số điện thoại | Textbox | Có | Không | Trống | Định dạng số VN hoặc quốc tế. |
| 8 | Trường Email | Textbox (email) | Có | Không | Trống | Định dạng email hợp lệ. |
| 9 | Trường Trạng thái | Dropdown | Có | Có | Khi tạo mới: Sử dụng. Khi chỉnh sửa: hiển thị trạng thái hiện tại. | Cho phép chọn trạng thái sử dụng của cơ sở. Giá trị: Sử dụng, Không sử dụng. |
| 10 | Trường Ghi chú | TextArea | Có | Không | Trống | Ghi chú thêm. Tối đa 500 ký tự. |
| 11 | Nút Hủy | Button | Không | Không | — | Đóng form, không lưu. |
| 12 | Nút Lưu | Button | Không | Không | — | Lưu cơ sở. Trạng thái phê duyệt mặc định: PROPOSED (tạo mới). Khi chỉnh sửa: trạng thái phê duyệt quay về PROPOSED. |

#### Xác nhận xóa

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | XÁC NHẬN XÓA |  |  |  |  |  |
| 1 | Nội dung xác nhận | Label | Không | Không | — | "Bạn có chắc chắn muốn xóa cơ sở \"{tên}\"? Hành động này có thể phục hồi." |
| 2 | Nút Hủy | Button | Không | Không | — | Đóng modal. |
| 3 | Nút Xóa | Button | Không | Không | — | Soft delete. Chỉ cho phép với trạng thái phê duyệt APPROVED. Màu đỏ. |

#### Phê duyệt / Từ chối

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | PHÊ DUYỆT |  |  |  |  |  |
| 1 | Nút Phê duyệt | Button | Có | Không | — | Phê duyệt cơ sở. C1 (Lãnh đạo phòng): PROPOSED → UNDER_REVIEW. C2 (Lãnh đạo Cục): UNDER_REVIEW → APPROVED. Hiển thị theo phân quyền và trạng thái phê duyệt. |
|  | TỪ CHỐI |  |  |  |  |  |
| 2 | Trường Lý do từ chối | TextArea | Có | Có | Trống | Bắt buộc khi từ chối. Tối thiểu 10 ký tự. |
| 3 | Nút Từ chối | Button | Có | Không | — | Từ chối cơ sở, trạng thái phê duyệt → REJECTED. Hiển thị theo phân quyền và trạng thái phê duyệt. |

#### Xem chi tiết

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | THÔNG TIN CƠ SỞ |  |  |  |  |  |
| 1 | Tên cơ sở | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên cơ sở. |
| 2 | Địa chỉ | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị địa chỉ. |
| 3 | Loại hình dịch vụ | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Sửa chữa / Đóng mới. |
| 4 | Năng lực tiếp nhận | Label | Không | Không | Theo dữ liệu hệ thống | DWT. |
| 5 | Trang thiết bị chính | Label | Không | Không | Theo dữ liệu hệ thống | Trống hiển thị "—". |
| 6 | Diện tích | Label | Không | Không | Theo dữ liệu hệ thống | m². Trống hiển thị "—". |
| 7 | Số điện thoại | Label | Không | Không | Theo dữ liệu hệ thống | Trống hiển thị "—". |
| 8 | Email | Label | Không | Không | Theo dữ liệu hệ thống | Trống hiển thị "—". |
| 9 | Trạng thái sử dụng | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Sử dụng (xanh lá), Không sử dụng (xám). |
| 10 | Ghi chú | Label | Không | Không | Theo dữ liệu hệ thống | Trống hiển thị "—". |
| 11 | Trạng thái phê duyệt | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Chờ duyệt / Đang xem xét / Đã duyệt / Từ chối. |
| 12 | Người tạo | Label | Không | Không | Theo dữ liệu hệ thống | — |
| 13 | Ngày tạo | Label | Không | Không | Theo dữ liệu hệ thống | DD/MM/YYYY HH:mm. |
|  | THÔNG TIN PHÊ DUYỆT |  |  |  |  |  |
| 14 | C1 — Người phê duyệt | Label | Không | Không | Theo dữ liệu hệ thống | Trống nếu chưa duyệt C1. |
| 15 | C1 — Ngày phê duyệt | Label | Không | Không | Theo dữ liệu hệ thống | DD/MM/YYYY HH:mm. |
| 16 | C2 — Người phê duyệt | Label | Không | Không | Theo dữ liệu hệ thống | Trống nếu chưa duyệt C2. |
| 17 | C2 — Ngày phê duyệt | Label | Không | Không | Theo dữ liệu hệ thống | DD/MM/YYYY HH:mm. |
| 18 | Lý do từ chối | Label | Không | Không | Theo dữ liệu hệ thống | Chỉ hiển thị khi trạng thái phê duyệt REJECTED. |
|  | TÀI LIỆU ĐÍNH KÈM |  |  |  |  |  |
| 19 | Danh sách tài liệu | Table | Không | Không | — | Tên file, ngày upload, người upload. Có nút tải về. |
|  | LỊCH SỬ THAY ĐỔI |  |  |  |  |  |
| 20 | Bảng lịch sử | Table | Không | Không | — | Thời gian, người thực hiện, loại thao tác (Tạo mới / Chỉnh sửa / Phê duyệt C1 / Phê duyệt C2 / Từ chối C1 / Từ chối C2 / Xóa), lý do/ghi chú. Sắp xếp giảm dần theo thời gian. |
|  | THANH THAO TÁC |  |  |  |  |  |
| 21 | Nút Sửa | Button | Có | Không | — | Mở form chỉnh sửa. Chỉ hiển thị khi trạng thái phê duyệt không phải APPROVED và có quyền. |
| 22 | Nút Xóa | Button | Có | Không | — | Mở modal xóa. Chỉ hiển thị khi trạng thái phê duyệt = APPROVED và có quyền. |
| 23 | Nút Phê duyệt / Từ chối | Button | Có | Không | — | Hiển thị theo phân quyền và trạng thái phê duyệt. |
| 24 | Nút Quay lại | Button | Không | Không | — | Quay về danh sách. |

## Context

- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
