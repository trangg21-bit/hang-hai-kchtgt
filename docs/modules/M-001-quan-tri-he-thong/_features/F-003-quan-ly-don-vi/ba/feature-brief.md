---
id: F-003
name: Quan ly don vi
slug: quan-ly-don-vi
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:53Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# QUẢN TRỊ HỆ THỐNG

## Quản lý đơn vị

### Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Cho phép người dùng quản lý cấu trúc tổ chức đơn vị hành chính theo hệ thống phân cấp 3 cấp, bao gồm tạo mới, chỉnh sửa, xóa, phê duyệt đơn vị và tra cứu thông tin đơn vị. |
| Tác nhân | Người dùng được phân quyền chức năng Quản lý đơn vị. Quyền hạn cụ thể (xem, tạo, sửa, xóa, phê duyệt) theo phân quyền hệ thống. |
| Luồng chính | Người dùng truy cập màn hình Quản lý đơn vị. Hệ thống hiển thị cấu trúc cây đơn vị (org tree) với khả năng mở rộng/thu gọn từng nhánh (trừ đơn vị cấp nhỏ nhất — không có chức năng collapse/expand) và khu vực tìm kiếm, bộ lọc. Người dùng có thể tìm kiếm theo tên hoặc mã đơn vị, lọc theo trạng thái. Trên mỗi dòng của cây có các nút thao tác: Xem, Sửa, Xóa, Phê duyệt (theo phân quyền và trạng thái). Người dùng nhấn Xem để mở màn hình chi tiết đơn vị, hiển thị đầy đủ thông tin và các nút thao tác (Sửa, Xóa, Phê duyệt). Người dùng nhấn Thêm đơn vị để mở form tạo mới, nhập các thông tin và nhấn Lưu. Hệ thống kiểm tra mã đơn vị unique, kiểm tra không tạo vòng lặp phân cấp, tự động tính cấp bậc (level) theo độ sâu trong cây, tạo đơn vị thành công. Người dùng có thể sửa thông tin đơn vị hoặc xóa đơn vị (chỉ khi không có đơn vị con và không có người dùng trực thuộc). |
| Điều kiện trước | − Người dùng đã đăng nhập hệ thống. − Người dùng có quyền truy cập chức năng Quản lý đơn vị. − Đơn vị gốc (root) đã được khởi tạo trong hệ thống. |
| Điều kiện sau | − Đơn vị được tạo/sửa/xóa thành công, cây cấu trúc được cập nhật và hiển thị toast thông báo. − Khi tạo đơn vị mới không chọn đơn vị cha: đơn vị được tạo ở cấp cao nhất. − Cấp bậc (level) được tính tự động dựa trên đơn vị cha (tối đa 3 cấp). |
| Quy tắc nghiệp vụ | − Mã đơn vị (code) phải là duy nhất trong toàn hệ thống. − Không cho phép tạo vòng lặp phân cấp (circular reference). − Đơn vị gốc (root) không có đơn vị cha; trường hợp không chọn đơn vị cha khi tạo mới, đơn vị đó là đơn vị cấp cao nhất. − Hệ thống phân cấp giới hạn tối đa 3 cấp. − Không cho phép xóa đơn vị còn đơn vị con hoặc có người dùng trực thuộc. − Cấp bậc (level) được tính tự động theo độ sâu trong cây. − Tên đơn vị không được để trống, tối đa 200 ký tự. − Trên cây đơn vị, đơn vị cấp nhỏ nhất (cấp 3) không có chức năng collapse/expand. |

### Mô tả màn hình

#### Cấu trúc cây đơn vị

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TÌM KIẾM VÀ LỌC |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm đơn vị theo tên hoặc mã đơn vị. Giới hạn tối đa 200 ký tự. Tìm kiếm tương đối (contains). |
| 2 | Bộ lọc Trạng thái | Dropdown | Có | Không | Tất cả | Cho phép lọc danh sách theo trạng thái đơn vị. Giá trị: Tất cả, Sử dụng, Không sử dụng, Chờ phê duyệt. |
| 3 | Nút Tìm kiếm | Button | Không | Không | — | Thực hiện tìm kiếm với các điều kiện đã nhập. |
| 4 | Nút Làm mới | Button | Không | Không | — | Đưa toàn bộ điều kiện tìm kiếm và bộ lọc về mặc định. |
| 5 | Nút Thêm đơn vị | Button | Không | Không | — | Mở modal tạo đơn vị mới. Chỉ hiển thị khi người dùng có quyền. |
|  | CÂY CẤU TRÚC |  |  |  |  |  |
| 1 | Cây đơn vị (Org Tree) | Tree | Có | Không | Mở rộng đến cấp 1 | Hiển thị cấu trúc phân cấp đơn vị dạng cây (tối đa 3 cấp). Mỗi nút hiển thị tên đơn vị. Hỗ trợ mở rộng/thu gọn từng nhánh. Đơn vị cấp nhỏ nhất (cấp 3) không có chức năng collapse/expand. Nút có đơn vị con hiển thị số lượng đơn vị con trong ngoặc. |
| 2 | Nút Mở rộng tất cả | Button | Không | Không | — | Mở rộng toàn bộ các nhánh trong cây. |
| 3 | Nút Thu gọn tất cả | Button | Không | Không | — | Thu gọn toàn bộ các nhánh, chỉ hiển thị đơn vị gốc. |
|  | THAO TÁC TRÊN DÒNG |  |  |  |  |  |
| 1 | Nút Xem | Button (icon) | Có | Không | — | Mở màn hình Xem chi tiết đơn vị. Luôn hiển thị. |
| 2 | Nút Sửa | Button (icon) | Có | Không | — | Mở modal Tạo mới / Chỉnh sửa đơn vị. Hiển thị theo phân quyền. |
| 3 | Nút Xóa | Button (icon) | Có | Không | — | Mở modal Xác nhận xóa. Disabled kèm tooltip nếu đơn vị còn đơn vị con hoặc có người dùng trực thuộc. Hiển thị theo phân quyền. |
| 4 | Nút Phê duyệt | Button | Có | Không | — | Chỉ hiển thị khi đơn vị đang ở trạng thái Chờ phê duyệt và người dùng có quyền phê duyệt. Chuyển trạng thái đơn vị thành Sử dụng. |

#### Xem chi tiết đơn vị

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | THÔNG TIN ĐƠN VỊ |  |  |  |  |  |
| 1 | Tên đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên đơn vị. |
| 2 | Mã đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị mã đơn vị. |
| 3 | Đơn vị cha | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên đơn vị cha. Đơn vị gốc hiển thị "—". |
| 4 | Địa điểm (Tỉnh/Thành phố) | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tỉnh/thành phố nơi đơn vị đặt trụ sở. |
| 5 | Địa điểm chi tiết | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị địa chỉ chi tiết. Trống hiển thị "—". |
| 6 | Số điện thoại | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị số điện thoại liên hệ. Trống hiển thị "—". |
| 7 | Trạng thái | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị trạng thái dạng badge: Sử dụng (xanh lá), Không sử dụng (xám), Chờ phê duyệt (vàng). |
|  | THANH THAO TÁC |  |  |  |  |  |
| 1 | Nút Sửa | Button | Có | Không | — | Mở modal Tạo mới / Chỉnh sửa. Hiển thị theo phân quyền. |
| 2 | Nút Xóa | Button | Có | Không | — | Mở modal Xác nhận xóa. Disabled nếu có đơn vị con hoặc người dùng trực thuộc. |
| 3 | Nút Phê duyệt | Button | Có | Không | — | Chỉ hiển thị khi trạng thái là Chờ phê duyệt và có quyền. |
| 4 | Nút Quay lại | Button | Không | Không | — | Quay về màn hình cây đơn vị. |

#### Tạo mới / Chỉnh sửa đơn vị

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM NHẬP LIỆU |  |  |  |  |  |
| 1 | Trường Tên đơn vị | Textbox | Có | Có | Trống | Cho phép nhập tên đơn vị. Giới hạn 2-200 ký tự. Khi chỉnh sửa: hiển thị giá trị hiện tại. |
| 2 | Trường Mã đơn vị | Textbox | Có (tạo mới) / Không (chỉnh sửa) | Có | Trống | Cho phép nhập mã viết tắt của đơn vị. Giới hạn 2-30 ký tự, chỉ chữ hoa, số và dấu gạch dưới. Phải duy nhất trong toàn hệ thống. Không cho phép chỉnh sửa sau khi đã tạo. |
| 3 | Trường Đơn vị cha | Tree Selector | Có | Không | Trống | Cho phép chọn đơn vị cha từ cây cấu trúc. Không bắt buộc: nếu để trống, đơn vị được tạo là đơn vị cấp cao nhất. Hệ thống tự động kiểm tra không tạo vòng lặp phân cấp và giới hạn tối đa 3 cấp. |
| 4 | Trường Địa điểm (Tỉnh/Thành phố) | Dropdown | Có | Có | (Chưa chọn) | Cho phép chọn tỉnh/thành phố nơi đơn vị đặt trụ sở. Danh sách lấy từ danh mục hành chính. |
| 5 | Trường Địa điểm chi tiết | Textbox | Có | Không | Trống | Cho phép nhập địa chỉ chi tiết của đơn vị. Giới hạn tối đa 500 ký tự. |
| 6 | Trường Số điện thoại | Textbox | Có | Không | Trống | Cho phép nhập số điện thoại liên hệ của đơn vị. Giới hạn 10-11 chữ số. |
| 7 | Trường Trạng thái | Dropdown | Có | Có | Khi tạo mới: Sử dụng. Khi chỉnh sửa: hiển thị trạng thái hiện tại của đơn vị. | Cho phép chọn trạng thái đơn vị. Giá trị: Sử dụng, Không sử dụng. (Trạng thái Chờ phê duyệt không được chọn thủ công — do hệ thống tự gán hoặc do người có quyền phê duyệt thay đổi qua nút Phê duyệt.) |
| 8 | Nút Hủy | Button | Không | Không | — | Đóng modal, không lưu thay đổi. |
| 9 | Nút Lưu | Button | Không | Không | — | Nút luôn ở trạng thái enable. Khi nhấn, hệ thống kiểm tra validation các trường dữ liệu. Nếu có lỗi: hiển thị thông báo lỗi dưới các trường tương ứng và không thực hiện lưu. Nếu hợp lệ: thực hiện lưu, tự động tính cấp bậc (level), hiển thị loading và toast thông báo khi hoàn tất. |

#### Xác nhận xóa đơn vị

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | XÁC NHẬN XÓA |  |  |  |  |  |
| 1 | Nội dung xác nhận | Label | Không | Không | — | Hiển thị thông báo: "Bạn có chắc chắn muốn xóa đơn vị \"{tên đơn vị}\"? Hành động này không thể hoàn tác." |
| 2 | Cảnh báo còn đơn vị con | Label | Không | Không | — | Nếu đơn vị còn đơn vị con trực thuộc: hiển thị lỗi "Không thể xóa đơn vị còn X đơn vị con. Vui lòng di chuyển hoặc xóa đơn vị con trước." và không cho phép xóa. |
| 3 | Cảnh báo có người dùng trực thuộc | Label | Không | Không | — | Nếu đơn vị có người dùng trực thuộc: hiển thị lỗi "Không thể xóa đơn vị đang có người dùng trực thuộc." và không cho phép xóa. |
| 4 | Nút Hủy | Button | Không | Không | — | Đóng modal, không thực hiện xóa. |
| 5 | Nút Xóa | Button | Không | Không | — | Thực hiện xóa đơn vị. Chỉ hiển thị khi không có ràng buộc. Màu đỏ (danger). |

## Context

- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022