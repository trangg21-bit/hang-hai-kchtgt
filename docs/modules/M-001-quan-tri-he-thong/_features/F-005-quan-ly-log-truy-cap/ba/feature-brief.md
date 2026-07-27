---
id: F-005
name: Quan ly log truy cap
slug: quan-ly-log-truy-cap
module-id: M-001
status: done
classification: local
priority: medium
created: 2026-06-16T04:40:57Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# QUẢN TRỊ HỆ THỐNG

## Quản lý log truy cập

### Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Cho phép người dùng tra cứu, xem và xuất lịch sử hoạt động truy cập hệ thống, bao gồm 3 hành động: Đăng nhập, Đăng xuất, Truy cập chức năng; hỗ trợ lọc theo ngày truy cập, đơn vị và email. |
| Tác nhân | Người dùng được phân quyền chức năng Quản lý log truy cập. Quyền hạn cụ thể (xem, xuất CSV) theo phân quyền hệ thống. |
| Luồng chính | Người dùng truy cập màn hình Quản lý log truy cập. Hệ thống hiển thị danh sách log với khu vực tìm kiếm và bộ lọc. Người dùng có thể lọc theo ngày truy cập (Từ ngày — Đến ngày), đơn vị, và email. Người dùng nhấn Tìm kiếm, hệ thống hiển thị danh sách kết quả phù hợp với phân trang. Mỗi dòng log hiển thị: thời gian truy cập, email, đơn vị, chức năng, địa chỉ IP, thông tin trình duyệt, phiên đăng nhập, hành động. Người dùng có thể nhấn vào một dòng log để xem chi tiết đầy đủ thông tin. Người dùng có quyền xuất CSV có thể nhấn Xuất CSV để tải file. Log là dữ liệu chỉ đọc — không có chức năng sửa hoặc xóa thủ công. |
| Điều kiện trước | − Người dùng đã đăng nhập hệ thống. − Người dùng có quyền truy cập chức năng Quản lý log truy cập. |
| Điều kiện sau | − Danh sách log được cập nhật theo điều kiện tìm kiếm. − File CSV được tải về với dữ liệu đúng định dạng. |
| Quy tắc nghiệp vụ | − Log ghi nhận 3 hành động: Đăng nhập, Đăng xuất, Truy cập chức năng. − Log là immutable — không cho phép sửa hoặc xóa thủ công. − Chỉ hệ thống tự tạo log khi người dùng thực hiện hành động; không thể tạo log thủ công. |

### Mô tả màn hình

#### Danh sách log

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TÌM KIẾM VÀ LỌC |  |  |  |  |  |
| 1 | Trường Ngày truy cập (Từ ngày — Đến ngày) | Date Range Picker | Có | Không | Trống | Cho phép chọn khoảng thời gian để lọc log. Định dạng DD/MM/YYYY. |
| 2 | Bộ lọc Đơn vị | Dropdown | Có | Không | Tất cả | Cho phép lọc theo đơn vị của người dùng. Danh sách lấy từ danh mục đơn vị. |
| 3 | Trường Email | Textbox | Có | Không | Trống | Cho phép nhập email để lọc log theo người dùng. |
| 4 | Nút Tìm kiếm | Button | Không | Không | — | Thực hiện tìm kiếm với các điều kiện đã nhập. |
| 5 | Nút Làm mới | Button | Không | Không | — | Đưa toàn bộ điều kiện tìm kiếm và bộ lọc về mặc định. |
| 6 | Nút Xuất CSV | Button | Không | Không | — | Xuất danh sách log ra file CSV. Chỉ hiển thị khi người dùng có quyền xuất. |
|  | DANH SÁCH |  |  |  |  |  |
| 1 | Cột STT | Label | Không | Không | Tự tăng | Hiển thị số thứ tự bản ghi, tính theo trang. |
| 2 | Cột Thời gian truy cập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị thời gian thực hiện hành động. Định dạng DD/MM/YYYY HH:mm:ss. |
| 3 | Cột Email | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị email người dùng. |
| 4 | Cột Đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị đơn vị trực thuộc của người dùng. |
| 5 | Cột Hành động | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị hành động dạng badge: Đăng nhập (xanh), Đăng xuất (xám), Truy cập chức năng (xanh dương). |
| 6 | Cột Chức năng | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên chức năng được truy cập. Với hành động Đăng nhập/Đăng xuất: hiển thị "—". |
| 7 | Cột Địa chỉ IP | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị địa chỉ IP của người dùng. |
| 8 | Cột Trình duyệt | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên trình duyệt rút gọn (Chrome, Firefox, Edge...). |
| 9 | Cột Phiên đăng nhập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị mã phiên đăng nhập. |
| 10 | Cột Thao tác | Button | Có | Không | — | Nút Xem chi tiết. Log là read-only — không có nút Sửa/Xóa. |
| 11 | Điều khiển phân trang | Pagination | Có | Không | 20 dòng/trang | Điều hướng trang và thay đổi số dòng/trang. |

#### Xem chi tiết log

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | THÔNG TIN LOG |  |  |  |  |  |
| 1 | Thời gian truy cập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị thời gian thực hiện hành động. Định dạng DD/MM/YYYY HH:mm:ss. |
| 2 | Hành động | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị hành động: Đăng nhập, Đăng xuất, Truy cập chức năng. |
| 3 | Email | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị email người dùng. |
| 4 | Đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị đơn vị trực thuộc. |
| 5 | Chức năng | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên chức năng được truy cập. Với Đăng nhập/Đăng xuất: hiển thị "—". |
| 6 | Địa chỉ IP | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị địa chỉ IP. |
| 7 | Thông tin trình duyệt | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị đầy đủ thông tin User-Agent của trình duyệt. |
| 8 | Phiên đăng nhập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị mã phiên đăng nhập. |
| 9 | Nút Đóng | Button | Không | Không | — | Đóng modal, quay về danh sách. |

## Context

- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
