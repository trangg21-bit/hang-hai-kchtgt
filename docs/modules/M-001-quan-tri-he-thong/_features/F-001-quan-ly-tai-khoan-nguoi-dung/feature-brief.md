---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: proposed
classification: local
priority: high
created: 2026-06-26T00:00:00Z
last-updated: 2026-08-17
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

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-001
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng có bước phê duyệt (chỉ riêng luồng tự đăng ký F-271)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT, URD III.3.2) + lean-spec scope expansion TRI-1786681457834-5887

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

Quản lý toàn bộ vòng đời tài khoản người dùng: tạo mới, chỉnh sửa thông tin (gồm 4 trường hồ sơ `address`, `department`, `position`, `note`), xem chi tiết, khóa/mở khóa, đặt lại mật khẩu, gán quyền trực tiếp cho từng tài khoản và phê duyệt tài khoản tự đăng ký từ người dùng bên ngoài (F-271). Có 2 luồng tạo tài khoản: (1) quản trị viên tạo trực tiếp — trạng thái lấy từ lựa chọn trên form (Hoạt động / Không hoạt động), **không** qua phê duyệt; (2) người dùng tự đăng ký qua form công khai — tạo bản ghi chờ phê duyệt (PendingApproval), quản trị viên phê duyệt (atomic: tạo User + gán quyền ban đầu + kích hoạt + gửi thông báo) hoặc từ chối kèm lý do. **Hệ thống không có chức năng xóa tài khoản** — vô hiệu hóa bằng khóa. Phân quyền theo mô hình động (quyền gán riêng + quyền nhóm), không còn vai trò cố định.

## 2. Trường dữ liệu

### 2.1. Form Thêm mới / Sửa tài khoản (thứ tự cố định — AC-001-15)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên đăng nhập | Có | Text, 3-100 ký tự, chỉ chữ thường + số + gạch dưới | username; readonly khi sửa |
| 2 | Mật khẩu | Có (tạo) / Không (sửa) | Input.Password, ≥8 ký tự, chữ hoa + chữ thường + số + ký tự đặc biệt | BR-001-02; strength meter; chỉ nhập khi tạo |
| 3 | Đơn vị trực thuộc | Có | TreeSelect dạng cây (orgUnitId) | Dựng cây từ id/name/code/parentId; giữ value là orgUnitId |
| 4 | Email | Có | Email hợp lệ, unique toàn hệ thống | BR-001-01 |
| 5 | Họ và tên | Có | Text, 2-200 ký tự | fullName |
| 6 | Số điện thoại | Không | 10-11 chữ số nếu nhập | phone |
| 7 | Địa chỉ | Không | Text, max 255 | 🔴 address (DB nullable) |
| 8 | Phòng ban | Có (form tạo) | Text, max 100 | 🔴 department; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 9 | Chức vụ | Có (form tạo) | Text, max 100 | 🔴 position; DB nullable nhưng bắt buộc nhập trên form tạo (done_oracle) |
| 10 | Trạng thái | Có | Select: Hoạt động (ACTIVE) / Không hoạt động (INACTIVE); default Hoạt động | status; giá trị chọn gửi lên và lưu (BR-001-19) — không hardcode ACTIVE |
| 11 | Ghi chú | Không | TextArea, max 500 | 🔴 note; DB nullable |

### 2.2. Form đăng ký công khai (F-271)

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Tên đăng nhập | Có | Text, 3-50 ký tự, chỉ chữ thường + số + gạch dưới | username; không trùng user/PendingApproval hiện có |
| 2 | Họ và tên | Có | Text, 2-100 ký tự | fullName |
| 3 | Email | Có | Email hợp lệ | Không tiết lộ email đã có tài khoản (chống enumeration) |
| 4 | Số điện thoại | Không | 10-11 chữ số nếu nhập | phone |
| 5 | Mật khẩu | Có | ≥8 ký tự, chữ hoa + chữ thường + số | BR-001-02; strength meter |
| 6 | Xác nhận mật khẩu | Có | Khớp với mật khẩu | confirmPassword |
| 7 | Vai trò yêu cầu | Có | Select dropdown | requestedRole; danh sách quyền/đăng ký được phép công khai (không gồm quyền đặc biệt ROLE_SYSTEM_ADMIN) — ánh xạ sang mô hình quyền động do SA chốt |
| 8 | Đơn vị | Có | Select searchable (orgUnitId) | Danh sách đơn vị |

### 2.3. Modal khóa/mở khóa, từ chối đăng ký

| # | Trường | Bắt buộc | Kiểu / ràng buộc | Ghi chú |
|---|---|---|---|---|
| 1 | Lý do (khóa/mở khóa) | Có | TextArea, tối thiểu 10 ký tự | Ghi vào UserStatusLog (BR-001-09) |
| 2 | Ghi chú (phê duyệt) | Không | TextArea | Ghi chú nội bộ luồng PendingApproval |
| 3 | Lý do từ chối | Có | TextArea, tối thiểu 10 ký tự | BR-001-17 |

## 3. Trạng thái và phê duyệt

Theo tài liệu nền (mục 3.7) — trạng thái lưu dạng **số** (INT), map Enum `UserStatus` theo `@Enumerated(EnumType.ORDINAL)`: 0=ACTIVE, 1=INACTIVE, 2=LOCKED, 3=DELETED, 4=PENDING_VERIFICATION, 5=PENDING_APPROVAL.

- **Luồng tạo trực tiếp (quản trị viên):** không qua phê duyệt. Trạng thái khởi tạo = giá trị chọn trên form (ACTIVE hoặc INACTIVE — chỉ 2 lựa chọn này khi tạo; BR-001-19/AC-001-12). Không cần Lãnh đạo duyệt (AC-001-09).
- **Luồng tự đăng ký (F-271):** bản ghi PendingApproval trạng thái `pending` → quản trị viên **phê duyệt** (atomic transaction BR-001-15: tạo User trạng thái ACTIVE + gán quyền ban đầu theo yêu cầu đăng ký + cập nhật PendingApproval `approved` + gửi email thông báo) hoặc **từ chối** (bắt buộc lý do ≥10 ký tự BR-001-17; PendingApproval `rejected` + email kèm lý do). **Không thể tự phê duyệt tài khoản đăng ký của chính mình** (BR-001-16 — kiểm tra email trùng).
- **Khóa/Mở khóa:** active → `blocked` (LOCKED) khi quản trị viên khóa (lý do ≥10 ký tự) hoặc tự động sau 5 lần đăng nhập sai (BR-001-07); blocked → active khi quản trị viên mở khóa thủ công hoặc hết 30 phút tự động. Mọi thay đổi trạng thái ghi UserStatusLog kèm lý do (BR-001-09).
- **Không có trạng thái xóa:** hệ thống không có chức năng xóa tài khoản (BR-001-10/AC-001-13).

## 4. Quy tắc và phân quyền riêng

### 4.1. Quy tắc nghiệp vụ (BR-001-01..BR-001-22 — kế thừa nguyên vẹn từ brief cũ + lean-spec scope expansion)

**Về tài khoản:**
- BR-001-01 — Email duy nhất toàn hệ thống; trùng khi tạo/sửa → từ chối "Email đã tồn tại".
- BR-001-02 — Mật khẩu tối thiểu 8 ký tự, có chữ hoa, chữ thường, số (form tạo thêm ký tự đặc biệt). Admin reset: ≥8 ký tự, có chữ và số (không bắt buộc ký tự đặc biệt).
- BR-001-03 — Mật khẩu mới (tạo/reset) phải khác 3 mật khẩu gần nhất của user; trùng → "Mật khẩu mới trùng với mật khẩu cũ".
- BR-001-04 — Mọi mật khẩu hash bằng bcrypt/argon2; tuyệt đối không lưu plaintext.

**Về trạng thái:**
- BR-001-05 — Tạo tài khoản không qua phê duyệt; trạng thái khởi tạo lấy từ form (BR-001-19), không còn mặc định cứng ACTIVE.
- BR-001-06 — Tài khoản bị khóa (blocked) không đăng nhập được; thông báo "Tài khoản đã bị khóa".
- BR-001-07 — Tự động khóa sau 5 lần đăng nhập sai liên tiếp; tự mở khóa sau 30 phút hoặc quản trị viên mở thủ công.
- BR-001-08 — Khi khóa tài khoản, mọi session/token đang hoạt động bị vô hiệu hóa ngay lập tức.
- BR-001-09 — Mọi thay đổi trạng thái (active ↔ blocked) ghi vào `UserStatusLog` kèm lý do và người thực hiện.
- BR-001-10 — Không có chức năng xóa tài khoản dưới mọi hình thức; vô hiệu hóa bằng khóa.

**Về phân quyền (đã chuyển sang mô hình phân quyền động — tài liệu nền mục 3.2; không còn vai trò cố định):**
- BR-001-11 — Chỉ tài khoản **được cấp quyền gán quyền** (gán qua màn Quản lý tài khoản / Phân quyền nhóm F-002) mới được thay đổi quyền của người dùng khác; tài khoản cán bộ chỉ sửa thông tin và khóa/mở khóa. (Brief cũ: "Chỉ vai trò Admin/system-admin mới có quyền thay đổi vai trò").
- BR-001-12 — User không thể tự thay đổi quyền của chính mình (brief cũ: "không thể tự thay đổi vai trò của chính mình").
- BR-001-13 — Chỉ tài khoản có quyền đặc biệt ROLE_SYSTEM_ADMIN mới được tạo hoặc khóa tài khoản cũng sở hữu quyền đặc biệt ROLE_SYSTEM_ADMIN (brief cũ: "Chỉ role system-admin mới được tạo hoặc khóa tài khoản system-admin").
- BR-001-14 — Tài khoản cá nhân chỉ xem/sửa thông tin tài khoản của chính mình; cố sửa tài khoản khác → 403 Forbidden.

**Về phê duyệt đăng ký:**
- BR-001-15 — Phê duyệt đăng ký là atomic transaction (tạo User + gán quyền ban đầu + kích hoạt + gửi thông báo); bất kỳ bước nào thất bại → rollback toàn bộ.
- BR-001-16 — Chống tự phê duyệt: quản trị viên không thể phê duyệt tài khoản đăng ký của chính mình (kiểm tra email trùng).
- BR-001-17 — Từ chối bắt buộc kèm lý do (tối thiểu 10 ký tự).

**Về reset mật khẩu:**
- BR-001-18 — Token reset mật khẩu hết hạn sau 1 giờ; hết hạn → "Link đặt lại mật khẩu đã hết hạn", phải gửi link mới.

**Về hồ sơ người dùng (scope expansion TRI-1786681457834-5887):**
- BR-001-19 — Trạng thái tạo mới lấy từ form: `CreateUserRequest` có `status` (bắt buộc, `@NotNull`); `UserService.create()` thực hiện `user.setStatus(request.getStatus())` thay cho `user.setStatus(UserStatus.ACTIVE)` (UserService.java:431) và bỏ `status: 'ACTIVE'` cứng ở frontend (userService.ts:98). `status` null → lỗi "Vui lòng chọn trạng thái".
- BR-001-20 — 4 trường hồ sơ `address`, `department`, `position`, `note` là cột NULL-able trong `app_users`; giá trị rỗng được trim và lưu NULL; `UserResponse`/`UserDetailResponse` trả về 4 trường (null khi chưa có).
- BR-001-21 — Mọi thay đổi schema qua Flyway `src/main/resources/db/migration/V20260814120000__add_user_profile_columns.sql`; không dùng `ddl-auto`; chỉ thêm cột nullable, không xóa/sửa cột hiện có, không phá dữ liệu cũ.
- BR-001-22 — Tên cột DB/tham số API tiếng Anh chuẩn (`address`, `department`, `position`, `note`); nhãn UI tiếng Việt có dấu (Địa chỉ, Phòng ban, Chức vụ, Ghi chú).

### 4.2. Acceptance criteria kế thừa (AC-001-01..AC-001-20)

- AC-001-01 — Tạo tài khoản thành công: trạng thái đúng lựa chọn trên form (không hardcode ACTIVE), hash mật khẩu, toast "Tạo tài khoản thành công"; email trùng → "Email đã tồn tại"; mật khẩu yếu → lỗi validation; thiếu trạng thái → "Vui lòng chọn trạng thái".
- AC-001-02 — Sửa tài khoản thành công; email mới trùng người khác → "Email đã tồn tại".
- AC-001-03 — Khóa tài khoản active: lý do ≥10 ký tự; chuyển `blocked`, vô hiệu hóa mọi session, ghi UserStatusLog, toast "Khóa tài khoản thành công"; đã khóa → "Tài khoản đã bị khóa".
- AC-001-04 — Mở khóa tài khoản blocked: lý do ≥10 ký tự; chuyển `active`, ghi UserStatusLog, toast "Mở khóa tài khoản thành công".
- AC-001-05 — Tự động khóa sau 5 lần đăng nhập sai; thông báo "Tài khoản bị khóa do nhiều lần đăng nhập sai"; tự mở khóa sau 30 phút hoặc thủ công.
- AC-001-06 — Reset mật khẩu: policy (≥8 ký tự, chữ hoa + thường + số, khác 3 mật khẩu gần nhất), hash mới, invalidate token cũ, toast "Đặt lại mật khẩu thành công".
- AC-001-07 — Tìm kiếm và lọc danh sách (2 ô: `search` email/tên đăng nhập + `fullName` không dấu — "van a" khớp "Nguyễn Văn An"); AND với bộ lọc trạng thái/đơn vị; đếm tab đúng; phân trang 20/trang tối đa 100; rỗng → empty state; ô chỉ khoảng trắng = không có bộ lọc.
- AC-001-08 — Phân quyền chính xác: tài khoản không có quyền sửa người khác → 403 Forbidden; không tự thay đổi quyền của chính mình; chỉ tài khoản có quyền gán quyền mới phân quyền được (brief cũ: "Chỉ Admin được phân quyền cho vai trò khác").
- AC-001-09 — Lãnh đạo xem danh sách read-only; cố sửa/khóa/mở khóa → 403; tạo tài khoản trực tiếp không cần Lãnh đạo duyệt; Lãnh đạo chỉ phê duyệt tài khoản tự đăng ký (F-271).
- AC-001-10 — Phê duyệt đăng ký: tạo User + kích hoạt + gửi thông báo atomic; không tự phê duyệt; từ chối kèm lý do ≥10 ký tự.
- AC-001-11 — Token reset hết hạn sau 1 giờ → "Link đặt lại mật khẩu đã hết hạn".
- AC-001-12 — Trạng thái tạo mới lấy từ form (`CreateUserRequest.status`; `user.setStatus(request.getStatus())`; bỏ hardcode 2 đầu); không qua phê duyệt; thiếu status → "Vui lòng chọn trạng thái"; lỗi hệ thống → rollback + toast "Tạo tài khoản thất bại".
- AC-001-13 — Không có chức năng xóa tài khoản; vô hiệu hóa bằng khóa.
- AC-001-14 — Xem chi tiết: thông tin tài khoản (username, fullName, email, phone, address, department, position, note — null → "—", status, đơn vị, ngày tạo, lastLogin) + phân quyền hiện tại (quyền gán riêng + quyền từ nhóm); không có quyền nào → "Chưa được phân quyền"; trường audit chỉ hiển thị với Admin Cục.
- AC-001-15 — Thứ tự trường form tạo cố định: 1) username 2) password 3) orgUnit 4) email 5) fullName 6) phone 7) address 8) department 9) position 10) status 11) note.
- AC-001-16 — Form sửa hiển thị 4 trường mới (pre-populate) + Select Trạng thái; lưu → toast "Cập nhật tài khoản thành công".
- AC-001-17 — Drawer chi tiết hiển thị 4 trường mới (null → "—").
- AC-001-18 — Migration Flyway `V20260814120000__add_user_profile_columns.sql` áp dụng an toàn trên DB mới/cũ (4 cột NULL-able, dữ liệu cũ giữ nguyên).
- AC-001-19 — (lean-spec) Drawer chi tiết: các dòng Địa chỉ/Phòng ban/Chức vụ/Ghi chú; null → "—".
- AC-001-20 — (lean-spec) Migration 4 cột nullable qua Flyway; không lỗi khởi động.

### 4.3. User stories kế thừa (US-001-01..US-001-13, MoSCoW)

- US-001-01 (Must) — Tạo tài khoản đầy đủ thông tin (tên đăng nhập, mật khẩu, đơn vị, email, họ tên, SĐT, địa chỉ, phòng ban, chức vụ, trạng thái, ghi chú); trạng thái theo lựa chọn trên form (mặc định Hoạt động), không cần phê duyệt.
- US-001-02 (Must) — Sửa thông tin tài khoản. US-001-03 (Must) — Khóa tài khoản (không có xóa). US-001-04 (Must) — Mở khóa. US-001-05 (Must) — Reset mật khẩu. US-001-06 (Must) — Phân quyền theo mô hình động (brief cũ: "phân quyền theo vai trò (RBAC)").
- US-001-07 (Must) — Cán bộ xem danh sách, sửa thông tin, khóa/mở khóa tài khoản trong đơn vị mình. US-001-08 (Must) — Tìm kiếm/lọc danh sách (tên, email, trạng thái) phân trang chính xác.
- US-001-09 (Should) — Lãnh đạo xem danh sách người dùng trong đơn vị. US-001-10 (Should) — Lãnh đạo phê duyệt tài khoản tự đăng ký (F-271). US-001-11 (Should) — Cá nhân xem/sửa thông tin cá nhân của chính mình.
- US-001-12 (Should) — Xem chi tiết tài khoản (thông tin + phân quyền hiện tại) read-only. US-001-13 (Must) — Nhập/cập nhật 4 trường hồ sơ (Địa chỉ, Phòng ban, Chức vụ, Ghi chú).
- US-001-12 (Could, brief cũ) — Xuất danh sách người dùng ra Excel để báo cáo.

### 4.4. Luồng nghiệp vụ chi tiết kế thừa (tóm tắt từ brief cũ mục 8)

- **Tạo (quản trị viên):** mở modal → nhập 11 trường theo thứ tự → validate (email unique BR-001-01, mật khẩu BR-001-02, trường bắt buộc, status không null BR-001-19; đơn vị không tồn tại → 400 "Không tìm thấy đơn vị với id: ...") → tạo User với status từ form, hash mật khẩu, ghi AccessLog → không có bước phê duyệt → toast "Tạo tài khoản thành công". Hệ thống **không tự sinh mật khẩu mặc định** — quản trị viên nhập mật khẩu ban đầu và thông báo cho người dùng qua kênh an toàn.
- **Xem chi tiết:** popup read-only 3 nhóm: Thông tin tài khoản (11 trường), Phân quyền hiện tại (quyền gán riêng + quyền từ nhóm), Audit (chỉ Admin Cục).
- **Sửa:** username readonly; sửa fullName, email, phone, orgUnitId, address, department, position, note, status; validate email unique; toast "Cập nhật tài khoản thành công".
- **Khóa/Mở khóa:** modal lý do ≥10 ký tự; khóa → blocked + vô hiệu hóa session (BR-001-08) + UserStatusLog; mở khóa → active + UserStatusLog.
- **Reset mật khẩu:** validate policy + khác 3 mật khẩu gần nhất (BR-001-03) → hash + invalidate token → toast "Đặt lại mật khẩu thành công".
- **Đăng ký (F-271):** form công khai `/register`; kiểm tra email/username chưa tồn tại (không tiết lộ email đã có tài khoản — chống enumeration); validate mật khẩu + confirmPassword; tạo PendingApproval `pending` + gửi thông báo cho quản trị viên; màn hình "Đăng ký thành công. Vui lòng chờ Admin phê duyệt." + email xác nhận đã nhận đơn. **Rate limiting:** tối đa 5 lần đăng ký/giờ/IP.
- **Phê duyệt/Từ chối:** tab "Chờ phê duyệt"; phê duyệt → chống tự phê duyệt (BR-001-16) → atomic (BR-001-15) → email "Tài khoản đã được phê duyệt"; từ chối → lý do ≥10 ký tự (BR-001-17) → email kèm lý do.
- **Tự động khóa:** bộ đếm failedAttempts; <5 → "Sai mật khẩu. Còn {5 - n} lần thử."; =5 → blocked + UserStatusLog "5 lần đăng nhập sai"; 30 phút sau → active + UserStatusLog "Tự động mở khóa sau 30 phút".

### 4.5. Phân quyền riêng

Quyền theo mẫu `<resource>:<action>`, gán động qua nhóm/tài khoản (tài liệu nền mục 3.2); quyền mới phải đăng ký trong `PermissionSeeder.java` (AGENTS.md "Permission Registration for New Modules").

| Thao tác | Quyền cần có | Ghi chú |
|---|---|---|
| Xem danh sách / chi tiết tài khoản | `user:read` | Mọi tài khoản đã đăng nhập có quyền xem theo phạm vi đơn vị |
| Tạo tài khoản | `user:manage` | Tạo trực tiếp, không qua phê duyệt |
| Sửa thông tin tài khoản | `user:manage` | — |
| Khóa / Mở khóa | `user:manage` | — |
| Reset mật khẩu (admin) | `user:manage` | — |
| Gán quyền trực tiếp cho tài khoản | quyền gán quyền (qua màn Quản lý tài khoản, API `/users/{id}/permissions`) | Không tự gán cho chính mình (BR-001-12) |
| Phê duyệt / Từ chối đăng ký | `user:approve` | Chỉ hiện tab "Chờ phê duyệt" khi có quyền |
| Xem/sửa thông tin cá nhân | Tự quản (bản thân) | `/api/users/me`; phạm vi cá nhân |
| Tự đăng ký (F-271) | Công khai (rate-limited) | Không cần đăng nhập |

> Quyền chi tiết (tạo/sửa/khóa/reset) tạm dùng `user:manage` — SA có thể seed thêm sau.

Bảng vai trò × thao tác (mô hình cũ — **đã thay thế** bằng bảng trên; chỉ giữ để đối chiếu lịch sử): Admin full access; Lãnh đạo view-only + phê duyệt F-271; Cán bộ view + sửa + khóa/mở khóa (phạm vi đơn vị); Cá nhân self-only. Trong mô hình động, các phạm vi này thể hiện qua tổ hợp quyền + đơn vị trực thuộc (tài liệu nền 3.2); ROLE_SYSTEM_ADMIN / ROLE_SUPER_ADMIN vượt qua mọi kiểm tra quyền.

**Admin Cục:** mặc định theo tài liệu nền mục 3.8 — full quyền + xem thêm metadata (người tạo, người sửa cuối, thời gian tạo/cập nhật) ở nhóm Audit của màn chi tiết; các tài khoản khác không thấy các trường này.

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — 6 giá trị INT (UserStatus): ACTIVE, INACTIVE, LOCKED, DELETED, PENDING_VERIFICATION, PENDING_APPROVAL; màn hình dùng ACTIVE/INACTIVE (tạo) + blocked (khóa) + tab "Chờ phê duyệt" |
| 2 | Có bước phê duyệt không | Có — chỉ riêng luồng tự đăng ký F-271: pending → approved/rejected; atomic; chống tự phê duyệt; từ chối kèm lý do ≥10 ký tự |
| 3 | Lọc cha-con / theo đơn vị | Có — bộ lọc đơn vị dạng TreeSelect (orgUnitId); phạm vi dữ liệu theo đơn vị trực thuộc của tài khoản đăng nhập (trừ quyền xem toàn hệ thống) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — status chỉ là 2 lựa chọn ACTIVE/INACTIVE khi tạo; nhóm Audit (người tạo/sửa, thời gian) chỉ hiện với Admin Cục; nút Phê duyệt/Từ chối chỉ hiện khi bản ghi `pending` và có quyền `user:approve` |
| 5 | Quyền riêng | `user:manage`, `user:read`, `user:approve` (quyền chi tiết tạo/sửa/khóa/reset tạm dùng `user:manage` — SA có thể seed thêm sau); gán quyền trực tiếp qua `/users/{id}/permissions` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Có — POST `/api/v1/users/pending` (đăng ký), POST `/api/v1/auth/forgot-password`, POST `/api/v1/auth/reset-password/{token}` (công khai, rate-limited) |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — form tạo theo thứ tự 11 trường cố định (AC-001-15); 2 ô tìm kiếm tách biệt trên FilterBar (search + fullName không dấu); modal khóa/mở khóa/reset có trường lý do ≥10 ký tự; không có nút Xóa |

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/api/users`, `/api/v1/users` | Danh sách người dùng (phân trang, lọc trạng thái/đơn vị, tìm kiếm 2 ô search + fullName) | `user:read` |
| GET | `/api/users/{id}` | Chi tiết người dùng (gồm 4 trường hồ sơ mới) | `user:read` |
| POST | `/api/users` | Tạo người dùng mới — status theo form (BR-001-19) + 4 trường hồ sơ | `user:manage` |
| PUT | `/api/users/{id}` | Sửa thông tin (gồm 4 trường hồ sơ + status) | `user:manage` |
| POST | `/api/users/{id}/lock`, `/api/users/{id}/unlock` | Khóa / Mở khóa tài khoản | `user:manage` |
| POST | `/api/users/{id}/reset-password` | Reset mật khẩu (admin) | `user:manage` |
| GET/PUT | `/api/users/me` | Xem/sửa thông tin cá nhân | JWT (tự quản) |
| GET | `/api/users/{id}/permissions` | Xem quyền hiện tại của tài khoản (gán riêng + từ nhóm) | quyền gán quyền / `user:read` |
| PUT | `/api/users/{id}/permissions` | Gán quyền trực tiếp cho tài khoản | quyền gán quyền |
| GET | `/api/approvals/pending` | Danh sách đăng ký chờ phê duyệt | `user:approve` |
| POST | `/api/approvals/{id}/approve` | Phê duyệt đăng ký (atomic) | `user:approve` |
| POST | `/api/approvals/{id}/reject` | Từ chối đăng ký (lý do ≥10 ký tự) | `user:approve` |
| POST | `/api/users/pending` | Nộp đơn đăng ký tài khoản (F-271) | Công khai (rate-limited 5 lần/giờ/IP) |
| POST | `/api/auth/forgot-password` | Yêu cầu link đặt lại mật khẩu | Công khai (rate-limited 3 lần/15 phút) |
| POST | `/api/auth/reset-password/{token}` | Đặt lại mật khẩu bằng token (hết hạn 1 giờ) | Công khai (rate-limited) |

Ghi chú: controller hiện hỗ trợ cả `/api/users` và `/api/v1/users` (UserController.java:44). Endpoint `/api/v1/roles` (danh sách/tạo/sửa vai trò) **không còn** — bảng Role đã bị loại bỏ trong mô hình phân quyền động.

## 7. Phần kỹ thuật — cấu trúc bảng (ĐỀ XUẤT, chờ người thiết kế kỹ thuật xác nhận)

Quy ước: 🔴 = trường mới cần thêm; ~~gạch ngang~~ = trường cần loại bỏ.

**Bảng `app_users` (User.java — `@Table(name = "app_users")`):** id (UUID PK), username (VARCHAR(100) NOT NULL, unique), password (VARCHAR(255) NOT NULL — BCrypt), email (VARCHAR(150) NOT NULL, unique), fullName (VARCHAR(200) NULL), phone (VARCHAR(20) NULL), org_unit_id (UUID FK → org_units), status (INT NOT NULL — UserStatus ordinal 0..5), last_login_at (TIMESTAMP NULL), deleted_at (TIMESTAMP NULL — soft delete), các trường audit + lockout (giữ nguyên), ~~role_id (FK → Role — bảng Role đã bị loại bỏ)~~.
- 🔴 **address** VARCHAR(255) NULL — Địa chỉ
- 🔴 **department** VARCHAR(100) NULL — Phòng ban (bắt buộc nhập trên form tạo)
- 🔴 **position** VARCHAR(100) NULL — Chức vụ (bắt buộc nhập trên form tạo)
- 🔴 **note** VARCHAR(500) NULL — Ghi chú
- Migration: `V20260814120000__add_user_profile_columns.sql` — 4 cột NULL-able, không default, an toàn với dữ liệu cũ (BR-001-21).

**Bảng `UserStatusLog`:** id, userId (FK → UserAccount), previousStatus, newStatus, changedBy, changedAt, reason (lý do thay đổi — BR-001-09).

**Bảng `PendingApproval` (F-271):** id, username, email, passwordHash, requestedRoleCode (yêu cầu quyền ban đầu — ánh xạ sang mô hình quyền động do SA chốt), status (`pending`/`approved`/`rejected`), approvedBy, rejectionReason, createdAt, updatedAt.

**Bảng `PasswordResetToken`:** id, userId FK, token, expiresAt (1 giờ — BR-001-18), usedAt, createdAt.

**Bảng liên quan (không thuộc F-001):** ~~Role, UserRole~~ (đã loại bỏ — mô hình quyền động); UserGroup + GroupMember + quyền của nhóm (F-002); AccessLog (F-005); org_units (F-003). Quyền gán trực tiếp cho tài khoản lưu qua cơ chế gán quyền động (API `/users/{id}/permissions`) — cấu trúc chi tiết do SA chốt.
