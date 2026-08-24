---
feature-id: M-001
features: F-001
document: lean-spec
output-mode: ba-analysis
last-updated: "2026-08-14"
module-name: Quản trị hệ thống
stack: Spring Boot (Java/Maven), MSSQL Server, ReactJS + Ant Design (theme.ts / tokens.ts)
actors: A-001 (Admin / system-admin), A-002 (Lãnh đạo), A-003 (Cán bộ / Chuyên viên), A-005 (Cá nhân)
complexity: complex
triage-id: TRI-1786681457834-5887
change-type: scope_expansion
---

# BA Analysis — Quản lý tài khoản người dùng (F-001) — Scope Expansion TRI-1786681457834-5887

## 1. Tổng quan

### 1.1. Mục đích

Phân tích nghiệp vụ cho tính năng **F-001 — Quản lý tài khoản người dùng** thuộc Module M-001 — Quản trị hệ thống, bao gồm toàn bộ vòng đời tài khoản: tạo mới, chỉnh sửa, xem chi tiết, khóa/mở khóa, reset mật khẩu, phân quyền RBAC và phê duyệt tài khoản tự đăng ký (F-271).

Tài liệu này được mở rộng theo **scope expansion TRI-1786681457834-5887** (mở lại module ngày 2026-08-14) với phạm vi thay đổi:

1. **Thêm 4 trường hồ sơ mới** cho tài khoản: `address` (Địa chỉ), `department` (Phòng ban), `position` (Chức vụ), `note` (Ghi chú) — tất cả **nullable** ở tầng database.
2. **Migration Flyway** `V20260814120000__add_user_profile_columns.sql` thêm 4 cột vào bảng `app_users`.
3. **Reshape form Thêm mới/Sửa/Chi tiết** người dùng: giữ `username` + `password` ở đầu form, thêm 4 trường mới và thêm trường **Trạng thái** vào form tạo mới, theo đúng thứ tự trường bắt buộc.
4. **Trạng thái tạo mới lấy từ form** (không còn hardcode `ACTIVE`): thay `user.setStatus(UserStatus.ACTIVE)` trong `UserService.create()` bằng giá trị trạng thái do người dùng chọn trên form.

Nội dung tìm kiếm tách biệt (search-split) của lần trước được **giữ nguyên**: 2 ô tìm kiếm riêng biệt trên FilterBar — ô `search` (email / tên đăng nhập) và ô `fullName` (họ tên, tìm không dấu) — kết hợp AND với bộ lọc trạng thái/đơn vị (AC-001-07).

### 1.2. Phạm vi

| STT | Feature ID | Tên tính năng | Độ ưu tiên | Actor chính |
|-----|-----------|--------------|------------|-------------|
| 1 | F-001 | Quản lý tài khoản người dùng (tạo/sửa/chi tiết/khóa/reset/phân quyền) | P0 | Admin (A-001), Cán bộ (A-003) |

**Phạm vi mở rộng TRI-1786681457834-5887 (bắt buộc):**

| # | Capability | Notes |
|---|---|---|
| 1 | Thêm 4 cột `address`, `department`, `position`, `note` vào bảng `app_users` | Nullable; qua Flyway `V20260814120000__add_user_profile_columns.sql` |
| 2 | Form Thêm mới theo thứ tự: username, password, orgUnit, email, fullName, phone, address, department, position, status, note | Theo done_oracle của triage |
| 3 | Trạng thái tạo mới lấy từ form (`status`), không hardcode ACTIVE | Bỏ `user.setStatus(UserStatus.ACTIVE)` tại `UserService.java:431` và `status: 'ACTIVE'` tại `userService.ts:98` |
| 4 | Form Sửa hiển thị 4 trường mới + Trạng thái | Pre-populate dữ liệu hiện tại |
| 5 | Drawer Chi tiết hiển thị 4 trường mới + Trạng thái | Read-only, giá trị rỗng hiển thị "—" |
| 6 | DTO request/response bổ sung 4 trường + `status` ở Create | `CreateUserRequest`, `UpdateUserRequest`, `UserResponse`, `UserDetailResponse` |

**Ngoài phạm vi (giữ nguyên):** SSO/OAuth, MFA/TOTP, audit log (F-005 đảm nhận), LDAP/AD, self-registration F-271 (không thay đổi), luồng tìm kiếm search-split (không thay đổi).

### 1.3. Luồng hoạt động chính

**Luồng 1 — Admin tạo tài khoản trực tiếp (trạng thái theo lựa chọn từ form):**
Admin truy cập module Quản lý tài khoản → chọn "Thêm mới" → form hiển thị theo thứ tự cố định (username, password, orgUnit, email, fullName, phone, address, department, position, status, note) → hệ thống xác thực quyền và validate dữ liệu (email unique, mật khẩu mạnh, trạng thái bắt buộc) → tài khoản được tạo với trạng thái **đúng giá trị đã chọn trên form** (Hoạt động hoặc Không hoạt động), **không hardcode ACTIVE**, không qua bước phê duyệt → ghi nhận audit → toast thành công.

**Luồng 2 — Người dùng tự đăng ký (cần phê duyệt):** giữ nguyên như trước — form công khai F-271 → PendingApproval → Admin phê duyệt/từ chối. Không thuộc phạm vi expansion này.

**Luồng 3 — Sửa tài khoản:** Admin/Cán bộ mở drawer Sửa → form pre-populate fullName, email, phone, orgUnitId, status + 4 trường mới (address, department, position, note) → lưu qua PUT → cập nhật, toast "Cập nhật thành công".

**Luồng 4 — Xem chi tiết:** mở drawer Chi tiết → hiển thị read-only các trường hiện có + Địa chỉ, Phòng ban, Chức vụ, Ghi chú (giá trị null → "—") + Trạng thái.

---

## 2. Actors & Permissions

| Role | Level | Permissions | Actor ID |
|---|---|---|---|
| **Admin** (system-admin) | Full access | Tạo, sửa, khóa/mở khóa, reset mật khẩu, phân quyền (`user.create`, `user.edit`, `user.lock`, `user.reset_password`) | A-001 |
| **Lãnh đạo** | View only | Xem danh sách/chi tiết (read-only); phê duyệt tài khoản tự đăng ký (F-271) | A-002 |
| **Cán bộ** | View + Edit | Xem danh sách, chỉnh sửa thông tin, khóa/mở khóa trong đơn vị mình | A-003 |
| **Cá nhân** | Self only | Chỉ xem và sửa thông tin cá nhân của chính mình | A-005 |

Logic đặc biệt Admin Cục: xem full dữ liệu + thông tin người tạo/sửa, thời gian tạo/sửa trên màn chi tiết (giữ nguyên, xem feature-brief mục 2.2).

---

## 3. Use Cases

### 3.1. UC-001 — Tạo mới tài khoản (reshaped)

**Actor:** Admin (A-001)

**Preconditions:**
- Đã đăng nhập với quyền `user.create`
- Đã tải xong danh sách đơn vị (cây orgUnit) cho TreeSelect

**Main Flow:**
1. Admin mở drawer "Thêm mới người dùng" từ nút "Thêm mới"
2. Hệ thống hiển thị form theo **thứ tự cố định**: Tên đăng nhập → Mật khẩu → Đơn vị trực thuộc → Email → Họ và tên → Số điện thoại → Địa chỉ → Phòng ban → Chức vụ → Trạng thái → Ghi chú
3. Admin nhập: username, password, orgUnitId, email, fullName (bắt buộc); phone, address (tùy chọn); department, position (bắt buộc trên form tạo); status (bắt buộc, Select Hoạt động/Không hoạt động, mặc định chọn Hoạt động); note (tùy chọn)
4. Admin nhấn "Tạo mới"
5. Hệ thống validate: username/email unique, password policy, trường bắt buộc, `status` không null
6. Hệ thống tạo User với `user.setStatus(request.getStatus())` — **trạng thái đúng giá trị chọn trên form**, không hardcode
7. Hệ thống hiển thị toast "Tạo tài khoản thành công", đóng drawer, refresh danh sách

**Alternative Flows:**
- **AF-001:** Email trùng → lỗi "Email đã tồn tại" dưới trường email, dừng xử lý
- **AF-002:** Mật khẩu yếu → lỗi validation dưới trường password
- **AF-003:** Thiếu trường bắt buộc (kể cả status) → lỗi "Vui lòng nhập/chọn {tên trường}"
- **AF-004:** Đơn vị chọn không tồn tại → 400 "Không tìm thấy đơn vị với id: ..." (giữ hành vi hiện tại của `UserService.create()`)

**Postconditions:**
- User được lưu với `status` = giá trị form (ACTIVE hoặc INACTIVE), 4 trường mới được lưu (null nếu để trống)
- Cột mới trong DB do migration `V20260814120000__add_user_profile_columns.sql` tạo

### 3.2. UC-002 — Sửa tài khoản (reshaped)

**Actor:** Admin (A-001), Cán bộ (A-003)

**Main Flow:**
1. Chọn tài khoản → "Sửa" → drawer mở, pre-populate: fullName, email, phone, orgUnitId, status + address, department, position, note (username readonly)
2. Sửa các trường (4 trường mới hiển thị như trường thường)
3. Nhấn "Cập nhật" → validate (email unique nếu đổi) → PUT → toast "Cập nhật tài khoản thành công"

**Postconditions:**
- `UpdateUserRequest` nhận 4 trường mới + status (đã có sẵn `status` trong DTO hiện tại), áp dụng cập nhật có điều kiện (chỉ cập nhật trường được gửi)

### 3.3. UC-003 — Xem chi tiết tài khoản (reshaped)

**Actor:** Mọi tài khoản đã đăng nhập (read-only)

**Main Flow:**
1. Click tên người dùng hoặc "Xem chi tiết" → drawer Chi tiết
2. Nhóm "Thông tin tài khoản" hiển thị: Tên đăng nhập, Họ và tên, Email, Số điện thoại, **Địa chỉ**, **Phòng ban**, **Chức vụ**, **Ghi chú**, Trạng thái (badge), Đơn vị, Ngày tạo, Đăng nhập cuối
3. Giá trị null của 4 trường mới → hiển thị "—"
4. Nhóm phân quyền + audit (chỉ Admin Cục) giữ nguyên

---

## 4. User Stories (MoSCoW)

| ID | Story | Priority | Source |
|---|---|---|---|
| US-001 | Là **Admin**, tôi muốn tạo tài khoản người dùng mới với đầy đủ thông tin (username, password, đơn vị, email, họ tên, SĐT, địa chỉ, phòng ban, chức vụ, trạng thái, ghi chú) — **trạng thái do tôi chọn trên form**, để quản lý người dùng mới vào hệ thống. | Must | Feature-brief AC-001-01, AC-001-15 |
| US-002 | Là **Admin**, tôi muốn chỉnh sửa thông tin tài khoản (email, họ tên, SĐT, địa chỉ, phòng ban, chức vụ, ghi chú, đơn vị, trạng thái) để cập nhật hồ sơ. | Must | Feature-brief AC-001-02 |
| US-003 | Là **Admin**, tôi muốn xem chi tiết tài khoản kèm 4 trường hồ sơ mới (địa chỉ, phòng ban, chức vụ, ghi chú) ở chế độ read-only. | Must | Feature-brief AC-001-14 |
| US-004 | Là **người dùng hệ thống**, tôi muốn tìm kiếm và lọc danh sách người dùng với **2 ô tìm kiếm** (email/tên đăng nhập + họ tên không dấu) theo trạng thái/đơn vị và phân trang chính xác. | Must | Feature-brief AC-001-07 (search-split, giữ nguyên) |
| US-005 | Là **Admin**, tôi muốn khóa/mở khóa tài khoản, reset mật khẩu, phân quyền RBAC. | Must | Feature-brief US-001-03..06 |
| US-006 | Là **Lãnh đạo**, tôi muốn xem danh sách/chi tiết người dùng (read-only). | Should | Feature-brief US-001-09 |
| US-007 | Là **Cá nhân**, tôi muốn xem và chỉnh sửa thông tin cá nhân của chính mình. | Should | Feature-brief US-001-11 |

---

## 5. Acceptance Criteria (BDD)

Các AC trước đó (AC-001-01..AC-001-11, AC-001-13) được giữ nguyên theo feature-brief — trong đó **AC-001-07 (tìm kiếm search-split 2 ô)** không thay đổi bởi scope expansion này. Dưới đây là các AC được **cập nhật hoặc bổ sung mới** cho TRI-1786681457834-5887:

| ID | Scenario | Given | When | Then | Priority | Linked BR |
|---|---|---|---|---|---|---|
| AC-001-12 | Trạng thái tạo mới lấy từ form (cập nhật từ "mặc định ACTIVE") | Admin tạo tài khoản mới | Chọn status = INACTIVE trên form và nhấn "Tạo mới" | `CreateUserRequest` nhận `status`; `UserService.create()` gọi `user.setStatus(request.getStatus())` thay cho `user.setStatus(UserStatus.ACTIVE)`; user lưu có status INACTIVE; frontend không còn gửi cứng `status: 'ACTIVE'`; không qua bước phê duyệt | Critical | BR-001-19 |
| AC-001-14 | Chi tiết tài khoản hiển thị 4 trường mới (cập nhật) | Admin mở popup/drawer Chi tiết tài khoản | Quan sát nhóm Thông tin tài khoản | Hiển thị thêm Địa chỉ, Phòng ban, Chức vụ, Ghi chú (null → "—") bên cạnh các trường hiện có + Trạng thái | Major | BR-001-20 |
| AC-001-15 | Thứ tự trường form tạo mới | Admin mở drawer "Thêm mới người dùng" | Quan sát thứ tự hiển thị các Form.Item | Thứ tự đúng: 1 username, 2 password, 3 orgUnit, 4 email, 5 fullName, 6 phone, 7 address, 8 department, 9 position, 10 status, 11 note (done_oracle) | Critical | BR-001-22 |
| AC-001-16 | Thiếu status khi tạo | Admin mở form tạo mới | Không chọn Trạng thái và nhấn "Tạo mới" | Form hiển thị lỗi "Vui lòng chọn trạng thái", không gọi API, tài khoản không được tạo | Critical | BR-001-19 |
| AC-001-17 | 4 trường mới lưu qua API | Admin tạo/sửa tài khoản có address, department, position, note | Gửi request chứa 4 trường | Backend lưu 4 giá trị; `UserResponse`/`UserDetailResponse` trả về 4 trường (null nếu chưa có) | Major | BR-001-20 |
| AC-001-18 | Form sửa hiển thị 4 trường mới + trạng thái | Admin mở drawer Sửa tài khoản | Quan sát form | Form hiển thị address, department, position, note (pre-populate) + Select Trạng thái; lưu thành công cập nhật giá trị | Major | BR-001-20 |
| AC-001-19 | Drawer chi tiết hiển thị 4 trường mới | Admin mở drawer Chi tiết tài khoản | Quan sát nội dung | Hiển thị các dòng Địa chỉ, Phòng ban, Chức vụ, Ghi chú; giá trị null → "—" | Major | BR-001-20 |
| AC-001-20 | Migration Flyway 4 cột nullable | Chạy Flyway trên DB mới/cũ | Khởi động áp dụng migration `V20260814120000__add_user_profile_columns.sql` | Bảng `app_users` có 4 cột `address`, `department`, `position`, `note` đều NULL-able; dữ liệu cũ giữ nguyên (cột mới = NULL) | Critical | BR-001-21 |

---

## 6. Business Rules

| ID | Rule | Applies-to | Source |
|---|---|---|---|
| **BR-001-01** | Email phải là duy nhất trong toàn hệ thống; không cho phép trùng khi tạo mới hoặc sửa. Lỗi: "Email đã tồn tại" | Tạo/Sửa user | Feature-brief BR-001-01 |
| **BR-001-02** | Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số (form tạo yêu cầu thêm ký tự đặc biệt như hiện tại). Admin reset: ≥8 ký tự, có chữ và số | Tạo/Sửa user | Feature-brief BR-001-02 |
| **BR-001-03** | Khi tạo/reset mật khẩu, mật khẩu mới phải khác 3 mật khẩu gần nhất | Reset password | Feature-brief BR-001-03 |
| **BR-001-04** | Mọi mật khẩu phải được hash (BCrypt) trước khi lưu; không lưu plaintext | Tạo user | Feature-brief BR-001-04 |
| **BR-001-05** | Tạo tài khoản không qua bước phê duyệt; **trạng thái khởi tạo lấy từ lựa chọn trên form** (BR-001-19), không còn mặc định cứng ACTIVE | Tạo user | Scope expansion TRI-1786681457834-5887 |
| **BR-001-06** | Tài khoản bị khóa không được đăng nhập | Login | Feature-brief BR-001-06 |
| **BR-001-07** | Tự động khóa sau 5 lần đăng nhập sai; mở khóa sau 30 phút hoặc Admin thủ công | Login | Feature-brief BR-001-07 |
| **BR-001-08** | Khi khóa tài khoản, vô hiệu hóa mọi session/token đang hoạt động | Khóa tài khoản | Feature-brief BR-001-08 |
| **BR-001-09** | Mọi thay đổi trạng thái phải ghi UserStatusLog kèm lý do | Lock/Unlock | Feature-brief BR-001-09 |
| **BR-001-10** | Không có chức năng xóa tài khoản; vô hiệu hóa bằng khóa | Toàn module | Feature-brief BR-001-10 |
| **BR-001-11** | Chỉ Admin/system-admin được thay đổi vai trò; Cán bộ chỉ sửa thông tin + khóa/mở khóa | Phân quyền | Feature-brief BR-001-11 |
| **BR-001-12** | User không thể tự thay đổi vai trò của chính mình | Phân quyền | Feature-brief BR-001-12 |
| **BR-001-13** | Chỉ role `system-admin` được tạo/khóa tài khoản `system-admin` | Phân quyền | Feature-brief BR-001-13 |
| **BR-001-14** | Cá nhân chỉ xem/sửa thông tin tài khoản của chính mình | Phân quyền | Feature-brief BR-001-14 |
| **BR-001-15** | Phê duyệt đăng ký là atomic transaction | F-271 | Feature-brief BR-001-15 |
| **BR-001-16** | Admin không thể tự phê duyệt tài khoản đăng ký của chính mình | F-271 | Feature-brief BR-001-16 |
| **BR-001-17** | Từ chối phải kèm lý do (tối thiểu 10 ký tự) | F-271 | Feature-brief BR-001-17 |
| **BR-001-18** | Token reset mật khẩu hết hạn sau 1 giờ | Reset password | Feature-brief BR-001-18 |
| **BR-001-19** | **Trạng thái tạo mới lấy từ form:** `CreateUserRequest` thêm trường `status` (bắt buộc, `@NotNull`); `UserService.create()` thực hiện `user.setStatus(request.getStatus())`; xóa lệnh `user.setStatus(UserStatus.ACTIVE)` (UserService.java:431) và `status: 'ACTIVE'` cứng ở frontend (userService.ts:98). Nếu `status` null → lỗi validation "Vui lòng chọn trạng thái" | Tạo user | Scope expansion TRI-1786681457834-5887 |
| **BR-001-20** | **4 trường hồ sơ mới nullable:** `address`, `department`, `position`, `note` là cột NULL-able trong DB; giá trị rỗng/blank được trim và lưu NULL; `UserResponse`/`UserDetailResponse` trả về 4 trường (NON_NULL JSON — null khi chưa có) | Tạo/Sửa/Chi tiết user | Scope expansion TRI-1786681457834-5887 |
| **BR-001-21** | **Migration bắt buộc:** mọi thay đổi schema phải đi qua Flyway script `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`; không dùng `ddl-auto` | Schema | AGENTS.md (SQL script cho thay đổi DB) + triage one-way-door |
| **BR-001-22** | **Đặt tên:** tên cột DB/tham số API bằng tiếng Anh chuẩn (`address`, `department`, `position`, `note`); nhãn UI bằng tiếng Việt có dấu (Địa chỉ, Phòng ban, Chức vụ, Ghi chú) | Toàn module | AGENTS.md (naming convention) |

---

## 7. Data Model

> **Quy ước đánh dấu:**
> - <span style="color:red;font-weight:bold">🔴 Chữ màu đỏ</span> = **trường mới cần thêm** vào bảng hiện có.
> - ~~Chữ gạch ngang~~ = **trường không cần thiết**, cần loại bỏ.
> - Các trường không đánh dấu là trường hiện có, giữ nguyên.

### 7.1. Bảng `app_users` — Tài khoản người dùng (thực tế trong code: `User.java` `@Table(name = "app_users")`)

Các trường hiện có (trích phần liên quan):

- **id:** UUID PK
- **username:** VARCHAR(100) NOT NULL, unique
- **password:** VARCHAR(255) NOT NULL (BCrypt hash)
- **email:** VARCHAR(150) NOT NULL, unique
- **fullName:** VARCHAR(200) NULL
- **phone:** VARCHAR(20) NULL
- **org_unit_id:** UUID FK → org_units
- **status:** INT NOT NULL (Enum `UserStatus` theo `@Enumerated(EnumType.ORDINAL)`: 0=ACTIVE, 1=INACTIVE, 2=LOCKED, 3=DELETED, 4=PENDING_VERIFICATION, 5=PENDING_APPROVAL)
- **last_login_at:** TIMESTAMP NULL
- **deleted_at:** TIMESTAMP NULL (soft delete)
- Các trường audit + TOTP/lockout (giữ nguyên)

**🔴 Trường mới (qua migration `V20260814120000__add_user_profile_columns.sql`):**

- <span style="color:red;font-weight:bold">**address:** VARCHAR(255) NULL — Địa chỉ</span>
- <span style="color:red;font-weight:bold">**department:** VARCHAR(100) NULL — Phòng ban</span>
- <span style="color:red;font-weight:bold">**position:** VARCHAR(100) NULL — Chức vụ</span>
- <span style="color:red;font-weight:bold">**note:** VARCHAR(500) NULL — Ghi chú</span>

**Migration:** `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql` — 4 cột đều NULL-able, không có default, không xóa/đổi cột hiện có; áp dụng an toàn cho DB đã có dữ liệu (các dòng cũ nhận NULL).

> **Ghi chú:** Tên cột trong DB/entity/DTO dùng tiếng Anh chuẩn; nhãn hiển thị dùng tiếng Việt có dấu (BR-001-22).

### 7.2. DTO thay đổi

| DTO | Thay đổi |
|---|---|
| `CreateUserRequest` | + `status` (`UserStatus`, `@NotNull`) — hiện chưa có trường status; + `address`, `department`, `position`, `note` (tùy chọn, `@Size` max tương ứng) |
| `UpdateUserRequest` | + `address`, `department`, `position`, `note` (đã có sẵn `status`) |
| `UserResponse` | + `address`, `department`, `position`, `note` |
| `UserDetailResponse` | + `address`, `department`, `position`, `note` |

---

## 8. API Endpoints

Controller hiện tại: `UserController.java:44` — `@RequestMapping({"/api/users", "/api/v1/users"})` (cả 2 path đều hợp lệ).

| Method | Endpoint | Mô tả | Phân quyền | Delta scope expansion |
|---|---|---|---|---|
| GET | `/api/users` | Danh sách người dùng (phân trang, lọc, tìm kiếm 2 ô) | JWT | Không đổi |
| GET | `/api/users/{id}` | Chi tiết người dùng | JWT | Response + 4 trường mới |
| POST | `/api/users` | Tạo người dùng mới — **trạng thái theo lựa chọn trên form** | `user.create` | Request + `status` (bắt buộc) + 4 trường; bỏ hardcode ACTIVE |
| PUT | `/api/users/{id}` | Chỉnh sửa thông tin người dùng | `user.edit` | Request nhận 4 trường mới (status đã có) |
| POST | `/api/users/{id}/lock` | Khóa tài khoản | `user.lock` | Không đổi |
| POST | `/api/users/{id}/unlock` | Mở khóa tài khoản | `user.lock` | Không đổi |
| POST | `/api/users/{id}/reset-password` | Reset mật khẩu (admin) | `user.reset_password` | Không đổi |
| GET/PUT | `/api/users/me` | Xem/sửa thông tin cá nhân | JWT | Response + 4 trường mới |

**Ví dụ payload POST /api/users (sau expansion):**

```json
{
  "username": "nguyenvana",
  "password": "Abcd@1234",
  "orgUnitId": "uuid-org",
  "email": "a@example.com",
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "address": "Số 1, đường Hàng Hải",
  "department": "Phòng Quản lý cảng",
  "position": "Chuyên viên",
  "status": "ACTIVE",
  "note": "Tài khoản tạo đợt 1"
}
```

---

## 9. Non-Functional Requirements

| Area | Requirement | Target |
|---|---|---|
| **Performance** | Thêm 4 cột không làm tăng truy vấn danh sách; không thêm index mới cho trường profile (không dùng làm bộ lọc) | Không hồi quy hiệu năng |
| **Reliability** | Migration idempotent-safe trên DB có dữ liệu; không rollback dữ liệu cũ; nullable nên không cần backfill | 100% dữ liệu cũ giữ nguyên |
| **Security** | `note` là trường văn bản tự do — trim đầu/cuối; không nhạy cảm (mật khẩu không đổi); phân quyền RBAC giữ nguyên trên API | OWASP Top 10 |
| **Usability** | Form theo thứ tự cố định, label tiếng Việt, `spaceFormField` (12px), Input/Select pill `radiusPill` + `height: 40`; 4 trường null hiển thị "—" trong chi tiết | WCAG 2.1 AA |
| **Compliance** | Tên trường DB/API tiếng Anh; UI tiếng Việt có dấu; schema thay đổi qua Flyway | AGENTS.md |

---

## 10. UI/UX Requirements

> **Nguyên tắc cốt lõi:** dùng token từ `frontend/src/theme.ts` và `frontend/src/tokens.ts`; không hardcode màu/spacing/font-size. Form.Item `marginBottom: spaceFormField` (12px); Input/Select `borderRadius: radiusPill`, `height: 40`.

### 10.1. Drawer Thêm mới người dùng — thứ tự trường bắt buộc (done_oracle)

| STT | Tên trường (UI tiếng Việt) | Field Name (API/DB) | Loại ĐK | Bắt buộc | Default | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | Tên đăng nhập | username | Input text | ✅ | — | 3-100 ký tự, chỉ chữ thường + số + gạch dưới |
| 2 | Mật khẩu | password | Input.Password | ✅ | — | ≥8 ký tự, chữ hoa + thường + số + ký tự đặc biệt |
| 3 | Đơn vị trực thuộc | orgUnitId | TreeSelect dạng cây (OrgUnitTreeSelect) | ✅ | — | Giữ value là orgUnitId; dựng cây từ id/name/code/parentId |
| 4 | Email | email | Input email | ✅ | — | Unique (BR-001-01) |
| 5 | Họ và tên | fullName | Input text | ✅ | — | Tối đa 200 ký tự |
| 6 | Số điện thoại | phone | Input text | ❌ | — | 10-11 chữ số nếu nhập |
| 7 | Địa chỉ | address | Input text | ❌ | — | Tối đa 255 ký tự; DB nullable |
| 8 | Phòng ban | department | Input text | ✅ | — | Tối đa 100 ký tự; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 9 | Chức vụ | position | Input text | ✅ | — | Tối đa 100 ký tự; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 10 | Trạng thái | status | Select | ✅ | ACTIVE ("Hoạt động") | Options: Hoạt động (active), Không hoạt động (inactive); giá trị chọn được gửi lên và lưu |
| 11 | Ghi chú | note | TextArea | ❌ | — | Tối đa 500 ký tự; DB nullable |

**Footer:** [Hủy] outlined + [Tạo mới] primary, pill radius; disabled khi form có lỗi; loading khi submit.

### 10.2. Drawer Sửa người dùng

- Username: readonly (không hiển thị ô nhập như hiện tại)
- Hiển thị: fullName, email, phone, orgUnitId, address, department, position, note, status — pre-populate từ dữ liệu hiện tại (openEditModal hiện chỉ set fullName/email/phone/orgUnitId/status — **phải bổ sung 4 trường mới**)
- Các ràng buộc bắt buộc như form tạo (trừ username/password)

### 10.3. Drawer Chi tiết tài khoản

Nhóm "Thông tin tài khoản" (read-only) — bổ sung 4 dòng:

| STT | Tên trường | Giá trị |
|---|---|---|
| 1 | Tên đăng nhập | username |
| 2 | Họ và tên | fullName |
| 3 | Email | email |
| 4 | Số điện thoại | phone (null → "—") |
| 5 | **Địa chỉ** | **address (null → "—")** |
| 6 | **Phòng ban** | **department (null → "—")** |
| 7 | **Chức vụ** | **position (null → "—")** |
| 8 | **Ghi chú** | **note (null → "—")** |
| 9 | Trạng thái | Badge (active=Hoạt động, inactive=Không hoạt động) |
| 10 | Đơn vị trực thuộc | orgUnitName |
| 11 | Ngày tạo | createdAt |
| 12 | Đăng nhập cuối | lastLoginAt (null → "Chưa đăng nhập") |

Nhóm Phân quyền + Audit (Admin Cục) giữ nguyên.

### 10.4. Giữ nguyên (không sửa trong scope expansion)

- **FilterBar search-split:** 2 ô tìm kiếm `search` (email/tên đăng nhập) + `fullName` (không dấu) + Select trạng thái + Select đơn vị (TreeSelect) + nút Tìm kiếm/Reload — AC-001-07
- **StatusTabs, DataTable, Pagination** từ `frontend/src/components/list-view/`
- **Modal khóa/mở khóa, reset mật khẩu, phê duyệt/từ chối** — không đổi

---

## 11. Ambiguities & Open Questions

| ID | Description | Impact | Decision / Question |
|---|---|---|---|
| [AMBIGUITY-001] | Giá trị `status` cho phép chọn trên form tạo | Thấp | **Quyết định:** chỉ cung cấp `ACTIVE` (Hoạt động) / `INACTIVE` (Không hoạt động) — khớp options Select hiện tại của form sửa; LOCKED/DELETED/PENDING_* không hợp lý ở thời điểm tạo. Nếu PO muốn thêm lựa chọn khác → mở rộng sau |
| [AMBIGUITY-002] | `department`/`position` bắt buộc trên form tạo trong khi DB nullable | Thấp | **Quyết định (theo done_oracle):** form tạo bắt buộc nhập; DB vẫn nullable để không phá dữ liệu cũ; validate phía backend: form-required áp dụng ở tầng UI + DTO `@NotNull`? → **không bắt buộc @NotNull ở DTO** để tránh phá API khác (F-271), chỉ validate ở frontend. Nếu cần chặt hơn, Dev/QA báo PMO |
| [AMBIGUITY-003] | Độ dài cột mới | Thấp | **Đề xuất BA:** address VARCHAR(255), department VARCHAR(100), position VARCHAR(100), note VARCHAR(500) — theo thang độ dài hiện có của entity (email 150, fullName 200, phone 20). SA/Dev xác nhận trước khi viết migration |
| [AMBIGUITY-004] | `note` trùng tên với field `note` của modal phê duyệt F-271 | Rất thấp | Không xung đột: `note` ở đây là cột profile của `app_users`; field phê duyệt là ghi chú nội bộ trong luồng PendingApproval riêng |

---

## 12. Evidence Anchors (thời điểm phân tích 2026-08-14)

| Claim | Anchor |
|---|---|
| Backend hardcode ACTIVE khi tạo | `src/main/java/com/hanghai/kchtg/user/service/UserService.java:431` — `user.setStatus(UserStatus.ACTIVE);` trong `create()` (bắt đầu line 412) |
| Frontend hardcode ACTIVE khi tạo | `frontend/src/services/userService.ts:98` — `status: 'ACTIVE'` trong body POST |
| CreateUserRequest chưa có status | `src/main/java/com/hanghai/kchtg/user/dto/CreateUserRequest.java` (53 dòng, không có trường status) |
| UpdateUserRequest đã có status | `src/main/java/com/hanghai/kchtg/user/dto/UpdateUserRequest.java:41` — `private UserStatus status;` |
| Entity chưa có 4 trường profile | `src/main/java/com/hanghai/kchtg/user/entity/User.java` — `@Table(name = "app_users")`; các trường hiện có username/password/email/fullName/phone/orgUnit/status (default ACTIVE) |
| Form tạo hiện không có status; form sửa có | `frontend/src/pages/UsersPage.tsx:431-461` — status Select chỉ render khi `editingUser` (line 447) |
| Form tạo payload không gửi status | `frontend/src/pages/UsersPage.tsx:129-135` — CreateUserPayload không chứa status |
| Drawer chi tiết hiện thiếu 4 trường | `frontend/src/pages/UsersPage.tsx:601-631` — mảng 12 dòng thông tin không có address/department/position/note |
| Controller path | `src/main/java/com/hanghai/kchtg/user/controller/UserController.java:44` — `@RequestMapping({"/api/users", "/api/v1/users"})` |
| Migration target chưa tồn tại | `src/main/resources/db/migration/` — không có file `V20260814120000__add_user_profile_columns.sql`; convention timestamp `V2026...` đang được dùng |
| UserStatus enum | `src/main/java/com/hanghai/kchtg/user/entity/UserStatus.java` — ACTIVE, INACTIVE, LOCKED, DELETED, PENDING_VERIFICATION, PENDING_APPROVAL |
