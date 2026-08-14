---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-14T04:56:43Z
locked-fields: []
consumed_by_modules: []
source-paths:
  - src/main/java/com/hanghai/kchtg/user/controller/UserController.java
  - src/main/java/com/hanghai/kchtg/user/service/UserService.java
  - src/main/java/com/hanghai/kchtg/user/repository/UserRepository.java
  - frontend/src/hooks/useUsers.ts
  - frontend/src/pages/UsersPage.tsx
  - frontend/src/services/userService.ts
  - frontend/src/hooks/useUsers.test.ts
---
# Đặc tả nghiệp vụ: Quản lý tài khoản người dùng

**Tài liệu:** BA Feature Brief
**Feature:** F-001
**Module:** M-001 — Quản trị hệ thống
**Người viết:** Business Analyst
**Ngày cập nhật:** 2026-08-05

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Quản lý toàn bộ vòng đời tài khoản người dùng trong hệ thống, bao gồm tạo mới, chỉnh sửa thông tin, khóa/mở khóa tài khoản, phân quyền theo vai trò (RBAC — Role-Based Access Control), đặt lại mật khẩu, và phê duyệt tài khoản đăng ký mới từ người dùng bên ngoài. **Hệ thống không có chức năng xóa tài khoản** — thay vào đó, Admin khóa tài khoản để vô hiệu hóa. Tính năng cung cấp giao diện quản lý tập trung cho tất cả người dùng hệ thống.

### 1.2. Tại sao cần tính năng này?

Hệ thống cần cơ chế quản lý tài khoản người dùng an toàn và linh hoạt, cho phép các vai trò Quản trị hệ thống, Lãnh đạo và Chuyên viên thực hiện đầy đủ các thao tác tạo, sửa, khóa/mở khóa tài khoản theo quy trình nghiệp vụ được thiết định, thay thế cho việc thao tác thủ công trực tiếp trên cơ sở dữ liệu như hiện tại.

### 1.3. Luồng hoạt động chính

Có 2 luồng tạo tài khoản:

**Luồng 1 — Admin tạo tài khoản trực tiếp (kích hoạt ngay):**
Admin truy cập vào module Quản lý tài khoản từ sidebar chính → chọn thao tác tạo mới → hệ thống xác thực quyền và kiểm tra tính hợp lệ của dữ liệu đầu vào (email unique, mật khẩu mạnh, trạng thái bắt buộc) → tài khoản được tạo ở trạng thái **theo lựa chọn trên form tạo mới** (Hoạt động hoặc Không hoạt động — không còn mặc định cứng ACTIVE, xem AC-001-12/BR-001-19), không cần qua bước phê duyệt → ghi nhận log audit → hiển thị thông báo thành công.

**Luồng 2 — Người dùng tự đăng ký (cần phê duyệt):**
Người dùng tự đăng ký tài khoản qua form công khai (F-271) → hệ thống tạo bản ghi chờ phê duyệt (PendingApproval) → Admin hoặc Admin-Operation xem danh sách đăng ký chờ → phê duyệt (tạo User + gán vai trò + gửi thông báo) hoặc từ chối (kèm lý do). Sau khi được phê duyệt, tài khoản được kích hoạt và người dùng có thể đăng nhập.

Các thao tác khác: chỉnh sửa thông tin, khóa/mở khóa, reset mật khẩu. **Không có chức năng xóa tài khoản** — Admin khóa tài khoản để vô hiệu hóa vĩnh viễn.

---

## 2. Ai dùng? Dùng như thế nào?

Quyền thao tác và xem tính năng được áp dụng theo hệ thống phân quyền tập trung của hệ thống. Mỗi vai trò người dùng sẽ có phạm vi truy cập và thao tác khác nhau trên tính năng này, được kiểm soát bởi cơ chế RBAC (Role-Based Access Control).

### 2.1. Cơ chế phân quyền

Hệ thống sử dụng cơ chế phân quyền linh hoạt dựa trên **tài khoản** và **nhóm** (RBAC — Role-Based Access Control). Không có rule phân quyền cố định theo vai trò — thay vào đó:

- Mỗi **tài khoản người dùng** được gán một hoặc nhiều **vai trò** (Role). Mỗi vai trò chứa một tập hợp **quyền** (Permissions).
- Mỗi **nhóm người dùng** (UserGroup) có thể được gán quyền riêng. Thành viên trong nhóm sẽ kế thừa quyền từ nhóm.
- Admin có thể tùy chỉnh quyền cho từng tài khoản hoặc nhóm thông qua màn hình **Phân quyền** (F-002).
- Phạm vi dữ liệu (toàn hệ thống / đơn vị / cá nhân) được xác định bởi tổ hợp vai trò + đơn vị trực thuộc của tài khoản.

### 2.2. Logic phân quyền đặc biệt cho tài khoản Admin Cục

Đối với tài khoản **Admin Cục**, áp dụng logic phân quyền đặc biệt sau:

- **Xem full dữ liệu:** Admin Cục có quyền xem toàn bộ dữ liệu trên hệ thống, không giới hạn phạm vi đơn vị hay khu vực.
- **Xem thông tin người chỉnh sửa:** Với mỗi bản ghi, Admin Cục thấy được thông tin người chỉnh sửa cuối cùng (họ tên, tên đăng nhập).
- **Xem thời gian cập nhật:** Admin Cục thấy được thời gian cập nhật cuối cùng của dữ liệu (timestamp).
- **Xem người tạo mới:** Admin Cục thấy được thông tin người tạo mới bản ghi (họ tên, tên đăng nhập).
- **Xem thời gian tạo mới:** Admin Cục thấy được thời gian tạo mới dữ liệu (timestamp).

> **Ghi chú:** Các trường `người tạo mới`, `thời gian tạo mới`, `người chỉnh sửa`, `thời gian cập nhật` cần được bổ sung vào bảng dữ liệu tương ứng và chỉ hiển thị đối với tài khoản Admin Cục. Với các vai trò khác, các trường này bị ẩn khỏi giao diện.

---

## 3. User Stories

Dưới đây là các câu chuyện người dùng, sắp xếp theo mức độ ưu tiên (Must > Should > Could):

### Mức Must (bắt buộc có)

- **US-001-01:** Là **Admin**, tôi muốn tạo tài khoản người dùng mới với đầy đủ thông tin (tên đăng nhập, mật khẩu, đơn vị, email, họ tên, SĐT, địa chỉ, phòng ban, chức vụ, trạng thái, ghi chú) để quản lý người dùng mới vào hệ thống. Tài khoản được tạo với trạng thái tôi chọn trên form (mặc định Hoạt động), không cần phê duyệt.
- **US-001-02:** Là **Admin**, tôi muốn chỉnh sửa thông tin tài khoản (tên, email, vai trò, đơn vị) của người dùng để cập nhật thông tin.
- **US-001-03:** Là **Admin**, tôi muốn khóa tài khoản người dùng để vô hiệu hóa tài khoản không còn sử dụng. Hệ thống không có chức năng xóa tài khoản.
- **US-001-04:** Là **Admin**, tôi muốn mở khóa tài khoản người dùng để khôi phục truy cập khi cần.
- **US-001-05:** Là **Admin**, tôi muốn reset mật khẩu cho người dùng khi họ quên mật khẩu.
- **US-001-06:** Là **Admin**, tôi muốn phân quyền theo vai trò (RBAC) để kiểm soát truy cập.
- **US-001-07:** Là **Cán bộ**, tôi muốn xem danh sách, chỉnh sửa thông tin và khóa/mở khóa tài khoản trong đơn vị mình.
- **US-001-08:** Là **người dùng hệ thống**, tôi muốn tìm kiếm và lọc danh sách người dùng theo tên, email, vai trò, trạng thái với phân trang chính xác.

### Mức Should (nên có)

- **US-001-09:** Là **Lãnh đạo**, tôi muốn xem danh sách người dùng trong đơn vị để nắm được nhân sự.
- **US-001-10:** Là **Lãnh đạo**, tôi muốn phê duyệt tài khoản tự đăng ký từ người dùng bên ngoài (F-271).
- **US-001-11:** Là **Cá nhân**, tôi muốn xem và chỉnh sửa thông tin cá nhân của chính mình.
- **US-001-12:** Là **Admin/Cán bộ/Lãnh đạo**, tôi muốn xem chi tiết tài khoản người dùng (thông tin + phân quyền hiện tại) ở chế độ read-only.
- **US-001-13:** Là **Admin/Cán bộ**, tôi muốn nhập và cập nhật 4 trường hồ sơ (Địa chỉ, Phòng ban, Chức vụ, Ghi chú) khi tạo/sửa tài khoản để hồ sơ người dùng đầy đủ hơn.

### Mức Could (có thể có sau)

- **US-001-12:** Là **Admin**, tôi muốn xuất danh sách người dùng ra file Excel để báo cáo.

---

## 4. Yêu cầu chức năng (Acceptance Criteria)

Mỗi yêu cầu dưới đây mô tả một điều hệ thống phải làm được, kèm theo cách xử lý khi có lỗi hoặc dữ liệu không như mong đợi.

**AC-001-01 — Tạo tài khoản thành công:** Admin nhập đầy đủ thông tin hợp lệ (username, password, đơn vị, email chưa tồn tại, họ tên, phòng ban, chức vụ, trạng thái — các trường bắt buộc) và nhấn Tạo. Hệ thống tạo tài khoản với trạng thái **đúng lựa chọn trên form** (không hardcode ACTIVE), hash mật khẩu, trả về toast "Tạo tài khoản thành công". Nếu email đã tồn tại → hiển thị lỗi "Email đã tồn tại". Nếu mật khẩu không đáp ứng yêu cầu → hiển thị lỗi validation mật khẩu. Nếu thiếu trạng thái → hiển thị lỗi "Vui lòng chọn trạng thái".

**AC-001-02 — Chỉnh sửa tài khoản thành công:** Admin hoặc Cán bộ chọn tài khoản, sửa thông tin (tên, email, vai trò, đơn vị) hợp lệ và nhấn Lưu. Hệ thống cập nhật thông tin, ghi log, toast "Cập nhật thành công". Nếu email mới trùng với người dùng khác → lỗi "Email đã tồn tại".

**AC-001-03 — Khóa tài khoản thành công:** Admin hoặc Cán bộ chọn tài khoản active, nhập lý do (tối thiểu 10 ký tự), nhấn Khóa. Hệ thống chuyển trạng thái sang `blocked`, vô hiệu hóa mọi session đang hoạt động của user đó, ghi UserStatusLog, toast "Khóa tài khoản thành công". Nếu tài khoản đã bị khóa → lỗi "Tài khoản đã bị khóa".

**AC-001-04 — Mở khóa tài khoản thành công:** Admin hoặc Cán bộ chọn tài khoản blocked, nhập lý do, nhấn Mở khóa. Hệ thống chuyển trạng thái sang `active`, ghi UserStatusLog, toast "Mở khóa tài khoản thành công".

**AC-001-05 — Tự động khóa sau 5 lần đăng nhập sai:** Người dùng nhập sai mật khẩu 5 lần liên tiếp. Hệ thống tự động khóa tài khoản (status = blocked), ghi UserStatusLog với lý do "5 lần đăng nhập sai", hiển thị thông báo "Tài khoản bị khóa do nhiều lần đăng nhập sai". Tự động mở khóa sau 30 phút hoặc Admin mở thủ công.

**AC-001-06 — Reset mật khẩu thành công:** Admin chọn tài khoản, nhập mật khẩu mới đáp ứng policy (≥8 ký tự, chữ hoa + chữ thường + số, khác 3 mật khẩu gần nhất), nhấn Reset. Hệ thống hash mật khẩu mới, invalidate token cũ của user, toast "Đặt lại mật khẩu thành công". Nếu mật khẩu trùng 1 trong 3 mật khẩu gần nhất → lỗi.

**AC-001-07 — Tìm kiếm và lọc danh sách người dùng (2 ô tìm kiếm):** Thanh lọc có 2 ô tìm kiếm riêng biệt: ô **email / tên đăng nhập** (`search`) và ô **họ tên** (`fullName`, tìm không dấu vẫn khớp tên có dấu — gõ "van a" khớp "Nguyễn Văn An"). Hai ô kết hợp với nhau (AND) và với bộ lọc trạng thái và đơn vị; số đếm trên các tab trạng thái phản ánh đúng bộ lọc kết hợp hiện tại. Hệ thống trả về kết quả đúng với phân trang (mặc định 20 dòng/trang, tối đa 100), tổng số record hiển thị chính xác. Kết quả rỗng → hiển thị empty state. Ô tìm kiếm chỉ chứa khoảng trắng → được coi như không có bộ lọc tương ứng.

**AC-001-08 — Phân quyền RBAC chính xác:** Cán bộ cố gắng thay đổi vai trò của người dùng khác → 403 Forbidden. Cá nhân cố sửa thông tin người dùng khác → 403 Forbidden. Chỉ Admin được phân quyền cho vai trò khác. User không thể tự thay đổi vai trò của chính mình.

**AC-001-09 — Lãnh đạo chỉ xem (read-only):** Lãnh đạo truy cập danh sách người dùng → hiển thị danh sách (read-only). Lãnh đạo cố gắng chỉnh sửa hoặc khóa/mở khóa → 403 Forbidden. **Admin tạo tài khoản không cần Lãnh đạo duyệt — tài khoản được active ngay.** Lãnh đạo chỉ phê duyệt tài khoản tự đăng ký (F-271).

**AC-001-10 — Phê duyệt tài khoản đăng ký:** Admin xem danh sách đăng ký chờ (PendingApproval), chọn phê duyệt → hệ thống tạo User với vai trò đã chọn, kích hoạt tài khoản, gửi thông báo (toàn bộ là atomic transaction). Không thể tự phê duyệt tài khoản của chính mình. Từ chối phải kèm lý do (tối thiểu 10 ký tự).

**AC-001-11 — Token reset mật khẩu hết hạn:** Người dùng yêu cầu reset mật khẩu, đợi hơn 1 giờ rồi click link reset trong email → hệ thống hiển thị lỗi "Link đặt lại mật khẩu đã hết hạn", yêu cầu gửi link mới.

**AC-001-12 — Trạng thái tạo mới lấy từ form (không hardcode ACTIVE):** Admin tạo tài khoản mới → trạng thái được lấy từ lựa chọn trên form (`status` trong `CreateUserRequest`), không còn mặc định cứng ACTIVE ở backend (`UserService.create()` phải dùng `user.setStatus(request.getStatus())` thay cho `user.setStatus(UserStatus.ACTIVE)`) và ở frontend (bỏ `status: 'ACTIVE'` cứng trong `userService.ts` khi gọi POST). Không qua bất kỳ bước phê duyệt nào. Nếu thiếu trạng thái → lỗi validation "Vui lòng chọn trạng thái". Nếu có lỗi hệ thống khi tạo → rollback toàn bộ transaction, toast "Tạo tài khoản thất bại".

**AC-001-13 — Không có chức năng xóa tài khoản:** Hệ thống không cung cấp chức năng xóa tài khoản. Để vô hiệu hóa tài khoản không còn sử dụng, Admin thực hiện khóa tài khoản (AC-001-03).

**AC-001-14 — Xem chi tiết tài khoản:** Người dùng click vào tên hoặc chọn "Xem chi tiết" từ dropdown hành động. Hệ thống hiển thị popup read-only với: (1) thông tin tài khoản (username, fullName, email, phone, **address, department, position, note** — giá trị null hiển thị "—", status, đơn vị, ngày tạo, lastLogin), (2) phân quyền hiện tại (danh sách Role kèm Permissions + danh sách Group kèm Permissions). Các trường audit (người tạo, thời gian tạo, người sửa, thời gian sửa) chỉ hiển thị với Admin Cục. Nếu tài khoản không có role/group nào → hiển thị "Chưa được phân quyền".

**AC-001-15 — Thứ tự trường form tạo mới:** Admin mở form "Thêm mới người dùng" → các trường hiển thị theo đúng thứ tự: 1) Tên đăng nhập*, 2) Mật khẩu*, 3) Đơn vị trực thuộc*, 4) Email*, 5) Họ và tên*, 6) Số điện thoại, 7) Địa chỉ, 8) Phòng ban*, 9) Chức vụ*, 10) Trạng thái*, 11) Ghi chú. Trường nào sai thứ tự → xem là lỗi UI. (done_oracle TRI-1786681457834-5887)

**AC-001-16 — Form sửa hiển thị 4 trường mới + Trạng thái:** Admin mở form "Sửa người dùng" → form hiển thị đầy đủ address, department, position, note (pre-populate dữ liệu hiện tại) + Select Trạng thái. Lưu thành công → giá trị 4 trường được cập nhật, toast "Cập nhật tài khoản thành công".

**AC-001-17 — Drawer chi tiết hiển thị 4 trường mới:** Người dùng mở drawer "Chi tiết tài khoản" → nhóm Thông tin tài khoản hiển thị thêm các dòng Địa chỉ, Phòng ban, Chức vụ, Ghi chú (giá trị null → "—") bên cạnh Trạng thái và các trường hiện có.

**AC-001-18 — Migration Flyway 4 cột nullable:** Chạy Flyway trên DB mới hoặc DB đã có dữ liệu → migration `V20260814120000__add_user_profile_columns.sql` được áp dụng, bảng `app_users` có 4 cột mới `address`, `department`, `position`, `note` đều NULL-able; dữ liệu cũ giữ nguyên (cột mới nhận NULL), không lỗi khi khởi động.

---

## 5. Quy tắc nghiệp vụ (Business Rules)

Các quy tắc này là "luật chơi" mà mọi thành phần trong hệ thống phải tuân thủ:

### 5.1. Quy tắc về tài khoản

**BR-001-01 — Email duy nhất:** Email phải là duy nhất trong toàn hệ thống. Không cho phép trùng email khi tạo mới hoặc chỉnh sửa. Nếu email đã tồn tại → từ chối với thông báo "Email đã tồn tại".

**BR-001-02 — Mật khẩu mạnh:** Mật khẩu tối thiểu 8 ký tự, phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số. Khi admin reset mật khẩu: chỉ yêu cầu ≥8 ký tự, có chữ và số (không bắt buộc ký tự đặc biệt).

**BR-001-03 — Lịch sử mật khẩu:** Khi tạo mới hoặc reset mật khẩu, mật khẩu mới phải khác 3 mật khẩu gần nhất của user.

**BR-001-04 — Mật khẩu hash:** Mọi mật khẩu phải được hash bằng bcrypt/argon2 trước khi lưu. Tuyệt đối không lưu plaintext.

### 5.2. Quy tắc về trạng thái

**BR-001-05 — Tạo tài khoản không cần phê duyệt, trạng thái theo lựa chọn từ form:** Khi Admin (hoặc vai trò có quyền tạo user) tạo tài khoản mới, trạng thái được lấy từ lựa chọn trên form (BR-001-19), **không còn mặc định cứng ACTIVE**. **Không có bước phê duyệt trung gian, không cần Lãnh đạo duyệt.**

**BR-001-06 — Tài khoản bị khóa không được đăng nhập:** Khi status = `blocked`, user không thể đăng nhập. Hệ thống trả về thông báo "Tài khoản đã bị khóa".

**BR-001-07 — Tự động khóa sau 5 lần sai:** Tài khoản tự động bị khóa sau 5 lần đăng nhập thất bại liên tiếp. Tự động mở khóa sau 30 phút, hoặc Admin mở khóa thủ công.

**BR-001-08 — Vô hiệu hóa session khi khóa:** Khi khóa tài khoản, mọi session đang hoạt động của user đó bị vô hiệu hóa ngay lập tức.

**BR-001-09 — Ghi log thay đổi trạng thái:** Mọi thay đổi trạng thái tài khoản (active ↔ blocked) phải được ghi vào `UserStatusLog` kèm lý do và người thực hiện.

**BR-001-10 — Không có chức năng xóa:** Hệ thống không cho phép xóa tài khoản người dùng dưới bất kỳ hình thức nào. Để ngừng sử dụng tài khoản, Admin thực hiện khóa tài khoản.

### 5.3. Quy tắc về phân quyền

**BR-001-11 — Chỉ Admin phân quyền:** Chỉ vai trò Admin/system-admin mới có quyền thay đổi vai trò (role) của người dùng. Cán bộ chỉ sửa thông tin và khóa/mở khóa.

**BR-001-12 — Không tự đổi vai trò:** User không thể tự thay đổi vai trò (role) của chính mình.

**BR-001-13 — System-admin đặc biệt:** Chỉ role `system-admin` mới được tạo hoặc khóa tài khoản `system-admin`.

**BR-001-14 — Cá nhân chỉ xem/sửa thông tin của mình:** Người dùng với vai trò Cá nhân chỉ có quyền xem và sửa thông tin tài khoản của chính mình.

### 5.4. Quy tắc về phê duyệt đăng ký

**BR-001-15 — Phê duyệt đăng ký là atomic:** Khi admin phê duyệt tài khoản đăng ký, toàn bộ thao tác (tạo User + gán vai trò + kích hoạt + gửi thông báo) là atomic transaction. Nếu bất kỳ bước nào thất bại → rollback toàn bộ.

**BR-001-16 — Chống tự phê duyệt:** Admin không thể phê duyệt tài khoản đăng ký của chính mình (kiểm tra email trùng).

**BR-001-17 — Từ chối phải có lý do:** Khi từ chối tài khoản đăng ký, lý do từ chối là bắt buộc (tối thiểu 10 ký tự).

### 5.5. Quy tắc về reset mật khẩu

**BR-001-18 — Token reset hết hạn 1 giờ:** Token đặt lại mật khẩu có hiệu lực trong 1 giờ kể từ khi được tạo. Sau khi hết hạn, link không thể sử dụng và phải yêu cầu token mới.

### 5.6. Quy tắc về hồ sơ người dùng (scope expansion TRI-1786681457834-5887)

**BR-001-19 — Trạng thái tạo mới lấy từ form:** `CreateUserRequest` bổ sung trường `status` (bắt buộc, `@NotNull`); `UserService.create()` thực hiện `user.setStatus(request.getStatus())` — xóa lệnh `user.setStatus(UserStatus.ACTIVE)` (UserService.java:431) và xóa `status: 'ACTIVE'` cứng khi POST ở frontend (userService.ts:98). Nếu `status` null → lỗi validation "Vui lòng chọn trạng thái".

**BR-001-20 — 4 trường hồ sơ nullable:** `address`, `department`, `position`, `note` là cột NULL-able trong bảng `app_users`; giá trị rỗng được trim và lưu NULL; `UserResponse`/`UserDetailResponse` trả về 4 trường này (null khi chưa có giá trị).

**BR-001-21 — Migration Flyway bắt buộc:** Mọi thay đổi schema phải đi qua script `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`; không dùng `ddl-auto`. Migration chỉ thêm cột, không xóa/sửa cột hiện có.

**BR-001-22 — Đặt tên trường:** Tên cột DB/tham số API bằng tiếng Anh chuẩn (`address`, `department`, `position`, `note`); nhãn UI bằng tiếng Việt có dấu (Địa chỉ, Phòng ban, Chức vụ, Ghi chú).

---

## 6. Mô hình dữ liệu

Tính năng này tạo ra/sửa đổi các bảng dữ liệu sau trong cơ sở dữ liệu:

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ khỏi bảng.
> - Các trường không được đánh dấu là các trường hiện có, được giữ nguyên.

### 6.1. Bảng UserAccount — Tài khoản người dùng

Đây là bảng chính, lưu thông tin tài khoản người dùng.

- **id:** BIGINT PK, mã số tự tăng, duy nhất cho mỗi người dùng
- **username:** VARCHAR(50) UNIQUE NOT NULL, tên đăng nhập
- **email:** VARCHAR(100) UNIQUE NOT NULL, email
- **passwordHash:** VARCHAR(255) NOT NULL, mật khẩu đã hash (bcrypt/argon2)
- **displayName:** VARCHAR(100), họ và tên hiển thị
- **phone:** VARCHAR(20), số điện thoại
- **status:** VARCHAR(20), trạng thái: `active`, `blocked`
- **roleId:** BIGINT FK → Role, vai trò của người dùng
- **organizationId:** BIGINT FK → Organization, đơn vị trực thuộc
- <span style="color:red;font-weight:bold">**createdBy:** BIGINT FK → UserAccount, người tạo bản ghi</span>
- <span style="color:red;font-weight:bold">**updatedBy:** BIGINT FK → UserAccount, người chỉnh sửa cuối cùng</span>
- **createdAt:** TIMESTAMP, thời điểm tạo bản ghi
- **updatedAt:** TIMESTAMP, thời điểm cập nhật cuối
- **lastLoginAt:** TIMESTAMP NULL, thời điểm đăng nhập cuối
- <span style="color:red;font-weight:bold">**address:** VARCHAR(255) NULL, địa chỉ (trường mới — migration V20260814120000)</span>
- <span style="color:red;font-weight:bold">**department:** VARCHAR(100) NULL, phòng ban (trường mới)</span>
- <span style="color:red;font-weight:bold">**position:** VARCHAR(100) NULL, chức vụ (trường mới)</span>
- <span style="color:red;font-weight:bold">**note:** VARCHAR(500) NULL, ghi chú (trường mới)</span>

> **Ghi chú:** Bảng UserAccount **không có trường `deletedAt`** vì hệ thống không hỗ trợ xóa tài khoản. Tài khoản không còn sử dụng được khóa (status = `blocked`) thay vì xóa.

> **Migration (TRI-1786681457834-5887):** `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` — thêm 4 cột NULL-able nêu trên vào bảng `app_users` (tên bảng thực tế trong `User.java` `@Table(name = "app_users")`). Tất cả cột mới đều nullable nên không ảnh hưởng dữ liệu cũ (các dòng hiện có nhận NULL).

### 6.2. Bảng UserStatusLog — Nhật ký thay đổi trạng thái

- **id:** BIGINT PK
- **userId:** BIGINT FK → UserAccount
- **previousStatus:** VARCHAR(20), trạng thái trước khi thay đổi
- **newStatus:** VARCHAR(20), trạng thái sau khi thay đổi
- **changedBy:** BIGINT FK → UserAccount, người thực hiện thay đổi
- **changedAt:** TIMESTAMP, thời điểm thay đổi
- **reason:** TEXT, lý do thay đổi

### 6.3. Bảng PendingApproval — Đăng ký chờ phê duyệt

- **id:** BIGINT PK
- **username:** VARCHAR(50), tên đăng nhập đề xuất
- **email:** VARCHAR(100), email đăng ký
- **passwordHash:** VARCHAR(255), mật khẩu đã hash
- **requestedRoleCode:** VARCHAR(30), mã vai trò yêu cầu
- **status:** VARCHAR(20) — `pending`, `approved`, `rejected`
- **approvedBy:** BIGINT FK → UserAccount, người phê duyệt
- **rejectionReason:** TEXT, lý do từ chối
- **createdAt:** TIMESTAMP
- **updatedAt:** TIMESTAMP

### 6.4. Các bảng liên quan khác

- **Role:** id, name, code, description, permissions (JSON), isSystem
- **Organization:** id, name, code, parentId (self-ref), type, status, coefficient
- **UserRole:** id, userId FK, roleId FK, assignedBy FK, assignedAt, expiresAt
- **PasswordResetToken:** id, userId FK, token, expiresAt, usedAt, createdAt
- **UserGroup:** id, name, code, groupType, status
- **GroupMember:** id, groupId FK, userId FK, joinedBy FK, joinedAt
- **AdminAccount:** id, username, passwordHash, adminType, moduleAccess (JSON), status, mfaEnabled
- **AccessLog:** id, userId FK, username, action, targetResource, ipAddress, userAgent, responseCode, duration_ms, status, createdAt (quản lý bởi F-005)

---

## 7. API Endpoints

Hệ thống cung cấp các API để phục vụ các thao tác liên quan đến tính năng:

| Method | Endpoint | Mô tả | Phân quyền |
|---|---|---|---|
| GET | `/api/v1/users` | Danh sách người dùng (phân trang, lọc, tìm kiếm) | JWT |
| GET | `/api/v1/users/{id}` | Chi tiết người dùng | JWT |
| POST | `/api/v1/users` | Tạo người dùng mới (trạng thái theo lựa chọn trên form — không hardcode ACTIVE) | Admin, Admin-Operation |

> **Delta (TRI-1786681457834-5887):** `CreateUserRequest` bổ sung `status` (bắt buộc) + `address`, `department`, `position`, `note`; `UpdateUserRequest` bổ sung 4 trường trên (đã có sẵn `status`); `UserResponse`/`UserDetailResponse` trả về 4 trường trên. Controller hiện hỗ trợ cả `/api/users` và `/api/v1/users` (`UserController.java:44`).
| PUT | `/api/v1/users/{id}` | Chỉnh sửa thông tin người dùng | Admin, Cán bộ |
| PUT | `/api/v1/users/{id}/lock` | Khóa/mở khóa tài khoản | Admin, Cán bộ |
| POST | `/api/v1/users/{id}/reset-password` | Reset mật khẩu (admin) | Admin |
| GET | `/api/v1/roles` | Danh sách vai trò | JWT |
| POST | `/api/v1/roles` | Tạo vai trò mới | Admin |
| PUT | `/api/v1/roles/{id}` | Chỉnh sửa vai trò | Admin |
| GET | `/api/v1/organizations` | Danh sách đơn vị | JWT |
| POST | `/api/v1/organizations` | Tạo đơn vị mới | Admin |
| GET | `/api/v1/groups` | Danh sách nhóm | JWT |
| POST | `/api/v1/groups` | Tạo nhóm mới | Admin |
| POST | `/api/v1/groups/{id}/members` | Thêm thành viên vào nhóm | Admin |
| DELETE | `/api/v1/groups/{id}/members/{userId}` | Xóa thành viên khỏi nhóm | Admin |
| GET | `/api/v1/approvals/pending` | Danh sách đăng ký chờ phê duyệt | Admin, Admin-Operation |
| POST | `/api/v1/approvals/{id}/approve` | Phê duyệt tài khoản đăng ký | Admin, Admin-Operation |
| POST | `/api/v1/approvals/{id}/reject` | Từ chối tài khoản đăng ký | Admin, Admin-Operation |
| POST | `/api/v1/users/pending` | Nộp đơn đăng ký tài khoản | Public (rate-limited) |
| POST | `/api/v1/auth/forgot-password` | Yêu cầu link đặt lại mật khẩu | Public (rate-limited) |
| POST | `/api/v1/auth/reset-password/{token}` | Đặt lại mật khẩu bằng token | Public (rate-limited) |

---

## 8. Chi tiết nghiệp vụ từng phần

> **Quy ước trình bày:** Mỗi luồng nghiệp vụ được mô tả dưới dạng bảng 2 cột: cột trái là hành động của **Người dùng**, cột phải là phản hồi/xử lý của **Hệ thống**.

### 8.1. Tạo tài khoản (Admin)

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin mở modal "Tạo tài khoản" từ nút "Thêm mới" trên màn hình danh sách | Hiển thị form tạo mới với các trường trống |
| 2 | Nhập thông tin theo thứ tự form: username, password, orgUnitId, email, fullName, phone, address, department, position, status, note | — |
| 3 | Nhấn nút "Lưu" | Validate dữ liệu đầu vào: email unique (BR-001-01), password ≥8 ký tự + chữ hoa + chữ thường + số (BR-001-02), các trường bắt buộc phải có giá trị |
| 4 | — | Nếu email đã tồn tại: hiển thị lỗi "Email đã tồn tại" dưới trường email, dừng xử lý |
| 5 | — | Nếu mật khẩu yếu: hiển thị lỗi validation dưới trường password, dừng xử lý |
| 6 | — | Nếu thiếu trường bắt buộc: hiển thị lỗi "Vui lòng nhập {tên trường}" dưới trường tương ứng |
| 7 | — | Nếu hợp lệ: tạo UserAccount với `status` = giá trị chọn trên form (BR-001-19), hash password bằng bcrypt/argon2, gán UserRole, ghi AccessLog |
| 8 | — | **Không có bước phê duyệt, không cần Lãnh đạo duyệt** — tài khoản có trạng thái đã chọn trên form |
| 9 | Xem toast thông báo | Hiển thị toast "Tạo tài khoản thành công", đóng modal, refresh danh sách |

**Các trường trong form tạo mới:**

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|
| 1 | Tên đăng nhập | username | Input text | ✅ | 3-100 ký tự, chỉ chữ thường + số + gạch dưới. Không sửa được sau khi tạo |
| 2 | Mật khẩu | password | Input.Password | ✅ | ≥8 ký tự, chữ hoa + chữ thường + số + ký tự đặc biệt (BR-001-02); có strength meter realtime. Admin đặt mật khẩu ban đầu cho người dùng |
| 3 | Đơn vị trực thuộc | orgUnitId | TreeSelect dạng cây | ✅ | Dựng cây từ id/name/code/parentId; giữ value là orgUnitId |
| 4 | Email | email | Input email | ✅ | Định dạng email hợp lệ; unique trong hệ thống (BR-001-01) |
| 5 | Họ và tên | fullName | Input text | ✅ | 2-200 ký tự |
| 6 | Số điện thoại | phone | Input text | ❌ | 10-11 chữ số nếu nhập |
| 7 | Địa chỉ | address | Input text | ❌ | Tối đa 255 ký tự; DB nullable |
| 8 | Phòng ban | department | Input text | ✅ | Tối đa 100 ký tự; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 9 | Chức vụ | position | Input text | ✅ | Tối đa 100 ký tự; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 10 | Trạng thái | status | Select | ✅ | Hoạt động (active) / Không hoạt động (inactive); giá trị chọn được gửi lên và lưu (BR-001-19) |
| 11 | Ghi chú | note | TextArea | ❌ | Tối đa 500 ký tự; DB nullable |

> **Về mật khẩu mặc định:** Hệ thống **không tự sinh mật khẩu mặc định**. Admin bắt buộc phải nhập mật khẩu ban đầu cho người dùng khi tạo tài khoản. Admin có trách nhiệm thông báo mật khẩu này cho người dùng qua kênh an toàn (email, tin nhắn nội bộ). Người dùng có thể đổi mật khẩu sau khi đăng nhập.

### 8.2. Xem chi tiết tài khoản

Admin/Cán bộ/Lãnh đạo có thể xem chi tiết thông tin tài khoản và phân quyền hiện tại của người dùng ở chế độ read-only.

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Click vào tên người dùng (hoặc chọn "Xem chi tiết" từ dropdown hành động) trên danh sách | Mở popup/modal "Chi tiết tài khoản" |
| 2 | — | Hiển thị thông tin tài khoản (read-only): username, fullName, email, phone, **address, department, position, note** (null → "—"), trạng thái (badge), đơn vị, ngày tạo, đăng nhập cuối |
| 3 | — | Hiển thị **phân quyền hiện tại** của tài khoản: danh sách vai trò (Role) đang được gán + danh sách nhóm (Group) đang tham gia. Mỗi role/group hiển thị kèm danh sách quyền (Permissions) |
| 4 | — | Các trường `người tạo`, `thời gian tạo`, `người sửa cuối`, `thời gian sửa cuối` chỉ hiển thị với tài khoản Admin Cục (xem 2.2) |
| 5 | Xem thông tin, nhấn "Đóng" | Đóng popup, quay lại danh sách |

**Các trường hiển thị trong popup Xem chi tiết:**

| Nhóm thông tin | Các trường |
|---|---|
| Thông tin tài khoản | Tên đăng nhập, Họ và tên, Email, Số điện thoại, **Địa chỉ, Phòng ban, Chức vụ, Ghi chú** (null → "—"), Trạng thái (badge), Đơn vị, Ngày tạo, Đăng nhập cuối |
| Phân quyền | Danh sách Vai trò (Role) — mỗi role kèm danh sách Permissions; Danh sách Nhóm (Group) — mỗi nhóm kèm danh sách Permissions |
| Audit (chỉ Admin Cục) | Người tạo, Thời gian tạo, Người sửa cuối, Thời gian sửa cuối |

### 8.3. Chỉnh sửa tài khoản

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin/Cán bộ chọn tài khoản từ danh sách, nhấn "Sửa" | Mở modal chỉnh sửa, pre-populate dữ liệu hiện tại của user. Username: readonly (không cho sửa) |
| 2 | Sửa các trường: fullName, email, phone, orgUnitId, address, department, position, note, status (username readonly; 4 trường mới hiển thị như trường thường) | — |
| 3 | Nhấn "Lưu" | Validate email unique nếu có thay đổi (BR-001-01) |
| 4 | — | Nếu email trùng với user khác: hiển thị lỗi "Email đã tồn tại", dừng xử lý |
| 5 | — | Nếu hợp lệ: cập nhật thông tin, ghi AccessLog |
| 6 | Xem toast | Hiển thị toast "Cập nhật tài khoản thành công", đóng modal, refresh danh sách |

### 8.4. Khóa/Mở khóa tài khoản

**Hệ thống không có chức năng xóa tài khoản.** Để vô hiệu hóa tài khoản không còn sử dụng, Admin/Cán bộ thực hiện khóa tài khoản. Admin thực hiện trực tiếp, không cần Lãnh đạo duyệt.

#### 8.4.1. Khóa tài khoản

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin/Cán bộ chọn tài khoản đang active, nhấn "Khóa" | Kiểm tra quyền: nếu không phải Admin/Cán bộ → 403 Forbidden |
| 2 | — | Hiển thị modal khóa, yêu cầu nhập lý do (tối thiểu 10 ký tự) |
| 3 | Nhập lý do khóa, nhấn "Khóa" | Validate lý do ≥ 10 ký tự |
| 4 | — | Nếu lý do < 10 ký tự: hiển thị lỗi "Lý do phải có ít nhất 10 ký tự" |
| 5 | — | Nếu hợp lệ: chuyển status → `blocked`, vô hiệu hóa tất cả session đang hoạt động của user (BR-001-08) |
| 6 | — | Ghi UserStatusLog với previousStatus, newStatus, changedBy, reason (BR-001-09) |
| 7 | Xem toast | Hiển thị toast "Khóa tài khoản thành công", refresh danh sách |

#### 8.4.2. Mở khóa tài khoản

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin/Cán bộ chọn tài khoản đang blocked, nhấn "Mở khóa" | Hiển thị modal mở khóa, yêu cầu nhập lý do (tối thiểu 10 ký tự) |
| 2 | Nhập lý do mở khóa, nhấn "Mở khóa" | Validate lý do ≥ 10 ký tự |
| 3 | — | Nếu hợp lệ: chuyển status → `active`, ghi UserStatusLog (BR-001-09) |
| 4 | Xem toast | Hiển thị toast "Mở khóa tài khoản thành công", refresh danh sách |

### 8.5. Reset mật khẩu (Admin)

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin chọn tài khoản, nhấn "Reset mật khẩu" | Hiển thị modal nhập mật khẩu mới |
| 2 | Nhập mật khẩu mới, nhấn "Xác nhận" | Validate mật khẩu: ≥8 ký tự, chữ hoa + chữ thường + số (BR-001-02) |
| 3 | — | Kiểm tra mật khẩu mới khác 3 mật khẩu gần nhất của user (BR-001-03). Nếu trùng → lỗi "Mật khẩu mới trùng với mật khẩu cũ" |
| 4 | — | Nếu hợp lệ: hash mật khẩu mới bằng bcrypt/argon2, invalidate tất cả token hiện tại của user |
| 5 | — | Ghi AccessLog |
| 6 | Xem toast | Hiển thị toast "Đặt lại mật khẩu thành công", đóng modal |

### 8.6. Đăng ký tài khoản (Người dùng bên ngoài)

Người dùng chưa có tài khoản truy cập vào trang đăng ký công khai để tạo tài khoản. Tài khoản sau khi đăng ký cần được Admin phê duyệt mới có thể sử dụng.

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Truy cập trang đăng ký (`/register`) | Hiển thị form đăng ký công khai |
| 2 | Nhập thông tin: username, fullName, email, phone, password, confirmPassword, requestedRole, orgUnitId | — |
| 3 | Nhấn "Đăng ký" | Validate dữ liệu đầu vào |
| 4 | — | Kiểm tra email chưa tồn tại trong UserAccount và PendingApproval. Nếu đã tồn tại: hiển thị "Email đã được đăng ký" (nhưng không tiết lộ email đã có tài khoản hay chưa — chống enumeration) |
| 5 | — | Kiểm tra username chưa tồn tại. Nếu trùng: hiển thị "Tên đăng nhập đã được sử dụng" |
| 6 | — | Validate password ≥8 ký tự + chữ hoa + chữ thường + số (BR-001-02). Nếu yếu: hiển thị yêu cầu cụ thể |
| 7 | — | Validate confirmPassword khớp với password. Nếu không khớp: hiển thị "Mật khẩu xác nhận không khớp" |
| 8 | — | Nếu hợp lệ: hash password, tạo bản ghi PendingApproval với `status = pending`, gửi thông báo cho Admin |
| 9 | Xem thông báo | Hiển thị màn hình "Đăng ký thành công. Vui lòng chờ Admin phê duyệt." |
| 10 | — | Gửi email xác nhận đã nhận đơn đăng ký cho người dùng |

**Các trường trong form đăng ký:**

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Ghi chú |
|---|---|---|---|---|---|
| 1 | Tên đăng nhập | username | Input text | ✅ | 3-50 ký tự, chỉ chữ thường + số + gạch dưới |
| 2 | Họ và tên | fullName | Input text | ✅ | 2-100 ký tự |
| 3 | Email | email | Input email | ✅ | Định dạng email hợp lệ |
| 4 | Số điện thoại | phone | Input text | ❌ | 10-11 chữ số nếu nhập |
| 5 | Mật khẩu | password | Input.Password | ✅ | ≥8 ký tự, chữ hoa + chữ thường + số (BR-001-02); có strength meter |
| 6 | Xác nhận mật khẩu | confirmPassword | Input.Password | ✅ | Phải khớp với trường password |
| 7 | Vai trò yêu cầu | requestedRole | Select dropdown | ✅ | Danh sách vai trò được phép đăng ký công khai (không bao gồm Admin, system-admin) |
| 8 | Đơn vị | orgUnitId | Select (searchable) | ✅ | Danh sách đơn vị từ API `/api/v1/organizations` |

**Rate limiting:** Tối đa 5 lần đăng ký/giờ từ cùng một IP. Nếu vượt quá → hiển thị "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau."

### 8.7. Phê duyệt tài khoản đăng ký (Admin)

#### 8.7.1. Phê duyệt

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin/Admin-Operation vào tab "Chờ phê duyệt" trên màn hình danh sách | Hiển thị danh sách PendingApproval có status = `pending` |
| 2 | Chọn bản ghi, nhấn "Phê duyệt" | Kiểm tra email approver không trùng với email đăng ký. Nếu trùng → từ chối "Không thể tự phê duyệt tài khoản của chính mình" (BR-001-16) |
| 3 | — | Hiển thị modal xác nhận phê duyệt, hiển thị thông tin đăng ký, có ô ghi chú (tùy chọn) |
| 4 | Nhập ghi chú (nếu cần), nhấn "Phê duyệt" | Atomic transaction (BR-001-15): tạo UserAccount (status = ACTIVE, passwordHash từ PendingApproval), gán UserRole theo requestedRoleCode, cập nhật PendingApproval (status = `approved`, approvedBy = currentUser) |
| 5 | — | Gửi email thông báo "Tài khoản đã được phê duyệt" cho người dùng |
| 6 | — | Ghi AccessLog |
| 7 | Xem toast | Hiển thị toast "Phê duyệt tài khoản thành công", refresh danh sách |

#### 8.7.2. Từ chối

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Admin/Admin-Operation chọn bản ghi, nhấn "Từ chối" | Hiển thị modal từ chối, yêu cầu nhập lý do (tối thiểu 10 ký tự) |
| 2 | Nhập lý do từ chối, nhấn "Từ chối" | Validate lý do ≥ 10 ký tự (BR-001-17) |
| 3 | — | Cập nhật PendingApproval: status = `rejected`, rejectionReason = lý do |
| 4 | — | Gửi email thông báo "Tài khoản bị từ chối" kèm lý do cho người dùng |
| 5 | Xem toast | Hiển thị toast "Đã từ chối tài khoản", refresh danh sách |

### 8.8. Tự động khóa sau 5 lần đăng nhập sai

| # | Người dùng | Hệ thống |
|---|---|---|
| 1 | Người dùng nhập sai mật khẩu khi đăng nhập | Tăng bộ đếm `failedAttempts` cho tài khoản |
| 2 | — | Nếu `failedAttempts < 5`: hiển thị "Sai mật khẩu. Còn {5 - failedAttempts} lần thử." |
| 3 | — | Nếu `failedAttempts = 5`: tự động chuyển status → `blocked`, ghi UserStatusLog với lý do "5 lần đăng nhập sai" (BR-001-07) |
| 4 | — | Hiển thị thông báo "Tài khoản bị khóa do nhiều lần đăng nhập sai. Vui lòng thử lại sau 30 phút hoặc liên hệ Admin." |
| 5 | — | Sau 30 phút: tự động chuyển status → `active`, ghi UserStatusLog với lý do "Tự động mở khóa sau 30 phút" |
| 6 | — | Hoặc Admin có thể mở khóa thủ công trước 30 phút (xem 8.3.2) |

---

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng

- Danh sách người dùng trả về trong < 500ms với 1000 records
- Phân trang mặc định 20 items/page, tối đa 100 items/page
- Tạo tài khoản (bao gồm validation + hash password + ghi log) hoàn thành trong < 2 giây (p95)

### 9.2. Khả năng mở rộng

- Hỗ trợ tối thiểu 500 concurrent users
- Database indexing trên email, username, status, roleId
- Connection pooling (HikariCP) cho hiệu năng cao
- Hỗ trợ 1000+ users trong tương lai

### 9.3. Bảo mật

- Phân quyền RBAC được áp dụng trên tất cả các API liên quan đến tính năng
- Mật khẩu hash bằng bcrypt/argon2 — không lưu plaintext (BR-001-04)
- JWT access token 30 phút, refresh token 7 ngày
- Rate limiting: login 50 lần/15 phút, reset password 3 lần/15 phút, đăng ký 5 lần/giờ
- Tài khoản tự khóa sau 5 lần đăng nhập sai (BR-001-07)
- Session bị vô hiệu hóa ngay khi tài khoản bị khóa (BR-001-08)

### 9.4. Độ tin cậy

- Transactional integrity cho CRUD
- Phê duyệt đăng ký là atomic transaction — rollback toàn bộ nếu lỗi (BR-001-15)
- UserStatusLog ghi nhận mọi thay đổi trạng thái với lý do (BR-001-09)
- Không có chức năng xóa tài khoản — tránh rủi ro mất dữ liệu (BR-001-10)

### 9.5. Trải nghiệm người dùng

- Giao diện responsive: trên điện thoại (dưới 768px), thanh menu thu gọn
- Có loading skeleton khi đang tải dữ liệu
- Có trạng thái rỗng (empty state) với hướng dẫn thân thiện
- Toast notification cho mọi hành động thành công/thất bại
- Modal xác nhận cho hành động khóa/mở khóa
- Form validation realtime (khi blur), error message hiển thị dưới mỗi trường
- Submit button disabled khi form có lỗi
- Tuân thủ tiêu chuẩn trợ năng WCAG 2.1 AA

### 9.6. Tuân thủ pháp lý

- Dữ liệu cá nhân được bảo vệ theo chính sách bảo mật
- Mật khẩu không lưu plaintext
- Audit trail cho mọi thao tác quản lý tài khoản (F-005 đảm nhận)
- Tuân thủ yêu cầu bảo vệ dữ liệu cá nhân

---

## 10. Yêu cầu giao diện người dùng

> **Nguyên tắc cốt lõi:** Mọi giá trị màu sắc, khoảng cách, kích thước chữ trong giao diện đều được định nghĩa tập trung tại 2 file `frontend/src/theme.ts` (layout, màu nền sidebar/header) và `frontend/src/tokens.ts` (màu chữ, màu trạng thái, thang số). Tuyệt đối không hardcode giá trị hex hay pixel trong component.

### 10.1. Bố cục chung

Màn hình Quản lý tài khoản người dùng dùng chung bố cục toàn hệ thống, bao gồm:

- **Thanh menu trái (sidebar):** rộng 272px, nền màu xanh dương đậm `#12468C`. Mục đang chọn được tô màu xanh sáng `#1B84FF`. Khi thu gọn (trên điện thoại), rộng còn 80px và chuyển thành nút hamburger.
- **Thanh tiêu đề trên cùng (header):** cao 64px, nền trắng, chứa tên người dùng và avatar.
- **Vùng nội dung chính:** nền xám nhạt pha xanh `#eaf0f6`, giúp các card trắng bên trong nổi bật hơn.

### 10.2. Hệ thống màu sắc

Mỗi màu sắc trong giao diện được gán một "vai trò" rõ ràng. Developer không được dùng màu theo cảm tính mà phải import đúng token:

| Khi cần... | Dùng token | Màu thực tế |
|---|---|---|
| Tiêu đề trang, số liệu quan trọng | `textPrimary` | `#0c2438` |
| Nhãn field, mô tả | `textSecondary` | `#566a7c` |
| Thời gian, trạng thái phụ, caption | `textTertiary` | `#93a3b3` |
| Nền card, modal, bảng | `surfaceCard` | `#FFFFFF` |
| Nền vùng nội dung chính | `surfacePage` | `#eaf0f6` |
| Viền card, đường kẻ | `borderDefault` | `rgba(11,46,79,0.09)` |
| Nút chính, link | `actionPrimary` | `#0E6FD6` |

### 10.3. Thang số — chỉ dùng giá trị cho phép

**Khoảng cách (spacing):** 4px, 8px, 12px, 16px, 24px, 32px. Trong đó 12px là khoảng cách mặc định giữa các trường trong form (`spaceFormField`), 16px là padding mặc định của card (`spaceMd`).

**Bo góc (radius):** 4px (cho ô textarea), 8px, 12px (cho card), 999px (dạng pill — dùng cho input, select, button).

**Cỡ chữ (font size):** 10px (metadata, caption), 13px (nhãn, nội dung), 15px (tiêu đề card, tiêu đề section), 18px (tiêu đề trang).

**Độ đậm chữ (font weight):** 400 (nội dung), 500 (nhãn, nút), 600 (số liệu quan trọng, tiêu đề).

**Font chữ:** `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` cho toàn bộ văn bản.

> **Cấm tuyệt đối:** spacing 6, 10, 14, 18; radius 6, 7, 10; font-size 12, 14, 16, 24.

### 10.4. Style có sẵn — dùng lại, đừng tự chế

Hệ thống đã định nghĩa sẵn các kiểu dáng phổ biến. Khi cần hiển thị:

- **Thời gian, caption:** dùng `metaStyle` (chữ nhỏ 10px, màu xám nhạt, weight 400)
- **Card nội dung:** dùng `cardStyle` (nền trắng, viền 0.5px, bo góc 12px, padding 16px)
- **Tag trạng thái:** dùng `badgeBaseStyle` (chữ nhỏ, weight 500, padding 2px-8px, pill)
- **Link, nút text:** dùng `actionStyle` (pill, màu actionPrimary, weight 500)
- **Đường kẻ ngăn cách:** dùng `dividerStyle`

### 10.5. Giới hạn màu nhấn — tối đa 3 lần mỗi màn

Màu `actionPrimary` (`#0E6FD6`) là màu nhấn mạnh nhất, dùng cho các hành động chính. Để tránh giao diện bị "rối", màu này chỉ xuất hiện tối đa 3 lần trên toàn bộ màn hình Quản lý tài khoản:

1. Nút "Thêm mới" trên ScreenHeader
2. Nút "Lưu" trên modal tạo/sửa
3. Nút "Phê duyệt" trên dòng tài khoản chờ duyệt (nếu có)

Các màu trạng thái (xanh lá cho active, đỏ cho blocked) và màu chữ không tính vào giới hạn này.

### 10.6. Màn hình danh sách người dùng

Màn hình chính sử dụng các component dùng chung toàn hệ thống từ `frontend/src/components/list-view/` — không được tự tạo lại:

1. **ScreenHeader:** hiển thị đường dẫn breadcrumb "Quản trị hệ thống > Quản lý tài khoản người dùng". Nút hành động: "Thêm mới" (chỉ hiện với Admin).

2. **FilterBar:** thanh lọc nằm ngang phía trên bảng, gồm: ô tìm kiếm **email / tên đăng nhập** (`search`), ô tìm kiếm **họ tên** (`fullName` — tìm không dấu vẫn khớp tên có dấu), Select vai trò, Select trạng thái (active / blocked), nút Tìm kiếm, nút Reload.

3. **StatusTabs:** 4 tab nằm ngang: Tất cả, Hoạt động, Đã khóa, Chờ phê duyệt. Mỗi tab hiển thị số lượng bản ghi trong nhóm đó. Tab đang chọn có đường gạch chân màu `actionPrimary`.

4. **DataTable:** bảng dữ liệu với tiêu đề cột cố định khi cuộn (sticky header), dòng được tô sáng khi di chuột qua (hover row). Các cột hiển thị:

| Cột | Nội dung | Loại điều khiển | Cho phép chỉnh sửa | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| STT | Số thứ tự dòng | Text (tự động) | Không | Có | Tự động đánh số | Tính theo trang: `(page-1)*pageSize + index + 1` |
| Họ và tên | fullName | Text (clickable) | Không | Có | — | In đậm; click để mở chi tiết |
| Tên đăng nhập | username | Text | Không | Có | — | — |
| Email | email | Text | Không | Có | — | — |
| Vai trò | roleName | Badge | Không | Có | — | Badge màu theo role |
| Đơn vị | orgUnitName | Text | Không | Không | "—" nếu trống | — |
| Đăng nhập cuối | lastLoginAt | DateTime | Không | Không | "Chưa đăng nhập" nếu null | Format `DD/MM/YYYY HH:mm` |
| Trạng thái | status | Badge | Không | Có | — | `active`=xanh lá, `blocked`=đỏ |
| Hành động | — | Dropdown actions | Không | Có | — | Sửa, Xem chi tiết, Khóa/Mở khóa, Reset MK. Với dòng `pending`: Phê duyệt, Từ chối. **Không có nút Xóa.** |

5. **Pagination:** thanh điều hướng trang ở cuối bảng, hiển thị tổng số dòng và số trang. Mặc định 20 dòng/trang.

### 10.7. Modal tạo/sửa tài khoản

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Edit | Default | Mô tả |
|---|---|---|---|---|---|---|---|
| 1 | Tên đăng nhập | username | Input text | ✅ (tạo) / ❌ (sửa) | ❌ (readonly khi sửa) | — | 3-100 ký tự, chỉ chữ thường + số + gạch dưới |
| 2 | Mật khẩu | password | Input.Password | ✅ (tạo) / ❌ (sửa) | ❌ (chỉ khi tạo) | — | ≥8 ký tự, chữ hoa + thường + số + ký tự đặc biệt (BR-001-02) |
| 3 | Đơn vị trực thuộc | orgUnitId | TreeSelect dạng cây | ✅ | ✅ | — | Dựng cây từ id/name/code/parentId; giữ value là orgUnitId |
| 4 | Email | email | Input email | ✅ | ✅ | — | Định dạng email; unique (BR-001-01) |
| 5 | Họ và tên | fullName | Input text | ✅ | ✅ | — | 2-200 ký tự |
| 6 | Số điện thoại | phone | Input text | ❌ | ✅ | — | 10-11 chữ số nếu nhập |
| 7 | Địa chỉ | address | Input text | ❌ | ✅ | — | Tối đa 255 ký tự; DB nullable |
| 8 | Phòng ban | department | Input text | ✅ | ✅ | — | Tối đa 100 ký tự; DB nullable nhưng bắt buộc trên form tạo (done_oracle) |
| 9 | Chức vụ | position | Input text | ✅ | ✅ | — | Tối đa 100 ký tự; DB nullable nhưng bắt buộc trên form tạo (done_oracle) |
| 10 | Trạng thái | status | Select | ✅ (tạo + sửa) | ✅ | ACTIVE ("Hoạt động") | Hoạt động (active) / Không hoạt động (inactive); giá trị chọn được gửi lên và lưu (BR-001-19) |
| 11 | Ghi chú | note | TextArea | ❌ | ✅ | — | Tối đa 500 ký tự; DB nullable |

**Modal footer:** [Hủy] outlined + [Lưu] primary, cả hai pill radius. Nút Lưu disabled khi form có lỗi; loading khi đang submit.

### 10.8. Modal khóa/mở khóa tài khoản

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Lý do | reason | TextArea | ✅ | — | Tối thiểu 10 ký tự; ghi vào UserStatusLog (BR-001-09) |

**Modal footer:** [Hủy] + [Khóa] (danger) hoặc [Mở khóa] (primary). Hiển thị tên người dùng trong nội dung modal. Admin thực hiện trực tiếp, không cần Lãnh đạo duyệt.

### 10.9. Modal phê duyệt/từ chối tài khoản đăng ký

**Phê duyệt:**

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Ghi chú | note | TextArea | ❌ | — | Ghi chú nội bộ |

**Modal footer:** [Hủy] + [Phê duyệt] (primary). Atomic transaction (BR-001-15). Chống tự phê duyệt (BR-001-16).

**Từ chối:**

| STT | Tên trường | Field Name | Loại ĐK | Bắt buộc | Default | Mô tả |
|---|---|---|---|---|---|---|
| 1 | Lý do từ chối | reason | TextArea | ✅ | — | Tối thiểu 10 ký tự (BR-001-17) |

**Modal footer:** [Hủy] + [Từ chối] (danger).

### 10.10. Popup xem chi tiết tài khoản

Mở khi click vào tên người dùng trên danh sách, hoặc chọn "Xem chi tiết" từ dropdown hành động. Toàn bộ nội dung ở chế độ **read-only**.

**Nhóm 1 — Thông tin tài khoản:**

| STT | Tên trường | Giá trị |
|---|---|---|
| 1 | Tên đăng nhập | username |
| 2 | Họ và tên | fullName |
| 3 | Email | email |
| 4 | Số điện thoại | phone (nếu không có → "—") |
| 5 | Địa chỉ | address (nếu không có → "—") |
| 6 | Phòng ban | department (nếu không có → "—") |
| 7 | Chức vụ | position (nếu không có → "—") |
| 8 | Ghi chú | note (nếu không có → "—") |
| 9 | Trạng thái | Badge: `active`=xanh lá, `inactive`=xám, `locked`=đỏ |
| 10 | Đơn vị | orgUnitName |
| 11 | Ngày tạo | createdAt (DD/MM/YYYY HH:mm) |
| 12 | Đăng nhập cuối | lastLoginAt (DD/MM/YYYY HH:mm); nếu null → "Chưa đăng nhập" |

**Nhóm 2 — Phân quyền hiện tại:**

| Mục | Nội dung |
|---|---|
| Vai trò (Role) | Danh sách các Role đang được gán, mỗi role hiển thị kèm danh sách Permissions (dạng tag/badge) |
| Nhóm (Group) | Danh sách các Group đang tham gia, mỗi group hiển thị kèm danh sách Permissions |
| Trạng thái rỗng | Nếu chưa có role/group → hiển thị "Chưa được phân quyền" (textSecondary) |

**Nhóm 3 — Audit (chỉ hiển thị với Admin Cục):**

| Mục | Giá trị |
|---|---|
| Người tạo | createdBy (fullName) |
| Thời gian tạo | createdAt |
| Người sửa cuối | updatedBy (fullName) |
| Thời gian sửa cuối | updatedAt |

**Popup footer:** Nút [Đóng]. Popup có kích thước 600px,cuộn nếu nội dung dài.

### 10.11. Các trạng thái giao diện

Giao diện phải xử lý đầy đủ các trạng thái sau:

- **Đang tải:** hiển thị skeleton — không hiển thị bảng trống gây hiểu nhầm là không có dữ liệu.
- **Không có dữ liệu:** hiển thị biểu tượng và dòng chữ "Không có người dùng nào" với màu chữ `textSecondary` và cỡ chữ `fontSizeMd`.
- **Lỗi tải dữ liệu:** hiển thị cảnh báo đỏ và nút "Thử lại" màu `actionPrimary`.

### 10.12. Phân quyền hiển thị

Giao diện tự động ẩn/hiện các thành phần dựa trên quyền (permissions) của tài khoản đang đăng nhập, không dựa trên rule cố định theo vai trò:

- **Nút "Thêm mới":** hiển thị nếu tài khoản có quyền `user.create`
- **Nút "Sửa":** hiển thị nếu có quyền `user.edit`
- **Nút "Khóa/Mở khóa":** hiển thị nếu có quyền `user.lock`
- **Nút "Reset mật khẩu":** hiển thị nếu có quyền `user.reset_password`
- **Nút "Phê duyệt"/"Từ chối":** hiển thị nếu có quyền `approval.approve` và bản ghi có status = `pending`
- **Tab "Chờ phê duyệt":** hiển thị nếu có quyền `approval.approve`
- **Popup "Xem chi tiết":** hiển thị cho mọi tài khoản đã đăng nhập
- **Trường audit (người tạo/sửa, thời gian):** chỉ hiển thị với tài khoản Admin Cục (xem mục 2.2)
- **Phạm vi dữ liệu:** mỗi tài khoản chỉ thấy người dùng trong đơn vị trực thuộc, trừ khi có quyền xem toàn hệ thống

### 10.13. Giao diện trên điện thoại

Khi màn hình nhỏ hơn 768px:

- Thanh menu trái thu gọn thành nút hamburger 80px
- Bảng dữ liệu chuyển thành dạng thẻ (card)
- Thanh lọc chuyển thành panel có thể gập/mở
- Modal thu nhỏ còn 90% chiều rộng màn hình

### 10.14. Quy ước chung cho form và modal

- **Form layout:** vertical, label đậm (`fontWeightBold`), `marginBottom: spaceFormField` (12px) cho Form.Item
- **Input/Select:** `borderRadius: radiusPill` (999px), `height: 40px`
- **Validation:** realtime (khi blur), error message hiển thị dưới field
- **Submit button:** disabled khi form có lỗi, loading khi đang submit, toast notification khi thành công/thất bại
- **Modal footer:** [Hủy] outlined + [Submit] primary, cả hai pill radius
- **Dropdown actions:** mỗi dòng trong DataTable có dropdown hành động theo permission. **Không có mục Xóa trong dropdown.**
