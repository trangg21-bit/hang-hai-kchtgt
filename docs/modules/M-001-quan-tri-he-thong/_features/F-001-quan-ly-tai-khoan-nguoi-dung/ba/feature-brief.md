---
id: F-001
name: Quan ly tai khoan nguoi dung
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-07-24T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# QUẢN TRỊ HỆ THỐNG

## Quản lý tài khoản người dùng

### Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Cho phép người dùng quản lý toàn bộ vòng đời tài khoản người dùng trong hệ thống, bao gồm tạo mới, chỉnh sửa thông tin, xóa mềm, khóa/mở khóa tài khoản, phân quyền theo vai trò (RBAC), đặt lại mật khẩu, quên mật khẩu và phê duyệt tài khoản. |
| Tác nhân | Người dùng được phân quyền chức năng Quản lý tài khoản người dùng. Quyền hạn cụ thể (xem, tạo, sửa, xóa, khóa/mở khóa, phân quyền, duyệt đăng ký) theo phân quyền hệ thống. |
| Luồng chính | Người dùng truy cập màn hình Quản lý tài khoản người dùng. Hệ thống hiển thị danh sách người dùng với khu vực tìm kiếm, bộ lọc và các tab trạng thái. Người dùng có thể tìm kiếm theo tên/email, lọc theo vai trò và trạng thái. Người dùng nhấn Thêm mới để mở form tạo tài khoản, nhập tên đăng nhập, họ tên, email, mật khẩu, vai trò, đơn vị và nhấn Lưu. Hệ thống kiểm tra email unique và mật khẩu đáp ứng chính sách, tạo tài khoản thành công. Người dùng có thể sửa thông tin, khóa/mở khóa (kèm lý do, ghi UserStatusLog), hoặc xóa mềm tài khoản (không xóa nếu còn dữ liệu nghiệp vụ liên quan). Admin/Cán bộ tạo yêu cầu tài khoản mới → Lãnh đạo duyệt (Lãnh đạo tự tạo thì tự duyệt). Admin/Admin-Operation xem danh sách tài khoản chờ phê duyệt qua tab "Chờ phê duyệt", phê duyệt hoặc từ chối (kèm lý do). Người dùng quên mật khẩu có thể yêu cầu link reset qua email. |
| Điều kiện trước | − Người dùng đã đăng nhập hệ thống (trừ chức năng quên mật khẩu là public). − Người dùng có quyền truy cập chức năng tương ứng. − Danh sách vai trò và đơn vị đã có sẵn trong hệ thống. |
| Điều kiện sau | − Tài khoản được tạo/sửa/xóa thành công, hiển thị toast thông báo. − Tài khoản bị khóa: mọi session đang hoạt động bị vô hiệu ngay lập tức, không thể đăng nhập. − Tài khoản bị khóa sau 5 lần đăng nhập sai, tự động mở khóa sau 30 phút hoặc Admin mở thủ công. − Link reset mật khẩu hết hạn sau 1 giờ, token dùng một lần. − Phê duyệt: tạo User + gán vai trò + gửi thông báo (atomic transaction). − Mọi thay đổi trạng thái tài khoản được ghi vào UserStatusLog kèm lý do. |
| Quy tắc nghiệp vụ | − Email phải là duy nhất trong toàn hệ thống. − Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số (không bắt buộc ký tự đặc biệt). − Không được xóa tài khoản còn dữ liệu nghiệp vụ liên quan (phanhien, bao cao). − Tài khoản bị khóa không được đăng nhập; khi khóa, mọi session bị vô hiệu ngay. − Tài khoản tự động khóa sau 5 lần đăng nhập sai; tự mở khóa sau 30 phút hoặc Admin mở thủ công. − Chỉ Admin mới có quyền phân quyền cho vai trò khác. − Token reset mật khẩu hết hạn sau 1 giờ, dùng một lần. − Mật khẩu mới phải khác 3 mật khẩu gần nhất. − User không thể tự thay đổi vai trò của chính mình. − Mọi thay đổi trạng thái tài khoản phải ghi UserStatusLog kèm lý do. − Admin/Cán bộ tạo yêu cầu tài khoản → Lãnh đạo duyệt; Lãnh đạo tự tạo thì tự duyệt. − Admin được phân quyền truy cập module cụ thể. − Phê duyệt tài khoản là atomic transaction. − Admin không thể tự phê duyệt tài khoản của chính mình. |

### Mô tả màn hình

#### Danh sách người dùng

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TÌM KIẾM VÀ LỌC |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm người dùng theo họ tên hoặc email. Tìm kiếm tương đối (contains). |
| 2 | Bộ lọc Vai trò | Dropdown | Có | Không | Tất cả | Cho phép lọc danh sách theo vai trò người dùng. Danh sách lấy từ danh mục vai trò (F-001). |
| 3 | Bộ lọc Trạng thái | Dropdown | Có | Không | Tất cả | Cho phép lọc danh sách theo trạng thái. Giá trị: Tất cả, Hoạt động (active), Đã khóa (locked), Không hoạt động (inactive), Chờ phê duyệt (pending). |
| 4 | Nút Tìm kiếm | Button | Không | Không | — | Thực hiện tìm kiếm với các điều kiện đã nhập. |
| 5 | Nút Làm mới | Button | Không | Không | — | Đưa toàn bộ điều kiện tìm kiếm và bộ lọc về mặc định. |
|  | TAB TRẠNG THÁI |  |  |  |  |  |
| 6 | Tab Tất cả | Tab | Có | Không | Tab mặc định | Hiển thị toàn bộ người dùng. Kèm số lượng tổng. |
| 7 | Tab Hoạt động | Tab | Có | Không | — | Hiển thị người dùng có trạng thái active. Kèm số lượng. |
| 8 | Tab Đã khóa | Tab | Có | Không | — | Hiển thị người dùng có trạng thái locked. Kèm số lượng. |
| 9 | Tab Không hoạt động | Tab | Có | Không | — | Hiển thị người dùng có trạng thái inactive. Kèm số lượng. |
| 10 | Tab Chờ phê duyệt | Tab | Có | Không | — | Hiển thị tài khoản đăng ký đang chờ phê duyệt (pending). Kèm số lượng. |
|  | DANH SÁCH |  |  |  |  |  |
| 1 | Cột STT | Label | Không | Không | Tự tăng | Hiển thị số thứ tự bản ghi trên danh sách. Giá trị tự động tăng theo thứ tự hiển thị, tính theo trang. |
| 2 | Cột Họ và tên | Link | Không | Không | Theo dữ liệu hệ thống | Hiển thị họ tên người dùng. In đậm. Nhấn vào để mở chi tiết. Dữ liệu lấy từ APP_USERS.FULL_NAME. |
| 3 | Cột Tên đăng nhập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên đăng nhập. Dữ liệu lấy từ APP_USERS.USERNAME. |
| 4 | Cột Email | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị email người dùng. Dữ liệu lấy từ APP_USERS.EMAIL. |
| 5 | Cột Vai trò | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị vai trò dạng badge màu. Dữ liệu lấy từ bảng ROLES liên kết qua USER_ROLES. |
| 6 | Cột Đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị đơn vị trực thuộc. Dữ liệu lấy từ ORGANIZATIONS. Trống hiển thị "—". |
| 7 | Cột Đăng nhập cuối | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị thời gian đăng nhập gần nhất. Dữ liệu lấy từ APP_USERS.LAST_LOGIN_AT. Định dạng DD/MM/YYYY HH:mm. Chưa đăng nhập hiển thị "Chưa đăng nhập". |
| 8 | Cột Trạng thái | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị trạng thái dạng badge: Hoạt động (active, xanh lá), Đã khóa (locked, đỏ), Không hoạt động (inactive, xám). Dữ liệu lấy từ APP_USERS.STATUS. |
| 9 | Cột Thao tác | Dropdown | Có | Không | — | Hiển thị danh sách hành động khả dụng theo quyền và trạng thái tài khoản: Sửa, Khóa/Mở khóa, Xóa. Đối với tài khoản đang chờ phê duyệt (pending): hiển thị Phê duyệt, Từ chối (theo phân quyền). |
| 10 | Điều khiển phân trang | Pagination | Có | Không | 20 dòng/trang | Điều hướng trang và thay đổi số dòng/trang. Tối đa 100 dòng/trang. |

#### Tạo mới / Chỉnh sửa tài khoản

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM NHẬP LIỆU |  |  |  |  |  |
| 1 | Trường Tên đăng nhập | Textbox | Có (tạo mới) / Không (chỉnh sửa) | Có | Trống | Cho phép nhập tên đăng nhập. Giới hạn 3-50 ký tự, chỉ chữ thường, số và dấu gạch dưới. Chỉ hiển thị khi tạo mới. |
| 2 | Trường Họ và tên | Textbox | Có | Có | Trống | Cho phép nhập họ tên đầy đủ. Giới hạn 2-100 ký tự. |
| 3 | Trường Email | Textbox (email) | Có | Có | Trống | Cho phép nhập email. Định dạng email hợp lệ. Phải duy nhất trong toàn hệ thống (kiểm tra trùng khi blur). |
| 4 | Trường Số điện thoại | Textbox | Có | Không | Trống | Cho phép nhập số điện thoại. Giới hạn 10-11 chữ số nếu nhập. |
| 5 | Trường Mật khẩu | Password | Có (tạo mới) / Không (chỉnh sửa) | Có (tạo mới) | Trống | Cho phép nhập mật khẩu. Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số. Có strength meter realtime. Chỉ hiển thị khi tạo mới. |
| 6 | Trường Vai trò | Dropdown | Có | Có | (Chưa chọn) | Cho phép chọn vai trò cho người dùng. Danh sách lấy từ danh mục vai trò. |
| 7 | Trường Đơn vị | Dropdown (searchable) | Có | Không | (Chưa chọn) | Cho phép chọn đơn vị trực thuộc. Danh sách lấy từ danh mục đơn vị. |
| 8 | Trường Trạng thái | Dropdown | Có (chỉnh sửa) / Không (tạo mới) | Có (chỉnh sửa) | active (tạo mới) | Cho phép chọn trạng thái: Hoạt động (active), Không hoạt động (inactive). Chỉ hiển thị khi chỉnh sửa. |
| 9 | Nút Hủy | Button | Không | Không | — | Đóng modal, không lưu thay đổi. |
| 10 | Nút Lưu | Button | Không | Không | — | Lưu thông tin tài khoản. Nút bị disabled khi form có lỗi. Hiển thị loading khi đang xử lý. Toast thông báo khi hoàn tất. |

#### Khóa / Mở khóa tài khoản

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | XÁC NHẬN KHÓA/MỞ KHÓA |  |  |  |  |  |
| 1 | Nội dung xác nhận | Label | Không | Không | — | Hiển thị thông báo: "Tài khoản \"{họ tên}\" sẽ bị khóa và không thể đăng nhập. Tiếp tục?" (nếu đang khóa) hoặc "Tài khoản \"{họ tên}\" sẽ được mở khóa. Tiếp tục?" (nếu đang mở khóa). |
| 2 | Trường Lý do | TextArea | Có | Có | Trống | Cho phép nhập lý do khóa/mở khóa. Tối thiểu 10 ký tự. Dữ liệu được ghi vào UserStatusLog. |
| 3 | Nút Hủy | Button | Không | Không | — | Đóng modal, không thực hiện. |
| 4 | Nút Khóa / Mở khóa | Button | Không | Không | — | Thực hiện khóa/mở khóa. Màu danger cho Khóa, primary cho Mở khóa. Toast thông báo khi hoàn tất. Khi khóa: mọi session đang hoạt động của user bị vô hiệu ngay. |

#### Xác nhận xóa tài khoản

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | XÁC NHẬN XÓA |  |  |  |  |  |
| 1 | Nội dung xác nhận | Label | Không | Không | — | Hiển thị thông báo: "Bạn có chắc chắn muốn xóa người dùng \"{họ tên}\"? Hành động này không thể hoàn tác." |
| 2 | Cảnh báo còn dữ liệu liên quan | Label | Không | Không | — | Nếu tài khoản còn dữ liệu nghiệp vụ liên quan (phanhien, bao cao): hiển thị lỗi "Không thể xóa — tài khoản còn dữ liệu nghiệp vụ" và không cho phép xóa. |
| 3 | Nút Hủy | Button | Không | Không | — | Đóng modal. |
| 4 | Nút Xóa | Button | Không | Không | — | Thực hiện xóa mềm (deletedAt = now). Màu danger. Chỉ hiển thị khi không có dữ liệu liên quan. |

#### Quên mật khẩu

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM QUÊN MẬT KHẨU |  |  |  |  |  |
| 1 | Trường Email đăng ký | Textbox (email) | Có | Có | Trống | Cho phép nhập email đã đăng ký. Định dạng email hợp lệ. Rate-limited: tối đa 3 lần/15 phút. |
| 2 | Nút Gửi yêu cầu | Button | Không | Không | — | Gửi yêu cầu reset mật khẩu. Hệ thống tạo token (hết hạn 1 giờ) và gửi link reset qua email. Luôn hiển thị thông báo thành công (chống enumeration email). |
| 3 | Nút Quay lại Đăng nhập | Button (link) | Không | Không | — | Điều hướng về trang đăng nhập. |

#### Đặt lại mật khẩu

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM ĐẶT LẠI MẬT KHẨU |  |  |  |  |  |
| 1 | Trường Mật khẩu mới | Password | Có | Có | Trống | Cho phép nhập mật khẩu mới. Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số. Có strength meter realtime: Yếu (<40%), Trung bình (40-80%), Mạnh (>80%). Token lấy từ URL (/reset-password/:token). |
| 2 | Trường Xác nhận mật khẩu mới | Password | Có | Có | Trống | Cho phép nhập lại mật khẩu mới. Phải khớp với trường Mật khẩu mới. |
| 3 | Nút Lưu mật khẩu mới | Button | Không | Không | — | Lưu mật khẩu mới. Token hết hạn sau 1 giờ, dùng một lần. Mật khẩu mới phải khác 3 mật khẩu gần nhất. |

#### Phê duyệt / Từ chối tài khoản

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | PHÊ DUYỆT |  |  |  |  |  |
| 1 | Trường Ghi chú | TextArea | Có | Không | Trống | Ghi chú nội bộ cho phê duyệt. |
| 2 | Nút Phê duyệt | Button | Không | Không | — | Thực hiện phê duyệt: tạo User với vai trò và đơn vị theo thông tin đăng ký + gửi thông báo (atomic transaction). Chống tự phê duyệt: không cho phép duyệt tài khoản có email trùng với email người duyệt. |
|  | TỪ CHỐI |  |  |  |  |  |
| 5 | Trường Lý do từ chối | TextArea | Có | Có | Trống | Cho phép nhập lý do từ chối. Tối thiểu 10 ký tự. |
| 6 | Nút Từ chối | Button | Không | Không | — | Từ chối đơn đăng ký. Cập nhật trạng thái PendingApproval thành rejected. |

#### Xem chi tiết tài khoản

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | THÔNG TIN TÀI KHOẢN |  |  |  |  |  |
| 1 | Tên đăng nhập | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên đăng nhập. |
| 2 | Họ và tên | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị họ tên đầy đủ. |
| 3 | Email | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị email. |
| 4 | Số điện thoại | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị số điện thoại. Trống hiển thị "—". |
| 5 | Vai trò | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị vai trò hiện tại dạng badge. |
| 6 | Đơn vị | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị đơn vị trực thuộc. Trống hiển thị "—". |
| 7 | Trạng thái | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị trạng thái: active (xanh), locked (đỏ), inactive (xám), pending (vàng). |
| 8 | Ngày tạo | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị ngày tạo tài khoản. Định dạng DD/MM/YYYY HH:mm. |
| 9 | Đăng nhập cuối | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị thời gian đăng nhập gần nhất. Chưa đăng nhập hiển thị "Chưa đăng nhập". |
|  | THAO TÁC |  |  |  |  |  |
| 10 | Nút Sửa | Button | Có | Không | — | Mở modal chỉnh sửa tài khoản. Hiển thị theo phân quyền. |
| 11 | Nút Khóa/Mở khóa | Button | Có | Không | — | Mở modal khóa/mở khóa (có nhập lý do). Hiển thị theo phân quyền. |
| 12 | Nút Xóa | Button | Có | Không | — | Mở modal xác nhận xóa. Hiển thị theo phân quyền. |
| 13 | Nút Phê duyệt | Button | Có | Không | — | Mở modal phê duyệt. Chỉ hiển thị khi tài khoản đang ở trạng thái pending và người dùng có quyền phê duyệt. |
| 14 | Nút Từ chối | Button | Có | Không | — | Mở modal từ chối (nhập lý do). Chỉ hiển thị khi tài khoản đang ở trạng thái pending và người dùng có quyền phê duyệt. |
| 15 | Nút Quay lại | Button | Không | Không | — | Quay về màn hình danh sách người dùng. |

## Context

- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
