# F-001: Tóm tắt nghiệp vụ Quản lý tài khoản người dùng
*Dành cho PO/BA review — Ngôn ngữ thân thiện*

---

## 1. F-001 làm gì và tại sao cần?

**F-001** là module quản lý toàn bộ vòng đời của một tài khoản trong hệ thống. Bao gồm: Tạo mới, Chỉnh sửa thông tin, Xem chi tiết, Khóa/Hủy kích hoạt (không xóa) và Quản lý quyền truy cập.

Module này là nền tảng bắt buộc cho mọi hoạt động hệ thống — không có tài khoản người dùng thì tất cả các module nghiệp vụ khác (F-002 đến F-006) không thể vận hành.

---

## 2. Cách phân quyền trong hệ thống

Hệ thống **không dùng vai trò cố định** (như "Admin", "User" cố định). Thay vào đó, quyền được gán **động** theo 2 cấp:

| Cấp phân quyền | Cách hoạt động | Ví dụ |
|---|---|---|
| **Gán trực tiếp cho tài khoản** | Mỗi tài khoản được gán từng quyền cụ thể (ví dụ: `user:read`, `user:manage`). Ai có quyền đó thì làm được thao tác đó. | Tài khoản A có `user:manage` → được tạo/sửa/khóa user khác. |
| **Gán cho nhóm tài khoản** | Quản trị viên tạo nhóm → gán quyền cho cả nhóm → thêm người vào nhóm. Người trong nhóm tự động có quyền của nhóm. | Nhóm "Quản lý kỹ thuật" có `orgunit:read` + `kcht:manage` → mọi thành viên trong nhóm tự động có quyền này. |

**Quyền của một tài khoản = quyền gán riêng + quyền từ tất cả nhóm mà tài khoản đó thuộc.**

### Ai được phép thao tác trên F-001?

| Người dùng | Thao tác được phép |
|---|---|
| Có quyền `user:manage` | Tạo, sửa, khóa/mở khóa, phân quyền cho tài khoản khác |
| Có quyền `user:read` | Xem danh sách, xem chi tiết |
| Cá nhân (đã đăng nhập) | Xem và sửa thông tin của chính mình (không cần quyền `user:manage`) |
| Admin Cục | Toàn quyền như người có `user:manage` + xem thêm metadata (ai tạo, ai sửa, thời gian tạo/sửa) |

---

## 3. Các quy trình nghiệp vụ chính

### 3.1. Tạo tài khoản mới

**Ai tạo:** Người dùng có quyền `user:manage`.

**Các bước:**
1. Admin nhập form tạo tài khoản với **9 trường thông tin** (chi tiết ở mục 5 bên dưới).
2. **Mật khẩu mặc định:** Hệ thống điền sẵn `"Asdqwe@123"` — admin không cần nhập thủ công, chỉ thay đổi nếu muốn.
3. Hệ thống kiểm tra:
   - Email chưa từng tồn tại trong hệ thống.
4. Sau khi tạo xong, tài khoản được **kích hoạt ngay lập tức** (trạng thái ACTIVE) — không cần phê duyệt thêm.

> **Quyết định PO/BA (05/08/2026):** Admin tạo tài khoản = kích hoạt trực tiếp. Phê duyệt chỉ áp dụng cho trường hợp người dùng tự đăng ký (F-271).

### 3.2. Chỉnh sửa thông tin tài khoản

**Ai sửa:**
- Người có quyền `user:manage` → sửa được thông tin của bất kỳ ai.
- Cá nhân (đã đăng nhập) → chỉ sửa được thông tin của chính mình.

**Trường nào có thể sửa:** Họ tên, điện thoại, địa chỉ, phòng ban, chức vụ, ghi chú, trạng thái (ACTIVE/INACTIVE).
**Trường nào KHÔNG được sửa sau khi tạo:** Tên đăng nhập (email), mật khẩu, đơn vị trực thuộc.

### 3.3. Khóa / Mở khóa tài khoản

**Ai làm:** Người có quyền `user:manage`.

**Quy trình:**
1. Chọn tài khoản cần khóa/mở khóa → nhấn nút tương ứng.
2. Nhập lý do (tối thiểu 10 ký tự) → xác nhận.
3. Hệ thống thực hiện thao tác → tài khoản đó không thể đăng nhập nữa (nếu khóa).
4. Tất cả các phiên đăng nhập (JWT token) của người đó bị hủy ngay lập tức.

**Lưu ý:** Nếu tài khoản đã bị khóa, hệ thống báo lỗi — không cho khóa trùng.

### 3.4. Quên mật khẩu (Người dùng tự thực hiện)

**Ai thực hiện:** Bất kỳ người dùng nào đã có tài khoản trong hệ thống.

**Quy trình:**
1. Người dùng nhấn nút "Quên mật khẩu" trên màn đăng nhập.
2. Nhập địa chỉ email của tài khoản → hệ thống gửi email chứa link đặt lại mật khẩu.
3. Người dùng mở link → nhập mật khẩu mới (phải đủ mạnh: ≥8 ký tự, có chữ hoa + thường + số + ký tự đặc biệt).
4. Hoàn tất.

**Rate limit:** Tối đa 3 yêu cầu trong 15 phút cho cùng một email.
**Token hết hạn:** Link đặt lại mật khẩu chỉ có hiệu lực **1 giờ** kể từ khi gửi.

> ⚠️ **Admin không có action "Đặt lại mật khẩu"** — thao tác này do người dùng tự thực hiện qua cơ chế "Quên mật khẩu".

### 3.5. Người dùng tự đăng ký (F-271)

Tính năng cho phép người dùng bên ngoài tạo tài khoản tự nguyện.

**Quy trình:**
1. Người dùng vào form "Đăng ký tài khoản" → nhập thông tin cơ bản.
2. Tài khoản được tạo với trạng thái **PENDING_APPROVAL** (chờ phê duyệt).
3. Người có quyền `user:approve` xem danh sách → duyệt hoặc từ chối.
4. Nếu duyệt → tài khoản thành ACTIVE.
5. Nếu từ chối → phải nhập lý do (tối thiểu 10 ký tự).

**Rate limit:** Tối đa 5 lần đăng ký/giờ cho cùng một IP.

---

## 4. Các quy tắc nghiệp vụ quan trọng

| ID | Tên Quy Tắc | Mô Tả |
|---|---|---|
| **BR-001** | **Tính duy nhất** | Không thể tạo 2 tài khoản có cùng email hoặc cùng tên đăng nhập. |
| **BR-002** | **Chính sách mật khẩu** | Mật khẩu tối thiểu **8 ký tự**, có chữ HOA + chữ thường + số + ký tự đặc biệt. |
| **BR-003** | **Không xóa tài khoản** | Tài khoản **không bao giờ bị xóa** khỏi hệ thống. Chỉ có thể thay đổi trạng thái: **KÍCH HOẠT** hoặc **HỦY KÍCH HOẠT**. Việc này để giữ lại lịch sử thao tác và dữ liệu liên quan (audit). |
| **BR-004** | **Bảo mật đăng nhập** | Tự động khóa (Locked) tài khoản nếu đăng nhập sai mật khẩu 5 lần liên tiếp. Tự mở khóa sau 30 phút hoặc Admin mở khóa thủ công. |
| **BR-005** | **Quên mật khẩu** | Admin **KHÔNG** có thao tác "Đặt lại mật khẩu" cho user khác. Quy trình là: Người dùng tự ấn "Quên mật khẩu" → Hệ thống gửi email link đặt lại mật khẩu → Người dùng tự thực hiện. |
| **BR-006** | **Token đặt lại mật khẩu** | Link đặt lại mật khẩu trong email chỉ có hiệu lực 1 giờ. |
| **BR-007** | **Mật khẩu mặc định** | Tài khoản do Admin tạo mới sẽ sử dụng mật khẩu hệ thống gán sẵn là `"Asdqwe@123"`. |
| **BR-008** | **Nhật ký thay đổi trạng thái** | Mọi lần thay đổi trạng thái tài khoản đều được ghi lại: ai thay đổi, từ trạng thái nào, sang trạng thái nào, lý do. |

---

## 5. Thông tin nhập trên form Tạo mới (9 trường)

Form tạo tài khoản gồm **09 trường** (theo thứ tự ưu tiên):

| STT | Tên Trường (Hiển thị) | Trường (API/DB) | Bắt buộc? | Quy định |
|---|---|---|---|---|
| 1 | **Đơn vị trực thuộc** | `orgUnitId` | ✅ Có | Chọn từ cây đơn vị phân cấp. |
| 2 | **Email** | `email` / `username` | ✅ Có | Email này sẽ đóng vai trò là **tên đăng nhập**. |
| 3 | **Họ và tên** | `fullName` | ✅ Có | Tối đa 200 ký tự. |
| 4 | **Số điện thoại** | `phone` | ❌ Không | 10-11 chữ số nếu nhập. |
| 5 | **Địa chỉ** | `address` | ❌ Không | Tối đa 255 ký tự. |
| 6 | **Phòng ban** | `department` | ✅ Có | Tối đa 100 ký tự. |
| 7 | **Chức vụ** | `position` | ❌ Không | Tối đa 100 ký tự. |
| 8 | **Trạng thái** | `status` | ✅ Có | Chọn: **Kích hoạt** hoặc **Hủy kích hoạt**. |
| 9 | **Ghi chú** | `note` | ❌ Không | Tối đa 500 ký tự. |

> **Quy tắc mật khẩu:** Không có ô nhập mật khẩu tay. Hệ thống tự gán mật khẩu mặc định là `"Asdqwe@123"` cho tài khoản mới.

---

## 6. Quy định giao diện đặc biệt

Các màn hình chuẩn của hệ thống được quy định tại 2 file:
*   📂 **Danh sách:** `docs/conventions/list-screen-ui-standard.md`
*   📂 **Form & Popup:** `docs/conventions/form-and-list-patterns.md`

F-001 tuân thủ các chuẩn trên, nhưng có các **điểm khác biệt** sau Dev cần lưu ý:

| STT | Chuẩn hệ thống (Reference) | Điểm khác biệt tại F-001 |
|---|---|---|
| 1 | **Màn hình danh sách** (`list-screen-ui-standard.md`) | **Tìm kiếm tách đôi:** Khác với 1 ô tìm kiếm chuẩn, F-001 có 2 ô tìm kiếm riêng biệt (1 ô cho Email/Username, 1 ô cho Họ tên). |
| 2 | **Form tạo** (`form-and-list-patterns.md`) | **Thay đổi thứ tự trường:** Chuyển "Đơn vị trực thuộc" lên đầu (STT 1) và "Email" lên STT 2. |
| 3 | **Form tạo** (`form-and-list-patterns.md`) | **Không có trường mật khẩu:** Không có ô nhập password tay, hệ thống tự gán mật khẩu mặc định. |
| 4 | **Hành động xóa** | **Không có nút Xóa:** Thay vì xóa vĩnh viễn, F-001 dùng nút "Hủy kích hoạt" hoặc "Khóa" để chỉ thay đổi trạng thái. |
| 5 | **Giao diện Modal** | **Bắt buộc nhập lý do:** Modal Khóa/Hủy kích hoạt bắt buộc phải có trường "Lý do" (tối thiểu 10 ký tự) để lưu vào `UserStatusLog`. |
