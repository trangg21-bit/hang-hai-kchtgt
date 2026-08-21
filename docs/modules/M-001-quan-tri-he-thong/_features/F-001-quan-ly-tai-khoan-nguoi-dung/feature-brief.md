---
id: F-001
name: Quản lý tài khoản người dùng
slug: quan-ly-tai-khoan-nguoi-dung
module-id: M-001
status: done
classification: local
priority: high
created: 2024-06-01
last-updated: 2026-08-20
locked-fields: []
consumed_by_modules: []
---

# Đặc tả nghiệp vụ: Quản lý tài khoản người dùng

**Tài liệu:** Tài liệu chức năng — phần riêng (theo mẫu này)
**Chức năng:** F-001
**Module:** M-001 — Quản trị hệ thống
**Loại:** chức năng có bước phê duyệt (tài khoản tự đăng ký F-271)
**Tham chiếu:** tài liệu nền `ba/01-base-pattern.md` (bắt buộc đọc trước) + tài liệu yêu cầu gốc (TKCT)

> **Trước khi viết:** đọc tài liệu nền của module để biết phần CHUNG. File này CHỈ ghi phần RIÊNG của chức năng — không lặp lại phần chung.

---

## 1. Mô tả ngắn

**F-001 Quản lý tài khoản người dùng** là module quản lý toàn bộ vòng đời của một tài khoản trong hệ thống. Bao gồm: Tạo mới, Chỉnh sửa thông tin, Xem chi tiết, Khóa/Hủy kích hoạt (không xóa) và Quản lý quyền truy cập động.

Module này là nền tảng bắt buộc cho mọi hoạt động hệ thống — không có tài khoản người dùng thì tất cả các module nghiệp vụ khác (F-002 đến F-006) không thể vận hành.

---

## 2. Trường dữ liệu

### 2.1. Form Tạo mới tài khoản (9 trường)

Form tạo tài khoản gồm **09 trường** nhập liệu, tuân thủ thứ tự bắt buộc sau:

| STT | Tên Trường (Hiển thị) | Field Name (API/DB) | Loại ĐK | Bắt buộc | Giá trị mặc định | Ghi chú |
|---|---|---|---|---|---|---|
| 1 | **Đơn vị trực thuộc** | `orgUnitId` | TreeSelect | ✅ Có | — | Chọn từ cây đơn vị phân cấp (OrgUnitTreeSelect). |
| 2 | **Email** | `email` | Input email | ✅ Có | — | **Đóng vai trò là tên đăng nhập** (username). Phải unique. |
| 3 | **Họ và tên** | `fullName` | Input text | ✅ Có | — | Tối đa 200 ký tự. |
| 4 | **Số điện thoại** | `phone` | Input text | ❌ Không | — | 10-11 chữ số nếu nhập. |
| 5 | **Địa chỉ** | `address` | Input text | ❌ Không | — | Tối đa 255 ký tự. |
| 6 | **Phòng ban** | `department` | Input text | ✅ Có | — | Tối đa 100 ký tự. |
| 7 | **Chức vụ** | `position` | Input text | ❌ Không | — | Tối đa 100 ký tự. |
| 8 | **Trạng thái** | `status` | Select | ✅ Có | Kích hoạt | Chọn: **Kích hoạt** (Active) hoặc **Hủy kích hoạt** (Inactive). |
| 9 | **Ghi chú** | `note` | TextArea | ❌ Không | — | Tối đa 500 ký tự. |

> **Quy tắc Mật khẩu:** Không có trường nhập mật khẩu trên form tạo. Hệ thống tự động gán mật khẩu mặc định là `"Asdqwe@123"` cho tài khoản mới.

### 2.2. Trường dữ liệu khi Chỉnh sửa (Edit)

Sau khi tạo, người dùng có quyền `user:manage` hoặc chính tài khoản đó có thể chỉnh sửa:
*   **Trường được sửa:** Họ và tên, Điện thoại, Địa chỉ, Phòng ban, Chức vụ, Ghi chú, Trạng thái (Active/Inactive).
*   **Trường KHÔNG được sửa:** Đơn vị trực thuộc, Email (Username), Mật khẩu. (Nếu cần thay đổi đơn vị hoặc email, bắt buộc tạo tài khoản mới).

---

## 3. Trạng thái và phê duyệt

### 3.1. Các trạng thái tài khoản
Hệ thống quản lý tài khoản theo các trạng thái sau (Enum `UserStatus`):
*   **ACTIVE (Kích hoạt):** Tài khoản hoạt động bình thường.
*   **INACTIVE (Hủy kích hoạt):** Tài khoản bị khóa tạm thời, không đăng nhập được.
*   **LOCKED:** Tài khoản bị khóa do vi phạm bảo mật (ví dụ: đăng nhập sai quá 5 lần).
*   **PENDING_APPROVAL:** Chờ phê duyệt (áp dụng cho trường hợp Tự đăng ký - F-271).

### 3.2. Quy trình phê duyệt
*   **Admin tạo mới:** Tài khoản được **kích hoạt trực tiếp ngay lập tức** (Trạng thái `ACTIVE`). Không cần bất kỳ bước phê duyệt nào từ Lãnh đạo.
*   **Người dùng tự đăng ký (F-271):** Tài khoản sinh ra ở trạng thái `PENDING_APPROVAL`. Cần người có quyền `user:approve` xem xét và Phê duyệt/Từ chối.

---

## 4. Quy tắc và phân quyền riêng

### 4.1. Phân quyền động (Dynamic Permissions)
Hệ thống **không sử dụng Vai trò cố định (Role-based)** nữa. Quyền được gán động dựa trên cơ chế `<resource>:<action>`.
*   **Gán trực tiếp cho Tài khoản:** Gán từng quyền cụ thể (ví dụ: `user:manage`, `user:read`) cho tài khoản cá nhân.
*   **Gán cho Nhóm tài khoản:** Tạo nhóm → gán quyền cho nhóm → thêm người vào nhóm. Quyền của tài khoản = Quyền gán riêng + Quyền của nhóm.
*   **Admin Cục:** Tài khoản có quyền `user:manage` được gán thêm designation Admin Cục, cho phép xem các metadata nhạy cảm (người tạo, người sửa, thời gian tạo/sửa).

### 4.2. Quy tắc nghiệp vụ (Business Rules)

| ID | Tên Quy Tắc | Mô Tả Chi Tiết |
|---|---|---|
| **BR-001** | **Tính duy nhất** | Email và Tên đăng nhập phải duy nhất toàn hệ thống. |
| **BR-002** | **Chính sách mật khẩu** | Khi tự đặt lại mật khẩu (Quên mật khẩu), mật khẩu bắt buộc ≥ 8 ký tự, có chữ HOA, chữ thường, số và ký tự đặc biệt. |
| **BR-003** | **Không xóa tài khoản** | **Tài khoản không bao giờ bị xóa (delete) khỏi hệ thống.** Chỉ được thay đổi trạng thái sang Hủy kích hoạt (Inactive) hoặc Locked để phục vụ việc kiểm toán (Audit). |
| **BR-004** | **Bảo mật đăng nhập** | Tự động khóa (Locked) tài khoản nếu đăng nhập sai mật khẩu 5 lần liên tiếp. Tự mở khóa sau 30 phút hoặc Admin mở thủ công. |
| **BR-005** | **Quên mật khẩu** | Admin **KHÔNG** có thao tác "Đặt lại mật khẩu" cho user khác. Quy trình là: Người dùng tự ấn "Quên mật khẩu" → Hệ thống gửi email link đặt lại mật khẩu → Người dùng tự thực hiện. |
| **BR-006** | **Token đặt lại mật khẩu** | Link đặt lại mật khẩu trong email chỉ có hiệu lực tối đa 1 giờ. |
| **BR-007** | **Mật khẩu mặc định** | Tài khoản do Admin tạo mới sẽ sử dụng mật khẩu hệ thống gán sẵn là `"Asdqwe@123"`. |
| **BR-008** | **Nhật ký thay đổi trạng thái** | Mọi lần thay đổi trạng thái tài khoản (Active, Inactive, Locked) phải được ghi lại nhật ký vào bảng `UserStatusLog` (ai thay đổi, lúc nào, lý do). |

---

## 5. Điểm khác biệt so với mẫu chung (bắt buộc điền đủ 8 dòng)

| # | Điểm cần khai báo | Khai báo của chức năng này |
|---|---|---|
| 1 | Trạng thái riêng | Có — ACTIVE / INACTIVE / LOCKED / PENDING_APPROVAL |
| 2 | Có bước phê duyệt không | Có — tài khoản tự đăng ký (F-271) cần `user:approve`; Admin tạo thì ACTIVE ngay |
| 3 | Lọc cha-con / theo đơn vị | Có — lọc theo đơn vị trực thuộc (orgUnitId, TreeSelect) |
| 4 | Trường chỉ hiện trong điều kiện nào | Có — trường "Lý do" chỉ hiện khi Khóa/Hủy kích hoạt; không có trường mật khẩu (hệ thống tự gán) |
| 5 | Quyền riêng | `user:read`, `user:create`, `user:update`, `user:lock`, `user:approve`, `user:manage` |
| 6 | Đường dẫn dùng chung không cần đăng nhập | Có — POST `/api/users/pending`, `/api/auth/forgot-password`, `/api/auth/reset-password/{token}` (rate-limited) |
| 7 | Tải lên tệp | Không |
| 8 | Giao diện khác mẫu chung | Có — 2 ô tìm kiếm, không có nút Xóa (thay bằng Hủy kích hoạt/Khóa), modal Khóa bắt buộc lý do |

---

## 6. Phần kỹ thuật — đường dẫn gọi dữ liệu (ĐỀ XUẤT)

| Method | Đường dẫn | Mô tả | Quyền (Permission) |
|---|---|---|---|
| GET | `/api/users` | Danh sách người dùng (phân trang, lọc trạng thái/đơn vị, tìm kiếm 2 ô) | `user:read` |
| GET | `/api/users/{id}` | Xem chi tiết thông tin tài khoản người dùng | `user:read` |
| POST | `/api/users` | Tạo mới tài khoản (gửi kèm 9 trường dữ liệu) | `user:create` hoặc `user:manage` |
| PUT | `/api/users/{id}` | Chỉnh sửa thông tin tài khoản | `user:update` hoặc `user:manage` |
| POST | `/api/users/{id}/lock` | Khóa tài khoản (có lý do) | `user:lock` hoặc `user:manage` |
| POST | `/api/users/{id}/unlock` | Mở khóa tài khoản | `user:lock` hoặc `user:manage` |
| PATCH | `/api/users/{id}/status` | Đổi trạng thái tài khoản | `user:lock`, `user:update` hoặc `user:manage` |
| GET | `/api/users/me` | Xem/sửa thông tin cá nhân | JWT (tự quản lý) |
| POST | `/api/users/pending` | Nộp đơn đăng ký tài khoản (F-271) | Công khai (rate-limited 5 lần/giờ/IP) |
| POST | `/api/auth/forgot-password` | Yêu cầu link đặt lại mật khẩu | Công khai (rate-limited 3 lần/15 phút) |
| POST | `/api/auth/reset-password/{token}` | Đặt lại mật khẩu bằng token | Công khai (hết hạn 1 giờ) |

---

## 7. Phần kỹ thuật — cấu trúc bảng

**Bảng `app_users` (Entity: `User.java`):**
*   **Các trường chính:** `id`, `email` (unique), `username` (tự sinh từ email), `passwordHash` (BCrypt), `fullName`, `phone`, `address`, `department`, `position`, `note`, `orgUnitId` (FK), `status` (INT Enum), `deletedAt` (NULL — không xóa cứng).
*   **🔴 Trường hồ sơ mới (migration `V20260814120000__add_user_profile_columns.sql`):** `address`, `department`, `position`, `note`. Các trường này nullable để an toàn với dữ liệu cũ.

**Bảng `UserStatusLog` (Mới - phục vụ BR-008):**
*   Lưu lại lịch sử thay đổi trạng thái: `userId`, `previousStatus`, `newStatus`, `changedBy` (ai thay đổi), `reason` (lý do), `changedAt`.

**Bảng `PasswordResetToken` (Mới - phục vụ BR-005):**
*   Lưu token cho luồng Quên mật khẩu: `userId`, `token`, `expiresAt` (1 giờ), `usedAt`, `createdAt`.
