---
id: F-002
name: Quan ly nhom nguoi dung
slug: quan-ly-nhom-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2026-06-16T04:40:32Z
last-updated: 2026-07-27T00:00:00Z
locked-fields: []
consumed_by_modules: []
---
# QUẢN TRỊ HỆ THỐNG

## Quản lý nhóm người dùng

### Mô tả chung

| Nội dung | Mô tả |
| --- | --- |
| Mục đích | Cho phép người dùng quản lý tập trung các nhóm người dùng trong hệ thống, bao gồm tạo mới, chỉnh sửa, xóa nhóm theo loại (phòng ban, dự án, tùy chỉnh), quản lý thành viên nhóm (thêm, xóa), phân quyền cho nhóm (gán vai trò cho nhóm để thành viên thừa hưởng quyền) và tra cứu lịch sử thay đổi. |
| Tác nhân | Người dùng được phân quyền chức năng Quản lý nhóm người dùng. Quyền hạn cụ thể (xem, tạo, sửa, xóa, thêm/xóa thành viên, phân quyền nhóm, xem lịch sử) theo phân quyền hệ thống. |
| Luồng chính | Người dùng truy cập màn hình Quản lý nhóm người dùng. Hệ thống hiển thị danh sách nhóm với khu vực tìm kiếm và bộ lọc. Người dùng có thể tìm kiếm theo tên nhóm, lọc theo loại nhóm hoặc trạng thái. Người dùng nhấn Tìm kiếm, hệ thống hiển thị danh sách kết quả phù hợp. Người dùng nhấn Thêm nhóm để mở form tạo mới, nhập tên, mã, loại nhóm, mô tả, trạng thái và nhấn Lưu. Hệ thống kiểm tra tên và mã nhóm unique, tạo nhóm thành công. Sau khi tạo, người dùng có thể mở modal Quản lý thành viên để thêm người dùng vào nhóm. Người dùng có thể mở modal Phân quyền cho nhóm, chọn một hoặc nhiều vai trò từ danh sách để gán cho nhóm; toàn bộ thành viên hiện tại và tương lai của nhóm sẽ thừa hưởng quyền từ các vai trò được gán. Người dùng có thể sửa thông tin nhóm hoặc xóa nhóm (chỉ khi nhóm không còn thành viên). Người dùng có thể nhấn vào tên nhóm để xem chi tiết với 3 tab: Thông tin nhóm, Danh sách thành viên, Lịch sử thay đổi. Cá nhân chỉ xem được danh sách nhóm mình tham gia qua chế độ lọc myGroups. |
| Điều kiện trước | − Người dùng đã đăng nhập hệ thống. − Người dùng có quyền truy cập chức năng Quản lý nhóm người dùng. − Danh sách người dùng và vai trò đã có sẵn từ F-001. |
| Điều kiện sau | − Nhóm được tạo/sửa/xóa thành công, hiển thị toast thông báo và ghi nhận vào GroupHistory. − Thành viên được thêm/xóa khỏi nhóm, cập nhật danh sách thành viên và ghi GroupHistory. − Khi gán vai trò cho nhóm, toàn bộ thành viên hiện tại được thừa hưởng quyền từ các vai trò đó. − Khi thêm thành viên mới vào nhóm, tự động kế thừa quyền từ các vai trò đã gán cho nhóm. − Khi xóa thành viên khỏi nhóm, quyền thừa hưởng từ nhóm bị thu hồi (không ảnh hưởng đến quyền gán trực tiếp cho user từ F-001). |
| Quy tắc nghiệp vụ | − Tên nhóm phải là duy nhất trong toàn hệ thống; không cho phép trùng tên khi tạo mới hoặc sửa. − Mã nhóm (code) phải là duy nhất trong toàn hệ thống. − Nhóm chỉ được xóa khi không còn thành viên; chỉ Admin có quyền xóa nhóm. − Một người dùng có thể thuộc nhiều nhóm khác nhau cùng lúc. − Không được thêm cùng một người dùng vào cùng một nhóm hai lần. − Người dùng bị khóa vẫn được giữ trong nhóm nhưng không có hiệu lực thực thi. − Khi xóa người dùng khỏi hệ thống, tự động xóa record tương ứng trong GroupMember. − Tên nhóm không được để trống, tối đa 200 ký tự. − GroupType chỉ cho phép 3 giá trị: department (phòng ban), project (dự án), custom (tùy chỉnh). − Mọi thay đổi trên nhóm (tạo, sửa, xóa, thêm/xóa thành viên) phải được ghi nhận vào GroupHistory. − Admin có thể gán một hoặc nhiều vai trò (Role) cho nhóm; toàn bộ thành viên trong nhóm được thừa hưởng quyền từ các vai trò được gán. − Khi thành viên rời khỏi nhóm, quyền thừa hưởng từ nhóm bị thu hồi (không ảnh hưởng đến quyền gán trực tiếp cho user từ F-001). − Khi thêm thành viên mới vào nhóm, thành viên tự động có quyền từ các vai trò đã gán cho nhóm. − Trạng thái nhóm: Sử dụng hoặc Không sử dụng; mặc định Sử dụng khi tạo mới. |

### Mô tả màn hình

#### Danh sách nhóm

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TÌM KIẾM |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm nhóm theo tên. Giới hạn tối đa 200 ký tự. Tìm kiếm tương đối (contains). |
| 2 | Bộ lọc Loại nhóm | Dropdown | Có | Không | Tất cả | Cho phép lọc danh sách theo loại nhóm. Giá trị: Tất cả, Phòng ban (department), Dự án (project), Tùy chỉnh (custom). |
| 3 | Bộ lọc Trạng thái | Dropdown | Có | Không | Tất cả | Cho phép lọc danh sách theo trạng thái nhóm. Giá trị: Tất cả, Sử dụng, Không sử dụng. |
| 4 | Nút Tìm kiếm | Button | Không | Không | — | Thực hiện tìm kiếm với các điều kiện đã nhập. |
| 5 | Nút Làm mới | Button | Không | Không | — | Đưa toàn bộ điều kiện tìm kiếm và bộ lọc về mặc định. |
|  | DANH SÁCH |  |  |  |  |  |
| 1 | Cột STT | Label | Không | Không | Tự tăng | Hiển thị số thứ tự bản ghi trên danh sách. Giá trị tự động tăng theo thứ tự hiển thị, tính theo trang. |
| 2 | Cột Tên nhóm | Link | Không | Không | Theo dữ liệu hệ thống | Hiển thị tên nhóm. In đậm. Nhấn vào để mở màn hình Chi tiết nhóm. |
| 3 | Cột Mã nhóm | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị mã định danh viết tắt của nhóm. Dữ liệu lấy từ USER_GROUPS.CODE. |
| 4 | Cột Loại nhóm | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị loại nhóm dạng badge màu: Phòng ban (xanh dương), Dự án (tím), Tùy chỉnh (xám). Dữ liệu lấy từ USER_GROUPS.GROUP_TYPE. |
| 5 | Cột Mô tả | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị mô tả nhóm. Dữ liệu lấy từ USER_GROUPS.DESCRIPTION. Hiển thị tối đa 100 ký tự, phần còn lại hiển thị "...". |
| 6 | Cột Số thành viên | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị số lượng thành viên đang hoạt động trong nhóm. Dữ liệu được tính từ GROUP_MEMBERS với STATUS = 'ACTIVE'. |
| 7 | Cột Trạng thái | Label (Badge) | Không | Không | Theo dữ liệu hệ thống | Hiển thị trạng thái nhóm: Sử dụng (xanh lá), Không sử dụng (xám). Dữ liệu lấy từ USER_GROUPS.STATUS. |
| 8 | Cột Ngày tạo | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị ngày tạo nhóm. Dữ liệu lấy từ USER_GROUPS.CREATED_AT. Định dạng hiển thị DD/MM/YYYY HH:mm. |
| 9 | Cột Thao tác | Dropdown | Có | Không | — | Hiển thị danh sách hành động khả dụng theo quyền người dùng: Sửa, Quản lý thành viên, Phân quyền, Xóa. Các hành động bị ẩn nếu người dùng không có quyền tương ứng. Nút Xóa bị disabled kèm tooltip nếu nhóm còn thành viên. |
| 10 | Điều khiển phân trang | Pagination | Có | Không | 20 dòng/trang | Cho phép điều hướng giữa các trang và thay đổi số dòng hiển thị mỗi trang. Mặc định 20 dòng/trang, tối đa 100 dòng/trang. |

#### Tạo mới / Chỉnh sửa nhóm

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | FORM NHẬP LIỆU |  |  |  |  |  |
| 1 | Trường Tên nhóm | Textbox | Có | Có | Trống | Cho phép nhập tên nhóm. Giới hạn 2-200 ký tự. Phải duy nhất trong toàn hệ thống (kiểm tra trùng khi blur). Khi chỉnh sửa: hiển thị giá trị hiện tại. |
| 2 | Trường Mã nhóm | Textbox | Có (tạo mới) / Không (chỉnh sửa) | Có | Trống | Cho phép nhập mã viết tắt của nhóm. Giới hạn 2-30 ký tự, chỉ cho phép chữ hoa, số và dấu gạch dưới. Phải duy nhất trong toàn hệ thống. Không cho phép chỉnh sửa sau khi đã tạo. |
| 3 | Trường Loại nhóm | Dropdown | Có | Có | (Chưa chọn) | Cho phép chọn loại nhóm. Giá trị: Phòng ban (department), Dự án (project), Tùy chỉnh (custom). Không cho phép giá trị khác. |
| 4 | Trường Mô tả | TextArea | Có | Không | Trống | Cho phép nhập mô tả mục đích, phạm vi của nhóm. Giới hạn tối đa 1000 ký tự. |
| 5 | Trường Trạng thái | Dropdown | Có | Có | Khi tạo mới: Sử dụng. Khi chỉnh sửa: hiển thị trạng thái hiện tại của nhóm. | Cho phép chọn trạng thái nhóm. Giá trị: Sử dụng, Không sử dụng. |
| 6 | Nút Hủy | Button | Không | Không | — | Đóng modal, không lưu thay đổi. |
| 7 | Nút Lưu | Button | Không | Không | — | Lưu thông tin nhóm. Nút bị disabled khi form có lỗi validation. Hiển thị loading khi đang xử lý. Hiển thị toast thông báo thành công hoặc lỗi sau khi hoàn tất. |

#### Xóa nhóm

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | XÁC NHẬN XÓA |  |  |  |  |  |
| 1 | Nội dung xác nhận | Label | Không | Không | — | Hiển thị thông báo: "Bạn có chắc chắn muốn xóa nhóm \"{tên nhóm}\"? Hành động này không thể hoàn tác." |
| 2 | Cảnh báo còn thành viên | Label | Không | Không | — | Nếu nhóm còn thành viên: hiển thị thông báo lỗi "Không thể xóa nhóm còn X thành viên. Vui lòng xóa hết thành viên trước." và không cho phép thao tác Xóa. |
| 3 | Nút Hủy | Button | Không | Không | — | Đóng modal, không thực hiện xóa. |
| 4 | Nút Xóa | Button | Không | Không | — | Thực hiện xóa nhóm. Chỉ hiển thị khi nhóm không còn thành viên. Màu đỏ (danger). Hiển thị toast thông báo sau khi hoàn tất. |

#### Quản lý thành viên

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | THÊM THÀNH VIÊN |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm người dùng theo họ tên hoặc email. Giới hạn tối đa 100 ký tự. Tìm kiếm tương đối (contains). |
| 2 | Danh sách người dùng chưa thuộc nhóm | Table (có Checkbox) | Có | Không | Tất cả bỏ chọn | Hiển thị danh sách người dùng trong hệ thống chưa thuộc nhóm hiện tại. Mỗi dòng có một checkbox để chọn. Các cột hiển thị: Checkbox, STT, Họ và tên, Email, Đơn vị. Dữ liệu lấy từ API danh sách người dùng (F-001), lọc những người chưa có trong GROUP_MEMBERS của nhóm. Hỗ trợ phân trang. |
| 3 | Nút Add | Button | Không | Không | — | Thêm toàn bộ người dùng đã được chọn (tick checkbox) vào nhóm. Nút bị disabled nếu chưa chọn người dùng nào. Hiển thị toast "Đã thêm X thành viên" sau khi thành công. Nếu có người dùng đã thuộc nhóm (trường hợp race condition), bỏ qua và thông báo số lượng đã bỏ qua. |
| 4 | Nút Đóng | Button | Không | Không | — | Đóng modal quản lý thành viên. |
|  | DANH SÁCH THÀNH VIÊN |  |  |  |  |  |
| 1 | Cột STT | Label | Không | Không | Tự tăng | Hiển thị số thứ tự thành viên trong danh sách. |
| 2 | Cột Họ và tên | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị họ tên người dùng. Dữ liệu lấy từ APP_USERS.FULL_NAME. |
| 3 | Cột Email | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị email người dùng. Dữ liệu lấy từ APP_USERS.EMAIL. |
| 4 | Cột Ngày tham gia | Label | Không | Không | Theo dữ liệu hệ thống | Hiển thị ngày tham gia nhóm. Dữ liệu lấy từ GROUP_MEMBERS.JOINED_AT. Định dạng hiển thị DD/MM/YYYY. |
| 5 | Cột Thao tác | Button (icon) | Có | Không | — | Hiển thị nút Xóa (biểu tượng thùng rác) để loại bỏ thành viên khỏi nhóm. Không ảnh hưởng đến tài khoản người dùng. |
| 7 | Nút Đóng | Button | Không | Không | — | Đóng modal quản lý thành viên. |

#### Phân quyền cho nhóm

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | DANH SÁCH VAI TRÒ |  |  |  |  |  |
| 1 | Ô Tìm kiếm | Textbox | Có | Không | Trống | Cho phép nhập từ khóa để tìm kiếm vai trò theo tên hoặc mã vai trò. Giới hạn tối đa 100 ký tự. Tìm kiếm tương đối (contains). |
| 2 | Sơ đồ cây vai trò | Tree (có Checkbox) | Có | Không | Theo dữ liệu đã gán trước đó | Hiển thị danh sách vai trò (Role) dạng sơ đồ cây phân cấp theo nhóm chức năng. Dữ liệu lấy từ F-001. Mỗi nút lá (vai trò) có một checkbox để chọn. Các nút cha (nhóm chức năng) có thể mở rộng/thu gọn. Checkbox của nút cha tự động tick/bỏ tick toàn bộ vai trò con bên trong. Các checkbox được tick sẵn nếu vai trò đó đã được gán cho nhóm. Hỗ trợ trạng thái bán phần (indeterminate) khi chỉ một số vai trò con được chọn. |
| 3 | Nút Lưu | Button | Không | Không | — | Lưu danh sách vai trò đã chọn cho nhóm. Hệ thống cập nhật bảng GroupRole (groupId, roleId). Ghi nhận vào GroupHistory. Hiển thị toast "Đã cập nhật phân quyền cho nhóm". Khi lưu thành công: toàn bộ thành viên hiện tại của nhóm được thừa hưởng quyền từ các vai trò mới; thành viên mới thêm vào sau này tự động có quyền. |
| 4 | Nút Đóng | Button | Không | Không | — | Đóng modal, không lưu thay đổi. |

#### Chi tiết nhóm

| STT | Tên trường / Điều khiển | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Mô tả |
| --- | --- | --- | --- | --- | --- | --- |
|  | TAB THÔNG TIN NHÓM |  |  |  |  |  |
| 1 | Tab Thông tin nhóm | Tab | Không | Không | Tab mặc định | Hiển thị thông tin chi tiết của nhóm: tên nhóm, mã nhóm, loại nhóm, mô tả, trạng thái, ngày tạo, người tạo. Dữ liệu lấy từ USER_GROUPS. |
| 2 | Tab Danh sách thành viên | Tab | Không | Không | — | Hiển thị bảng danh sách thành viên của nhóm (giống giao diện trong modal Quản lý thành viên). Nếu người dùng có quyền, hiển thị thêm nút Thêm thành viên và nút Xóa thành viên. |
| 3 | Tab Lịch sử thay đổi | Tab | Không | Không | — | Hiển thị bảng lịch sử thay đổi của nhóm. Dữ liệu lấy từ GROUP_HISTORIES. Các cột: Thời gian (PERFORMED_AT, định dạng DD/MM/YYYY HH:mm:ss), Người thực hiện (PERFORMED_BY), Hành động (ACTION), Ghi chú (NOTES). Chỉ Admin mới xem được tab này. Sắp xếp giảm dần theo thời gian. Có phân trang. |

## Context

- Backend: Spring Boot + Spring Security + JWT
- Frontend: ReactJS
- Database: MSSQL 2022
